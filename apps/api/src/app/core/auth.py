from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Any

import psycopg
from psycopg.rows import dict_row


SESSION_TTL_HOURS = 24
DB_CONNECT_TIMEOUT_SECONDS = 5
DB_STATEMENT_TIMEOUT_MS = 8_000
SESSION_COOKIE_NAME = "app_session_id"
DEV_LOCAL_USER_EMAIL = "demo@mirrorworld.local"
DEV_LOCAL_USER_NAME = "MirrorWorld Demo"


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
    avatar_url: str | None = None
    auth_user_id: str | None = None
    auth_provider: str | None = None


@dataclass(frozen=True)
class AuthContext:
    user: SessionUser | None = None
    api_key_id: str | None = None
    api_key_scope: str | None = None
    session_token: str | None = None
    session_type: str | None = None


@dataclass(frozen=True)
class TeamMembership:
    id: str
    name: str
    slug: str
    member_role: str


def hash_secret(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


def connect_auth_database(database_url: str) -> psycopg.Connection[Any]:
    return psycopg.connect(
        database_url,
        row_factory=dict_row,
        connect_timeout=DB_CONNECT_TIMEOUT_SECONDS,
        options=f"-c statement_timeout={DB_STATEMENT_TIMEOUT_MS}",
    )


def create_session_token(
    *,
    database_url: str,
    user_id: str,
    session_type: str,
    created_by_auth_user_id: str | None = None,
    ttl_hours: int = SESSION_TTL_HOURS,
) -> tuple[str, str]:
    raw_token = f"apt_{secrets.token_urlsafe(32)}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=ttl_hours)

    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO app_session (
                      token_hash,
                      user_id,
                      expires_at,
                      session_type,
                      created_by_auth_user_id
                    )
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        hash_secret(raw_token),
                        user_id,
                        expires_at,
                        session_type,
                        created_by_auth_user_id,
                    ),
                )
            connection.commit()
    except Exception as exc:  # pragma: no cover - exercised through route tests
        raise AuthUnavailableError("failed to create session") from exc

    return raw_token, expires_at.isoformat()


def revoke_session_token(*, database_url: str, session_token: str) -> None:
    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE app_session
                    SET revoked_at = now()
                    WHERE token_hash = %s
                      AND revoked_at IS NULL
                    """,
                    (hash_secret(session_token),),
                )
            connection.commit()
    except Exception as exc:  # pragma: no cover - exercised through route tests
        raise AuthUnavailableError("failed to revoke session") from exc


def list_user_teams(*, database_url: str, user_id: str) -> list[TeamMembership]:
    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT t.id, t.name, t.slug, tm.role AS member_role
                    FROM team_member tm
                    JOIN team t ON t.id = tm.team_id
                    WHERE tm.user_id = %s
                    ORDER BY t.is_shared_demo DESC, tm.joined_at, t.created_at
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


def upsert_local_auth_user(
    *,
    database_url: str,
    auth_user_id: str,
    email: str,
    display_name: str,
    avatar_url: str | None,
    auth_provider: str,
    role: str = "member",
) -> SessionUser:
    normalized_name = display_name.strip() or email.strip() or "MirrorWorld User"

    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, email, display_name, avatar_url, role, auth_user_id, auth_provider
                    FROM app_user
                    WHERE auth_user_id = %s
                    """,
                    (auth_user_id,),
                )
                existing = cursor.fetchone()

                if existing:
                    cursor.execute(
                        """
                        UPDATE app_user
                        SET email = %s,
                            display_name = %s,
                            avatar_url = %s,
                            auth_provider = %s,
                            last_auth_at = now(),
                            is_active = true,
                            updated_at = now()
                        WHERE id = %s
                        RETURNING id, email, display_name, avatar_url, role, auth_user_id, auth_provider
                        """,
                        (
                            email,
                            normalized_name,
                            avatar_url,
                            auth_provider,
                            existing["id"],
                        ),
                    )
                    user = cursor.fetchone()
                else:
                    cursor.execute(
                        """
                        INSERT INTO app_user (
                          email,
                          display_name,
                          password_hash,
                          avatar_url,
                          role,
                          is_active,
                          auth_user_id,
                          auth_provider,
                          last_auth_at
                        )
                        VALUES (%s, %s, NULL, %s, %s, true, %s, %s, now())
                        RETURNING id, email, display_name, avatar_url, role, auth_user_id, auth_provider
                        """,
                        (
                            email,
                            normalized_name,
                            avatar_url,
                            role,
                            auth_user_id,
                            auth_provider,
                        ),
                    )
                    user = cursor.fetchone()
            connection.commit()
    except Exception as exc:
        raise AuthUnavailableError("failed to upsert auth user projection") from exc

    return SessionUser(
        id=str(user["id"]),
        email=str(user["email"]),
        display_name=str(user["display_name"]),
        avatar_url=str(user["avatar_url"]) if user.get("avatar_url") else None,
        role=str(user["role"]),
        auth_user_id=str(user["auth_user_id"]) if user.get("auth_user_id") else None,
        auth_provider=str(user["auth_provider"]) if user.get("auth_provider") else None,
    )


