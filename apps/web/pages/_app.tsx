import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import '../styles/globals.css';

const publicPaths = ['/auth/login', '/auth/register'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuth(!!token);
    setLoading(false);

    if (!token && !publicPaths.includes(router.pathname)) {
      router.push('/auth/login');
    }
  }, [router.pathname]);

  if (loading) return null;

  if (publicPaths.includes(router.pathname) || !isAuth) {
    return <Component {...pageProps} />;
  }

  return (
    <MainLayout>
      <Component {...pageProps} />
    </MainLayout>
  );
}
