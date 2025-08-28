import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

function getTokenFromLocalStorage() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}
function getUsernameFromCookies() {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(^|;) ?username=([^;]*)(;|$)/);
    return match ? match[2] : null;
  }
  return null;
}
function isTokenValid(token: string | null) {
  return !!token;
}
function isUsernameValid(username: string | null) {
  return !!username;
}
function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

export function useSessionGuard() {
  const router = useRouter();
  const lastUsernameRef = useRef<string | null>(null);
  const lastTokenRef = useRef<string | null>(null);
  const redirectedRef = useRef<boolean>(false); // Nueva referencia

  useEffect(() => {
    const initialToken = getTokenFromLocalStorage();
    const initialUsername = getUsernameFromCookies();
    if (isTokenValid(initialToken) && isUsernameValid(initialUsername)) {
      lastUsernameRef.current = initialUsername;
      lastTokenRef.current = initialToken;
    }

    const checkSession = () => {
      const token = getTokenFromLocalStorage();
      const username = getUsernameFromCookies();

      // Si ya se redirigió, no hacer nada
      if (redirectedRef.current) return;

      // Si no hay token o username, borra ambos y redirige
      if (!isTokenValid(token) || !isUsernameValid(username)) {
        localStorage.removeItem('token');
        deleteCookie('username');
        redirectedRef.current = true;
        router.push('/login');
        return;
      }

      // Si es el primer login, inicializa referencias
      if (lastUsernameRef.current === null || lastTokenRef.current === null) {
        lastUsernameRef.current = username;
        lastTokenRef.current = token;
        return;
      }

      // Si el username cambió o fue borrado, borra ambos y redirige
      if (username !== lastUsernameRef.current) {
        localStorage.removeItem('token');
        deleteCookie('username');
        redirectedRef.current = true;
        router.push('/login');
        return;
      }

      // Si el token cambió o fue borrado, borra ambos y redirige
      if (token !== lastTokenRef.current) {
        localStorage.removeItem('token');
        deleteCookie('username');
        redirectedRef.current = true;
        router.push('/login');
        return;
      }

      // Actualiza referencias
      lastUsernameRef.current = username;
      lastTokenRef.current = token;
    };

    checkSession();

    const interval = setInterval(checkSession, 200);

    // Listener para cambios en localStorage (solo útil entre pestañas)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'token') {
        checkSession();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [router]);
}
