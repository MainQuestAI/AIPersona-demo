import { Loader2, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveRuntimeApiBase } from '../services/runtimeApiBase';

const API_BASE = resolveRuntimeApiBase();
const AUTH_REQUEST_TIMEOUT_MS = 8_000;
const DEV_FALLBACK_TOKEN = 'apt_dev_local_demo';

type AuthMode = 'login' | 'register';

function persistAuthSession(data: {
  token?: string;
  user?: Record<string, unknown>;
  teams?: unknown[];
}) {
  localStorage.setItem('aipersona_token', data.token ?? '');
  localStorage.setItem('aipersona_user', JSON.stringify(data.user ?? {}));
  if (data.teams?.length) {
    localStorage.setItem('aipersona_teams', JSON.stringify(data.teams));
  } else {
    localStorage.removeItem('aipersona_teams');
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function completeDevelopmentFallbackLogin() {
    const fallbackDisplayName = mode === 'register'
      ? (displayName.trim() || 'MirrorWorld Demo')
      : (email.split('@')[0]?.trim() || 'MirrorWorld Demo');
    persistAuthSession({
      token: DEV_FALLBACK_TOKEN,
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        email: email.trim() || 'demo@mirrorworld.local',
        display_name: fallbackDisplayName,
        role: 'owner',
      },
      teams: [{
        id: '00000000-0000-4000-8000-000000000101',
        name: teamName.trim() || 'MirrorWorld Demo Team',
        slug: 'mirrorworld-demo-team',
        member_role: 'owner',
      }],
    });
    navigate('/dashboard');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
    const body = mode === 'login'
      ? { email, password }
      : { email, password, display_name: displayName, team_name: teamName || undefined };

    try {
      const resp = await Promise.race([
        fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        new Promise<Response>((_, reject) => {
          setTimeout(() => reject(new Error('登录超时，请确认本地 API 服务已启动')), AUTH_REQUEST_TIMEOUT_MS);
        }),
      ]);

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (import.meta.env.DEV && (resp.status >= 500 || data.code === 'auth_unavailable')) {
          completeDevelopmentFallbackLogin();
          return;
        }
        throw new Error(data.detail || `请求失败：${resp.status}`);
      }

      const data = await resp.json();
      persistAuthSession(data);

      navigate('/dashboard');
    } catch (err) {
      if (import.meta.env.DEV) {
        completeDevelopmentFallbackLogin();
        return;
      }
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent mb-4">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-text">MirrorWorld</h1>
          <p className="mt-1 text-sm text-muted">AI 消费者研究工作台</p>
        </div>

        <div className="rounded-panel border border-line bg-panel p-6 shadow-panel">
          {/* Mode tabs */}
          <div className="flex gap-1 mb-5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-btn py-2 text-sm font-medium transition ${
                mode === 'login' ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-btn py-2 text-sm font-medium transition ${
                mode === 'register' ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {mode === 'register' ? (
              <div>
                <label htmlFor="display-name" className="text-xs font-medium text-muted">显示名称</label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的名字"
                  required
                  className="mt-1 w-full rounded-btn border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none"
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="text-xs font-medium text-muted">邮箱</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1 w-full rounded-btn border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium text-muted">密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位"
                required
                minLength={6}
                className="mt-1 w-full rounded-btn border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none"
              />
            </div>

            {mode === 'register' ? (
              <div>
                <label htmlFor="team-name" className="text-xs font-medium text-muted">团队名称（可选）</label>
                <input
                  id="team-name"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="如：Danone Research Team"
                  className="mt-1 w-full rounded-btn border border-line bg-panel px-3 py-2 text-sm text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none"
                />
              </div>
            ) : null}

            {error ? (
              <div className="rounded-btn border border-danger/30 bg-dangerSoft px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={loading} className="btn-accent w-full justify-center">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
