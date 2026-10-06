import { FunctionComponent } from 'preact';
import { lazy, Suspense } from 'preact/compat';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import styles from './App.module.css';
import { AuthProvider, useAuth } from './auth';
import { NotificationSettings } from './components/NotificationSettings';
import { AccessibilityPreferencesProvider } from './contexts/AccessibilityPreferences';
import { ThemeProvider } from './contexts/Theme';

const AuthPage = lazy(() => import('./pages/AuthPage').then(({ AuthPage }) => ({ default: AuthPage })));
const InvitationPage = lazy(() => import('./pages/InvitationPage').then(({ InvitationPage }) => ({ default: InvitationPage })));
const NeighborhoodPage = lazy(() => import('./pages/NeighborhoodPage').then(({ NeighborhoodPage }) => ({ default: NeighborhoodPage })));
const PorchlightCreatePage = lazy(() => import('./pages/PorchlightCreatePage').then(({ PorchlightCreatePage }) => ({ default: PorchlightCreatePage })));
const PorchlightEditPage = lazy(() => import('./pages/PorchlightEditPage').then(({ PorchlightEditPage }) => ({ default: PorchlightEditPage })));
const PorchlightPage = lazy(() => import('./pages/PorchlightPage').then(({ PorchlightPage }) => ({ default: PorchlightPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(({ ProfilePage }) => ({ default: ProfilePage })));
const HomePage = lazy(() => import('./pages/HomePage').then(({ HomePage }) => ({ default: HomePage })));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage').then(({ PoliciesPage }) => ({ default: PoliciesPage })));

export const App: FunctionComponent = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AccessibilityPreferencesProvider>
          <AuthProvider><AppShell /></AuthProvider>
        </AccessibilityPreferencesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const AppShell: FunctionComponent = () => {
  const { user } = useAuth();
  const location = useLocation();
  return <div className={styles.app}>
    <header className={styles.header}><Link to="/" className={styles.logo}>Porchlighting</Link><nav className={styles.nav}><Link to="/neighborhood">Neighborhood</Link><Link to="/policies">Policies</Link>{user ? <Link to="/profile">Profile</Link> : location.pathname !== '/login' && <Link to="/login">Log in</Link>}</nav><NotificationSettings /></header>
    <main className={styles.main}>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/forgot-password" element={<AuthPage mode="forgot-password" />} />
            <Route path="/forgot-password/:uid/:token/" element={<AuthPage mode="forgot-password" />} />
            <Route path="/magic-login" element={<AuthPage mode="magic-login" />} />
            <Route path="/magic-login/:uid/:token/" element={<AuthPage mode="magic-login" />} />
            <Route path="/confirm-email/:uid/:token/" element={<AuthPage mode="confirm-email" />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/neighborhood" element={<NeighborhoodPage />} />
            <Route path="/porchlight/new" element={<PorchlightCreatePage />} />
            <Route path="/porchlight/:id/edit" element={<PorchlightEditPage />} />
            <Route path="/join/:sqid" element={<InvitationPage />} />
            <Route path="/porchlight/:id" element={<PorchlightPage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/" element={<HomePage />} />
            </Routes>
          </Suspense>
    </main>
  </div>;
};
