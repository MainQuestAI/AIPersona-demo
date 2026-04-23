from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import os
import secrets
from typing import Any

import psycopg
from psycopg.rows import dict_row


SESSION_TTL_HOURS = 24
DB_CONNECT_TIMEOUT_SECONDS = 5
DB_STATEMENT_TIMEOUT_MS = 8_000
DEV_FALLBACK_TOKEN = "apt_dev_local_demo"
DEV_FALLBACK_USER_ID = "00000000-0000-4000-8000-000000000001"
DEV_FALLBACK_TEAM_ID = "00000000-0000-4000-8000-000000000101"


class AuthUnavailableError(RuntimeError):
    """Raised when auth cannot be evaluated due to infrastructure issues."""


class MissingCredentialsError(RuntimeError):
    """Raised when a protected route is called without credentials."""


class InvalidCredentialsError(RuntimeError):
    """Raised when presented credentials cannot be validated."""


@dataclass(frozen=True)
class SessionUser:
    id: str
    email: str
    display_name: str
    role: str


@dataclass(frozen=True)
class AuthContext:
    user: SessionUser | None = None
    api_key_id: str | None = None
    api_key_scope: str | None = None


@dataclass(frozen=True)
class TeamMembership:
    id: str
    name: str
    slug: str
    member_role: str


def hash_secret(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


def development_auth_enabled() -> bool:
    app_env = os.getenv("APP_ENV", "development").strip().lower()
    raw_flag = os.getenv("DEV_AUTH_FALLBACK", "true").strip().lower()
    return app_env == "development" and raw_flag not in {"0", "false", "no", "off"}


def _development_session_user(
    *,
    email: str = "demo@mirrorworld.local",
    display_name: str = "MirrorWorld Demo",
) -> SessionUser:
    return SessionUser(
        id=DEV_FALLBACK_USER_ID,
        email=email,
        display_name=display_name,
        role="owner",
    )


def list_user_teams(*, database_url: str, user_id: str) -> list[TeamMembership]:
    if development_auth_enabled() and user_id == DEV_FALLBACK_USER_ID:
        return [
            TeamMembership(
                id=DEV_FALLBACK_TEAM_ID,
                name="MirrorWorld Demo Team",
                slug="mirrorworld-demo-team",
                member_role="owner",
            )
        ]

    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT t.id, t.name, t.slug, tm.role AS member_role
                    FROM team_member tm
                    JOIN team t ON t.id = tm.team_id
                    WHERE tm.user_id = %s
                    ORDER BY tm.joined_at, t.created_at
                    """,
                    (user_id,),
                )
                rows = cursor.fetchall()
    except Exception as exc:
        raise AuthUnavailableError("failed to load user teams") from exc

    return [
        TeamMembership(
            id=str(row["id"]),
            name=str(row["name"]),
            slug=str(row["slug"]),
            member_role=str(row["member_role"]),
        )
        for row in rows
    ]


def build_development_auth_response(
    *,
    email: str,
    display_name: str,
    team_name: str | None = None,
) -> dict[str, Any]:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)
    team_label = (team_name or "MirrorWorld Demo Team").strip() or "MirrorWorld Demo Team"
    team_slug = "-".join(team_label.lower().split()) or "mirrorworld-demo-team"
    return {
        "user": {
            "id": DEV_FALLBACK_USER_ID,
            "email": email,
            "display_name": display_name,
            "role": "owner",
        },
        "team": {
            "id": DEV_FALLBACK_TEAM_ID,
            "name": team_label,
            "slug": team_slug,
        },
        "teams": [{
            "id": DEV_FALLBACK_TEAM_ID,
            "name": team_label,
            "slug": team_slug,
            "member_role": "owner",
        }],
        "token": DEV_FALLBACK_TOKEN,
        "expires_at": expires_at.isoformat(),
    }


def connect_auth_database(database_url: str) -> psycopg.Connection[Any]:
    return psycopg.connect(
        database_url,
        row_factory=dict_row,
        connect_timeout=DB_CONNECT_TIMEOUT_SECONDS,
        options=f"-c statement_timeout={DB_STATEMENT_TIMEOUT_MS}",
    )


def create_session_token(*, database_url: str, user_id: str, ttl_hours: int = SESSION_TTL_HOURS) -> tuple[str, str]:
    raw_token = f"apt_{secrets.token_urlsafe(32)}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=ttl_hours)

    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO app_session (token_hash, user_id, expires_at)
                    VALUES (%s, %s, %s)
                    """,
                    (hash_secret(raw_token), user_id, expires_at),
                )
            connection.commit()
    except Exception as exc:  # pragma: no cover - exercised through route tests
        raise AuthUnavailableError("failed to create session") from exc

    return raw_token, expires_at.isoformat()


def resolve_auth_context(
    *,
    database_url: str,
    authorization: str | None,
    api_key: str | None,
) -> AuthContext:
    bearer_token = _extract_bearer_token(authorization)
    if development_auth_enabled() and bearer_token == DEV_FALLBACK_TOKEN:
        return AuthContext(user=_development_session_user())
    if bearer_token:
        return _resolve_session_user(database_url=database_url, bearer_token=bearer_token)
    if api_key:
        return _resolve_api_key(database_url=database_url, api_key=api_key)
    raise MissingCredentialsError("missing credentials")


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


def _resolve_session_user(*, database_url: str, bearer_token: str) -> AuthContext:
    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT u.id, u.email, u.display_name, u.role
                    FROM app_session s
                    JOIN app_user u ON u.id = s.user_id
                    WHERE s.token_hash = %s
                      AND s.revoked_at IS NULL
                      AND s.expires_at > now()
                      AND u.is_active = true
                    """,
                    (hash_secret(bearer_token),),
                )
                user = cursor.fetchone()
                if user:
                    cursor.execute(
                        "UPDATE app_session SET last_used_at = now() WHERE token_hash = %s",
                        (hash_secret(bearer_token),),
                    )
            connection.commit()
    except Exception as exc:
        raise AuthUnavailableError("failed to validate session") from exc

    if not user:
        raise InvalidCredentialsError("invalid bearer token")

    return AuthContext(
        user=SessionUser(
            id=str(user["id"]),
            email=str(user["email"]),
            display_name=str(user["display_name"]),
            role=str(user["role"]),
        )
    )


def _resolve_api_key(*, database_url: str, api_key: str) -> AuthContext:
    key_hash = hash_secret(api_key)
    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, scope
                    FROM api_key
                    WHERE key_hash = %s
                      AND is_active = true
                      AND (expires_at IS NULL OR expires_at > now())
                    """,
                    (key_hash,),
                )
                row = cursor.fetchone()
                if row:
                    cursor.execute(
                        "UPDATE api_key SET last_used_at = now() WHERE id = %s",
                        (row["id"],),
                    )
            connection.commit()
    except Exception as exc:
        raise AuthUnavailableError("failed to validate api key") from exc

    if not row:
        raise InvalidCredentialsError("invalid api key")

    return AuthContext(api_key_id=str(row["id"]), api_key_scope=str(row["scope"]))
