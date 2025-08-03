'use client';
import React, { useState } from 'react';
import styles from './login.module.css';
import Image from "next/legacy/image";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Toaster, toast } from 'react-hot-toast';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post('/api/login', { username, password });
      const { token, role, username: dbUsername } = response.data;
      
      // Limpiar datos previos
      localStorage.clear();
      Cookies.remove('username');
      
      // Establecer nuevas credenciales usando el username de la BD
      localStorage.setItem('token', token);
      Cookies.set('username', dbUsername, {
        expires: 2,
        path: '/'
      });

      toast.success('¡Bienvenido!', {
        duration: 3000,
        style: {
          background: '#10b981',
          color: 'white',
        },
      });

      router.push('/main');
      
    } catch (error: any) {
      localStorage.removeItem('token');
      Cookies.remove('username');

      toast.error('Credenciales inválidas', {
        duration: 3000,
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className={styles.container}>
        <div className={styles.backgroundShapes}>
          <div className={styles.shape1}></div>
          <div className={styles.shape2}></div>
          <div className={styles.shape3}></div>
        </div>
        
        <div className={styles.logoContainer}>
          <Image 
            src="/src/LOGODATARUSH.png" 
            alt="Logo Data Rush" 
            width={120} 
            height={80} 
            objectFit="contain"
          />
        </div>

        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Iniciar Sesión</h1>
            <p className={styles.subtitle}>Bienvenido de nuevo</p>
          </div>

          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input 
                  type="text"
                  placeholder="Usuario o Documento"
                  className={styles.input}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <div className={styles.inputIcon}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input 
                  type="password"
                  placeholder="Contraseña"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className={styles.inputIcon}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                  </svg>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              <span className={styles.buttonText}>
                {isLoading ? 'Cargando...' : 'Ingresar'}
              </span>
              {!isLoading && (
                <div className={styles.buttonIcon}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/>
                  </svg>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;