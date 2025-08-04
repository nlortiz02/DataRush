import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export const useCookieMonitor = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const originalUsername = Cookies.get('username');

    if (!token || !originalUsername) {
      console.log('No token or username found, redirecting to login');
      localStorage.removeItem('token');
      Cookies.remove('username');
      router.push('/login');
      return;
    }

    const checkCookies = () => {
      const currentUsername = Cookies.get('username');
      const currentToken = localStorage.getItem('token');
      
      if (!currentToken || !currentUsername || currentUsername !== originalUsername) {
        console.log('Cookie or token mismatch detected, redirecting to login');
        localStorage.removeItem('token');
        Cookies.remove('username');
        router.push('/login');
      }
    };

    const intervalId = setInterval(checkCookies, 2000); // Aumentado a 2 segundos

    return () => {
      clearInterval(intervalId);
    };
  }, [router]);
};