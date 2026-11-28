import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Command, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import './auth.css';

type AuthUser = { id: string; email: string; displayName: string };
type AuthResponse = { data?: { user: AuthUser; accessToken: string }; error?: { message?: string } };
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api/v1';
let refreshRequest: Promise<{ ok: boolean; payload: AuthResponse }> | null = null;
const restoreSession = () => {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() as AuthResponse }))
      .finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
};

export default function AuthGate({ children }: { children: (user: AuthUser, accessToken: string, onAccessTokenChange: (token: string) => void, onLogout: () => Promise<void>) => ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const acceptSession = (payload: AuthResponse) => {
    if (!payload.data) throw new Error(payload.error?.message ?? 'Unable to establish a session.');
    setAccessToken(payload.data.accessToken);
    setUser(payload.data.user);
  };

  useEffect(() => {
    let active = true;
    restoreSession()
      .then(({ ok, payload }) => { if (active && ok) acceptSession(payload); })
      .catch(() => { /* An unauthenticated visitor is expected on first load. */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/${mode}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register' ? { displayName, email, password } : { email, password })
      });
      const payload = await response.json() as AuthResponse;
      if (!response.ok) throw new Error(payload.error?.message ?? 'Authentication failed.');
      acceptSession(payload);
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    try { await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }); }
    finally { setAccessToken(null); setUser(null); setPassword(''); setMode('login'); }
  };

  if (loading) return <div className="auth-loading"><span className="auth-spinner" /><p>Preparing your secure workspace…</p></div>;
  if (accessToken && user) return <>{children(user, accessToken, setAccessToken, logout)}</>;

  return <main className="auth-screen">
    <section className="auth-story">
      <a className="auth-brand" href="/"><span><Command size={20}/></span>Nexora<span className="auth-brand-dot">.</span></a>
      <div className="auth-story-copy">
        <span className="auth-kicker">CUSTOMER SUCCESS, CONNECTED</span>
        <h1>Build relationships that move business forward.</h1>
        <p>A unified workspace for customer health, product adoption, retention, and revenue intelligence.</p>
        <div className="auth-assurance"><ShieldCheck size={17}/><span>Secure identity and session management</span></div>
      </div>
      <span className="auth-story-foot">Enterprise Customer Success & Revenue Intelligence</span>
    </section>
    <section className="auth-panel">
      <div className="auth-form-wrap">
        <span className="auth-mobile-brand"><Command size={17}/> Nexora</span>
        <p className="auth-eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</p>
        <h2>{mode === 'login' ? 'Sign in to your workspace' : 'Create your Nexora account'}</h2>
        <p className="auth-subtitle">{mode === 'login' ? 'Enter your details to continue.' : 'Create your personal account, then establish or join an organization workspace.'}</p>
        <form onSubmit={submit}>
          {mode === 'register' && <label className="auth-field"><span>Full name</span><div><UserRound size={17}/><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" autoComplete="name" minLength={2} maxLength={100} required /></div></label>}
          <label className="auth-field"><span>Email address</span><div><Mail size={17}/><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required /></div></label>
          <label className="auth-field"><span>Password</span><div><LockKeyhole size={17}/><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 12 characters' : 'Enter your password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 12 : 1} maxLength={128} required /><button type="button" className="auth-eye" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
          {mode === 'register' && <p className="auth-password-hint">Use 12+ characters with uppercase, lowercase, number, and symbol.</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={17}/></button>
        </form>
        <p className="auth-switch">{mode === 'login' ? "New to Nexora?" : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        <div className="auth-privacy"><LockKeyhole size={13}/> Your refresh session is protected by an HttpOnly cookie.</div>
      </div>
    </section>
  </main>;
}
