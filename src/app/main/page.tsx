'use client';
import { useSessionGuard } from '../hooks/useSessionGuard';
import styles from './page.module.css';

export default function MainPage() {
  useSessionGuard();

  // Depuración: muestra el valor de la cookie username
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(^|;) ?username=([^;]*)(;|$)/);
    const usernameCookie = match ? match[2] : null;
    console.log('Valor de cookie username:', usernameCookie);
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hola</h1>
    </div>
  );
}