def ensure_shared_demo_team_membership(
    *,
    database_url: str,
    user_id: str,
    team_slug: str,
    team_name: str,
) -> TeamMembership:
    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, name, slug, owner_id
                    FROM team
                    WHERE slug = %s
                    LIMIT 1
                    """,
                    (team_slug,),
                )
                team = cursor.fetchone()

                if team is None:
                    cursor.execute(
                        """
                        INSERT INTO team (name, slug, owner_id, is_shared_demo)
                        VALUES (%s, %s, %s, true)
                        RETURNING id, name, slug
                        """,
                        (team_name, team_slug, user_id),
                    )
                    team = cursor.fetchone()
                    cursor.execute(
                        """
                        INSERT INTO team_member (team_id, user_id, role)
                        VALUES (%s, %s, 'owner')
                        ON CONFLICT (team_id, user_id) DO NOTHING
                        """,
                        (team["id"], user_id),
                    )
                else:
                    cursor.execute(
                        """
                        UPDATE team
                        SET name = %s,
                            is_shared_demo = true,
                            updated_at = now()
                        WHERE id = %s
                        """,
                        (team_name, team["id"]),
                    )
                    cursor.execute(
                        """
                        INSERT INTO team_member (team_id, user_id, role)
                        VALUES (%s, %s, 'member')
                        ON CONFLICT (team_id, user_id) DO NOTHING
                        """,
                        (team["id"], user_id),
                    )

                cursor.execute(
                    """
                    SELECT t.id, t.name, t.slug, tm.role AS member_role
                    FROM team_member tm
                    JOIN team t ON t.id = tm.team_id
                    WHERE tm.team_id = %s
                      AND tm.user_id = %s
                    """,
                    (team["id"], user_id),
                )
                membership = cursor.fetchone()
            connection.commit()
    except Exception as exc:
        raise AuthUnavailableError("failed to ensure shared demo team") from exc

    if membership is None:
        raise AuthUnavailableError("failed to read shared demo team membership")

    return TeamMembership(
        id=str(membership["id"]),
        name=str(membership["name"]),
        slug=str(membership["slug"]),
        member_role=str(membership["member_role"]),
    )


def ensure_dev_auth_session(
    *,
    database_url: str,
    shared_demo_team_slug: str,
    shared_demo_team_name: str,
) -> tuple[SessionUser, TeamMembership, str, str]:
    user = upsert_local_auth_user(
        database_url=database_url,
        auth_user_id="dev-local-user",
        email=DEV_LOCAL_USER_EMAIL,
        display_name=DEV_LOCAL_USER_NAME,
        avatar_url=None,
        auth_provider="dev",
        role="member",
    )
    team = ensure_shared_demo_team_membership(
        database_url=database_url,
        user_id=user.id,
        team_slug=shared_demo_team_slug,
        team_name=shared_demo_team_name,
    )
    token, expires_at = create_session_token(
        database_url=database_url,
        user_id=user.id,
        session_type="dev",
        created_by_auth_user_id="dev-local-user",
    )
    return user, team, token, expires_at


def resolve_auth_context(
    *,
    database_url: str,
    authorization: str | None,
    api_key: str | None,
    session_cookie: str | None,
) -> AuthContext:
    bearer_token = _extract_bearer_token(authorization)
    if bearer_token:
        return _resolve_session_user(database_url=database_url, session_token=bearer_token)
    if session_cookie:
        return _resolve_session_user(database_url=database_url, session_token=session_cookie)
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


def _resolve_session_user(*, database_url: str, session_token: str) -> AuthContext:
    token_hash = hash_secret(session_token)
    try:
        with connect_auth_database(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                      u.id,
                      u.email,
                      u.display_name,
                      u.avatar_url,
                      u.role,
                      u.auth_user_id,
                      u.auth_provider,
                      s.session_type
                    FROM app_session s
                    JOIN app_user u ON u.id = s.user_id
                    WHERE s.token_hash = %s
                      AND s.revoked_at IS NULL
                      AND s.expires_at > now()
                      AND u.is_active = true
                    """,
                    (token_hash,),
                )
                user = cursor.fetchone()
                if user:
                    cursor.execute(
                        "UPDATE app_session SET last_used_at = now() WHERE token_hash = %s",
                        (token_hash,),
                    )
            connection.commit()
    except Exception as exc:
        raise AuthUnavailableError("failed to validate session") from exc

    if not user:
        raise InvalidCredentialsError("invalid session token")

    return AuthContext(
        user=SessionUser(
            id=str(user["id"]),
            email=str(user["email"]),
            display_name=str(user["display_name"]),
            avatar_url=str(user["avatar_url"]) if user.get("avatar_url") else None,
            role=str(user["role"]),
            auth_user_id=str(user["auth_user_id"]) if user.get("auth_user_id") else None,
            auth_provider=str(user["auth_provider"]) if user.get("auth_provider") else None,
        ),
        session_token=session_token,
        session_type=str(user["session_type"]),
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
