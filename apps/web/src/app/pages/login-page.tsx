import { Loader2, LockKeyhole, ScanEye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  buildOAuthLoginUrl,
  canUseDevAuth,
  fetchAuthSession,
  persistAuthSession,
} from '../services/auth-session';
import { resolveRuntimeApiBase } from '../services/runtimeApiBase';

type LoginState = 'checking' | 'ready' | 'redirecting';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<LoginState>('checking');
  const [error, setError] = useState<string | null>(null);
  const redirectPath = useMemo(() => {
    const raw = searchParams.get('redirect') || '/dashboard';
    return raw.startsWith('/') ? raw : '/dashboard';
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await fetchAuthSession();
        if (cancelled) {
          return;
        }
        if (session) {
          persistAuthSession(session);
          navigate(redirectPath, { replace: true });
          return;
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : '读取登录状态失败');
      } finally {
        if (!cancelled) {
          setState('ready');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, redirectPath]);

  function handleMainQuestLogin() {
    try {
      setState('redirecting');
      window.location.href = buildOAuthLoginUrl(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成登录跳转失败');
      setState('ready');
    }
  }

  function handleDevLogin() {
    setState('redirecting');
    const apiBase = resolveRuntimeApiBase();
    const url = new URL(`${apiBase}/api/dev/login`);
    url.searchParams.set('redirect_to', redirectPath);
    window.location.href = url.toString();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent mb-4">
            <ScanEye className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-text">MirrorWorld</h1>
          <p className="mt-2 text-sm text-muted">通过 MainQuest Auth 进入 AI 消费者研究工作台</p>
        </div>

        <div className="rounded-panel border border-line bg-panel p-6 shadow-panel">
          <div className="space-y-4">
            <div className="rounded-btn border border-line/80 bg-base/60 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-accent/15 p-2 text-accent">
                  <LockKeyhole className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text">统一认证入口</div>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    本产品已切换到 MainQuest Auth。你需要先在 Auth 侧获得 AIpersona-demo 产品权限，随后通过 OAuth 回到当前工作台。
                  </p>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-btn border border-danger/30 bg-dangerSoft px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleMainQuestLogin}
              disabled={state !== 'ready'}
              className="btn-accent w-full justify-center"
            >
              {state === 'checking' || state === 'redirecting' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              使用 MainQuest Auth 登录
            </button>

            {canUseDevAuth() ? (
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={state !== 'ready'}
                className="btn-secondary w-full justify-center"
              >
                本地 Dev Auth 登录
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
