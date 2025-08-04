import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';

export const useTokenMonitor = () => {
  const router = useRouter();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      const username = Cookies.get('username');

      if (!token || !username) {
        console.log('Credentials missing, redirecting to login');
        localStorage.removeItem('token');
        Cookies.remove('username');
        router.push('/login');
        return;
      }

      try {
        const response = await axios.post('/api/verifyToken', { token, username });
        
        if (!response.data.valid) {
          console.log('Token invalid, redirecting to login');
          localStorage.removeItem('token');
          Cookies.remove('username');
          router.push('/login');
        }
      } catch (error) {
        console.log('Token verification failed, redirecting to login');
        localStorage.removeItem('token');
        Cookies.remove('username');
        router.push('/login');
      }
    };

    // Verificar inmediatamente
    verifyToken();

    // Verificar cada 5 minutos
    const interval = setInterval(verifyToken, 300000);

    // Verificar cuando la ventana recupera el foco
    const handleFocus = () => verifyToken();
    window.addEventListener('focus', handleFocus);

    // Manejar cambios en localStorage
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token' && (!e.newValue || e.newValue !== e.oldValue)) {
        router.push('/login');
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [router]);
};