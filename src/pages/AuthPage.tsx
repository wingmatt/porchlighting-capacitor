import { FunctionComponent } from 'preact';
import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';
import styles from './AuthPage.module.css';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'magic-login';

export const AuthPage: FunctionComponent<{ mode: AuthMode }> = ({ mode }) => {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ uid: string; token: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isReset = mode === 'forgot-password' && Boolean(params.uid && params.token);
  const isMagicConfirm = mode === 'magic-login' && Boolean(params.uid && params.token);
  const isLogin = mode === 'login';
  const isRegister = mode === 'register';

  useEffect(() => {
    if (isMagicConfirm) {
      apiClient.get(`/auth/magic-login/${params.uid}/${params.token}/`).then(async (response) => {
        await loginWithToken(response.data.token, response.data.user);
        navigate('/profile');
      }).catch((requestError: any) => setError(requestError?.response?.data?.error || 'This magic login link is invalid or has expired.'));
    }
  }, [isMagicConfirm, loginWithToken, navigate, params.token, params.uid]);

  const submit = async (event: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      if (isLogin) { await login(email, password); navigate('/profile'); return; }
      if (isRegister) {
        const response = await apiClient.post('/auth/register/', { email, password, password_confirm: passwordConfirm, first_name: name });
        setMessage(response.data.message); return;
      }
      if (isReset) {
        const response = await apiClient.post(`/auth/password-reset/${params.uid}/${params.token}/`, { password, password_confirm: passwordConfirm });
        setMessage(response.data.message); return;
      }
      const endpoint = mode === 'magic-login' ? '/auth/magic-login/' : '/auth/password-reset/';
      const response = await apiClient.post(endpoint, { email });
      setMessage(response.data.message); return;
    } catch (requestError: any) {
      const data = requestError?.response?.data;
      setError(data?.detail || data?.error || data?.password?.[0] || data?.password_confirm?.[0] || 'Something went wrong.');
    }
  };

  if (isMagicConfirm) return <div className={styles.page}><div className={styles.card}><h1>Signing you in...</h1>{error && <p className={styles.error}>{error}</p>}</div></div>;
  const title = isLogin ? 'Log in' : isRegister ? 'Create your account' : isReset ? 'Choose a new password' : mode === 'magic-login' ? 'Email me a login link' : 'Reset your password';
  return <div className={styles.page}><div className={styles.card}>
    <h1>{title}</h1>
    {message && <p className={styles.success}>{message}</p>}
    {error && <p className={styles.error}>{error}</p>}
    {!message && <form onSubmit={submit}>
      {(!isReset || isLogin || isRegister || mode === 'magic-login') && <label>Email<input type="email" required value={email} onInput={(event) => setEmail(event.currentTarget.value)} /></label>}
      {isRegister && <label>Name<input value={name} onInput={(event) => setName(event.currentTarget.value)} /></label>}
      {(isLogin || isRegister || isReset) && <label>Password<input type="password" required minLength={6} value={password} onInput={(event) => setPassword(event.currentTarget.value)} /></label>}
      {(isRegister || isReset) && <label>Confirm password<input type="password" required minLength={6} value={passwordConfirm} onInput={(event) => setPasswordConfirm(event.currentTarget.value)} /></label>}
      <button type="submit">{isLogin ? 'Log in' : isRegister ? 'Register' : isReset ? 'Set password' : 'Send link'}</button>
    </form>}
    <nav className={styles.links}>{isLogin && <><Link to="/register">Create an account</Link><Link to="/forgot-password">Forgot password?</Link><Link to="/magic-login">Use a magic link</Link></>}{isRegister && <Link to="/login">Already have an account?</Link>}{!isLogin && !isRegister && <Link to="/login">Back to log in</Link>}</nav>
  </div></div>;
};