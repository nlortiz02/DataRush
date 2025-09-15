'use client';
import { useSessionGuard } from '../hooks/useSessionGuard';
import React from 'react';
import Header from '../../components/Header';
import styles from './page.module.css';

export default function MainPage() {
  useSessionGuard();

  return (
    <div className={styles.container}>
      <Header />

      {/* Contenido principal */}
      <main className={styles.mainContent}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.title}>Bienvenido a DataRush</h1>
          <p className={styles.subtitle}>Selecciona una opción del menú superior para comenzar</p>
        </div>
      </main>
    </div>
  );
}
