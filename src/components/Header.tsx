'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronDown, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeDropdown]);

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleLogout = () => {
    // Limpiar cookies o localStorage según tu implementación
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  const handleMainClick = () => {
    router.push('/main');
  };

  return (
    <>
      {/* Header con espacio para logos */}
      <header className={styles.header}>
        <div className={styles.logoSection}>
          <img 
            src="/src/logos/logodata.png" 
            alt="DataRush Logo" 
            className={styles.logo}
            onClick={handleMainClick}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        <div className={styles.userSection}>
          <button className={styles.userBtn} title="Perfil">
            <FaUser />
          </button>
          <button className={styles.userBtn} title="Configuración">
            <FaCog />
          </button>
          <button className={styles.userBtn} onClick={handleLogout} title="Salir">
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      {/* Barra de navegación */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer} ref={dropdownRef}>
          {/* Botón Importaciones con dropdown */}
          <div className={styles.navItem}>
            <button 
              className={`${styles.navBtn} ${activeDropdown === 'importaciones' ? styles.active : ''}`}
              onClick={() => toggleDropdown('importaciones')}
            >
              Importaciones
              <FaChevronDown className={`${styles.chevron} ${activeDropdown === 'importaciones' ? styles.rotated : ''}`} />
            </button>
            
            {activeDropdown === 'importaciones' && (
              <div className={styles.dropdown}>
                <button 
                  className={styles.dropdownItem}
                  onClick={() => router.push('/Creador_de_tablas')}
                >
                  Generador de tablas
                </button>
                <button 
                  className={styles.dropdownItem}
                  onClick={() => router.push('/Plantillas')}
                >
                  Plantillas
                </button>
              </div>
            )}
          </div>

          {/* Botones placeholders */}
          <button className={styles.navBtn} disabled>Botón 2</button>
          <button className={styles.navBtn} disabled>Botón 3</button>
          <button className={styles.navBtn} disabled>Botón 4</button>
          <button className={styles.navBtn} disabled>Botón 5</button>
          <button className={styles.navBtn} disabled>Botón 6</button>
        </div>
      </nav>
    </>
  );
}