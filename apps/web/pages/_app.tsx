import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles/globals.css';

const publicPaths = ['/auth/login', '/auth/register'];

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RouteLoadingBar() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const start = () => setVisible(true);
    const end = () => setVisible(false);

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', end);
    router.events.on('routeChangeError', end);

    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', end);
      router.events.off('routeChangeError', end);
    };
  }, [router.events]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: 3, backgroundColor: '#6366f1',
      animation: 'routeBar 2s ease-in-out infinite',
    }}>
      <style>{`@keyframes routeBar { 0% { width: 0; } 50% { width: 60%; } 100% { width: 100%; } }`}</style>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsAuth(!!token);

    if (!token && !publicPaths.includes(router.pathname)) {
      router.replace('/auth/login');
    }
  }, [router.pathname]);

  if (isAuth === null) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <RouteLoadingBar />
      {publicPaths.includes(router.pathname) || !isAuth ? (
        <Component {...pageProps} />
      ) : (
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      )}
    </ErrorBoundary>
  );
}
