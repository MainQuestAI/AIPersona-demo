from __future__ import annotations

import base64
import json
from urllib.parse import urlparse
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.core.auth import (
    SESSION_COOKIE_NAME,
    AuthUnavailableError,
    TeamMembership,
    create_session_token,
    ensure_dev_auth_session,
    ensure_shared_demo_team_membership,
    list_user_teams,
    revoke_session_token,
    upsert_local_auth_user,
)


router = APIRouter(tags=["auth"])


class DisabledAuthEndpointResponse(BaseModel):
    detail: str


def _request_origin(request: Request) -> str:
    forwarded_proto = request.headers.get("x-forwarded-proto", "").split(",")[0].strip()
    scheme = forwarded_proto or request.url.scheme
    host = request.headers.get("x-forwarded-host", "").split(",")[0].strip() or request.headers.get("host") or request.url.netloc
    return f"{scheme}://{host}".rstrip("/")


def _cookie_secure(request: Request) -> bool:
    return _request_origin(request).startswith("https://")


def _set_session_cookie(response: Response, request: Request, session_token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_token,
        httponly=True,
        samesite="lax",
        secure=_cookie_secure(request),
        path="/",
        max_age=24 * 60 * 60,
    )


def _clear_session_cookie(response: Response, request: Request) -> None:
    response.delete_cookie(
        SESSION_COOKIE_NAME,
        httponly=True,
        samesite="lax",
        secure=_cookie_secure(request),
        path="/",
    )


def _is_local_request(request: Request) -> bool:
    local_hosts = {"127.0.0.1", "::1", "localhost"}
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    client_host = forwarded or (request.client.host if request.client else "")
    if client_host in local_hosts:
        return True

    request_host = request.headers.get("x-forwarded-host", "").split(",")[0].strip() or request.headers.get("host") or request.url.netloc
    hostname = urlparse(f"http://{request_host}").hostname
    if hostname not in local_hosts:
        return False

    for header_name in ("origin", "referer"):
        raw_value = request.headers.get(header_name, "").strip()
        if not raw_value:
            continue
        parsed_host = urlparse(raw_value).hostname
        if parsed_host in local_hosts:
            return True

    return False


def _decode_state(raw_state: str | None) -> dict[str, str]:
    if not raw_state:
        return {"redirect_path": "/dashboard", "web_origin": ""}

    try:
        padded = raw_state + "=" * (-len(raw_state) % 4)
        payload = base64.urlsafe_b64decode(padded.encode()).decode()
        parsed = json.loads(payload)
    except Exception as exc:  # pragma: no cover - malformed input branch
        raise HTTPException(status_code=400, detail="OAuth state 无法解析") from exc

    redirect_path = str(parsed.get("redirect_path") or "/dashboard")
    web_origin = str(parsed.get("web_origin") or "")
    if not redirect_path.startswith("/"):
        raise HTTPException(status_code=400, detail="OAuth state 中的 redirect_path 非法")
    return {"redirect_path": redirect_path, "web_origin": web_origin.rstrip("/")}


def _validate_web_origin(request: Request, web_origin: str) -> str:
    settings = request.app.state.settings
    if not web_origin:
        raise HTTPException(status_code=400, detail="OAuth state 缺少 web_origin")
    if web_origin not in settings.web_app_origins:
        raise HTTPException(status_code=400, detail="当前 web_origin 未被允许")
    return web_origin


def _build_callback_redirect(request: Request) -> str:
    return f"{_request_origin(request)}/api/oauth/callback"


def _exchange_code_for_token(
    *,
    oauth_server_url: str,
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
) -> dict[str, Any]:
    payload = json.dumps(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret,
        }
    ).encode("utf-8")
    req = urllib_request.Request(
        f"{oauth_server_url}/oauth/token",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=exc.code, detail=f"OAuth token exchange failed: {detail or exc.reason}") from exc
    except OSError as exc:
        raise HTTPException(status_code=502, detail="MainQuest-Auth token endpoint 不可用") from exc


def _fetch_oauth_user_info(*, oauth_server_url: str, access_token: str) -> dict[str, Any]:
    req = urllib_request.Request(
        f"{oauth_server_url}/oauth/me",
        headers={"Authorization": f"Bearer {access_token}"},
        method="GET",
    )
    try:
        with urllib_request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=exc.code, detail=f"OAuth user info failed: {detail or exc.reason}") from exc
    except OSError as exc:
        raise HTTPException(status_code=502, detail="MainQuest-Auth user info endpoint 不可用") from exc


def _select_active_team(
    *,
    teams: list[TeamMembership],
    requested_team_id: str,
    shared_demo_team_slug: str,
) -> TeamMembership:
    if requested_team_id:
        matched = next((team for team in teams if team.id == requested_team_id), None)
        if matched is None:
            raise HTTPException(status_code=403, detail="当前账号无权访问该团队")
        return matched

    shared = next((team for team in teams if team.slug == shared_demo_team_slug), None)
    if shared is not None:
        return shared

    if not teams:
        raise HTTPException(status_code=403, detail="当前账号尚未加入任何团队")

    return teams[0]


