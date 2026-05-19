'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronDown, FaCog, FaSignOutAlt, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import styles from './Header.module.css';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setIsMobileOpen(false);
    setActiveDropdown(null);
  };

  const handleLogout = () => {
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.logoSection}>
          <img src="/src/logos/logodata.png" alt="DataRush Logo" className={styles.logo} onClick={() => navigate('/main')} />
        </div>

        <div className={styles.userSection}>
          <ThemeToggle />
          <button className={styles.userBtn} title="Perfil"><FaUser /></button>
          <button className={styles.userBtn} title="Configuración"><FaCog /></button>
          <button className={styles.userBtn} onClick={handleLogout} title="Salir"><FaSignOutAlt /></button>
          <button className={styles.menuBtn} onClick={() => setIsMobileOpen((prev) => !prev)} aria-label="Abrir menú">
            {isMobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      <nav className={`${styles.navbar} ${isMobileOpen ? styles.navbarOpen : ''}`}>
        <div className={styles.navContainer} ref={dropdownRef}>
          <div className={styles.navItem}>
            <button
              className={`${styles.navBtn} ${activeDropdown === 'importaciones' ? styles.active : ''}`}
              onClick={() => setActiveDropdown(activeDropdown === 'importaciones' ? null : 'importaciones')}
            >
              Importaciones
              <FaChevronDown className={`${styles.chevron} ${activeDropdown === 'importaciones' ? styles.rotated : ''}`} />
            </button>
            {activeDropdown === 'importaciones' && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} onClick={() => navigate('/Creador_de_tablas')}>
                  Generador de tablas
                </button>
                <button className={styles.dropdownItem} onClick={() => navigate('/Plantillas')}>
                  Plantillas
                </button>
              </div>
            )}
          </div>

          <button className={styles.navBtn} onClick={() => navigate('/Tickets')}>Tickets</button>
          <button className={styles.navBtn} disabled>Reportes</button>
          <button className={styles.navBtn} disabled>Automatizaciones</button>
          <button className={styles.navBtn} disabled>Usuarios</button>
        </div>
      </nav>

      <div className={styles.headerSpacer} aria-hidden="true" />
    </>
  );
}