@router.get("/api/oauth/callback")
async def oauth_callback(request: Request, code: str, state: str | None = None) -> Response:
    settings = request.app.state.settings
    state_payload = _decode_state(state)
    web_origin = _validate_web_origin(request, state_payload["web_origin"])
    redirect_uri = _build_callback_redirect(request)

    token_payload = _exchange_code_for_token(
        oauth_server_url=settings.oauth_server_url,
        client_id=settings.oauth_client_id,
        client_secret=settings.oauth_client_secret,
        code=code,
        redirect_uri=redirect_uri,
    )
    access_token = str(token_payload.get("access_token") or "").strip()
    if not access_token:
        raise HTTPException(status_code=502, detail="OAuth token response 缺少 access_token")

    user_info = _fetch_oauth_user_info(
        oauth_server_url=settings.oauth_server_url,
        access_token=access_token,
    )
    auth_user_id = str(user_info.get("id") or "").strip()
    email = str(user_info.get("email") or "").strip()
    display_name = str(user_info.get("name") or user_info.get("companyName") or email or "MirrorWorld User")
    avatar_url = str(user_info.get("avatarUrl") or user_info.get("avatar_url") or "").strip() or None

    if not auth_user_id or not email:
        raise HTTPException(status_code=502, detail="OAuth user info 缺少关键字段")

    local_user = upsert_local_auth_user(
        database_url=settings.database_url,
        auth_user_id=auth_user_id,
        email=email,
        display_name=display_name,
        avatar_url=avatar_url,
        auth_provider="mainquest-auth",
    )
    ensure_shared_demo_team_membership(
        database_url=settings.database_url,
        user_id=local_user.id,
        team_slug=settings.shared_demo_team_slug,
        team_name=settings.shared_demo_team_name,
    )
    session_token, _ = create_session_token(
        database_url=settings.database_url,
        user_id=local_user.id,
        session_type="oauth",
        created_by_auth_user_id=auth_user_id,
    )

    response = RedirectResponse(
        url=f"{web_origin}{state_payload['redirect_path']}",
        status_code=302,
    )
    _set_session_cookie(response, request, session_token)
    return response


@router.get("/auth/me")
async def auth_me(request: Request) -> dict[str, Any]:
    settings = request.app.state.settings
    auth_context = getattr(request.state, "auth_context", None)
    user = getattr(request.state, "current_user", None)
    if auth_context is None or user is None:
        raise HTTPException(status_code=401, detail="需要登录后才能访问")

    try:
        teams = list_user_teams(database_url=settings.database_url, user_id=user.id)
    except AuthUnavailableError as exc:
        raise HTTPException(status_code=503, detail="团队信息服务暂不可用") from exc

    active_team = _select_active_team(
        teams=teams,
        requested_team_id=(request.headers.get("X-Team-Id") or "").strip(),
        shared_demo_team_slug=settings.shared_demo_team_slug,
    )

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "auth_user_id": user.auth_user_id,
            "auth_provider": user.auth_provider,
        },
        "team": {
            "id": active_team.id,
            "name": active_team.name,
            "slug": active_team.slug,
            "member_role": active_team.member_role,
        },
        "teams": [
            {
                "id": team.id,
                "name": team.name,
                "slug": team.slug,
                "member_role": team.member_role,
            }
            for team in teams
        ],
        "active_team_id": active_team.id,
        "auth_mode": auth_context.session_type or "oauth",
    }


@router.post("/auth/logout")
async def auth_logout(request: Request) -> Response:
    settings = request.app.state.settings
    auth_context = getattr(request.state, "auth_context", None)
    response = Response(status_code=204)
    if auth_context is not None and auth_context.session_token:
        revoke_session_token(
            database_url=settings.database_url,
            session_token=auth_context.session_token,
        )
    _clear_session_cookie(response, request)
    return response


@router.get("/api/dev/login")
async def dev_login(request: Request, redirect_to: str = "/dashboard") -> Response:
    settings = request.app.state.settings
    if not settings.enable_dev_auth:
        raise HTTPException(status_code=404, detail="Dev Auth 已禁用")
    if not _is_local_request(request):
        raise HTTPException(status_code=403, detail="Dev Auth 只允许 localhost 访问")
    if not redirect_to.startswith("/"):
        raise HTTPException(status_code=400, detail="redirect_to 非法")

    _, _, session_token, _ = ensure_dev_auth_session(
        database_url=settings.database_url,
        shared_demo_team_slug=settings.shared_demo_team_slug,
        shared_demo_team_name=settings.shared_demo_team_name,
    )
    redirect_origin = next(iter(settings.web_app_origins), "").rstrip("/")
    if not redirect_origin:
        raise HTTPException(status_code=500, detail="WEB_APP_ORIGINS 未配置")

    response = RedirectResponse(url=f"{redirect_origin}{redirect_to}", status_code=302)
    _set_session_cookie(response, request, session_token)
    return response


@router.post("/auth/login", response_model=DisabledAuthEndpointResponse, status_code=410)
async def disabled_login() -> DisabledAuthEndpointResponse:
    return DisabledAuthEndpointResponse(detail="本地账号登录已下线，请使用 MainQuest Auth")


@router.post("/auth/register", response_model=DisabledAuthEndpointResponse, status_code=410)
async def disabled_register() -> DisabledAuthEndpointResponse:
    return DisabledAuthEndpointResponse(detail="本地账号注册已下线，请联系管理员在 MainQuest Auth 开通产品权限")
