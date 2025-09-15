'use client';
import { useSessionGuard } from '../hooks/useSessionGuard';
import React, { useEffect, useState } from 'react';
import { FaSortAlphaDown, FaSortAlphaUp, FaFilter } from 'react-icons/fa';
import Header from '../../components/Header';
import styles from './plantillas.module.css';

export default function Plantillas() {
  useSessionGuard();
  const [tables, setTables] = useState<{ id: number; nombre: string }[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: 'id' | 'nombre'; direction: 'asc' | 'desc' } | null>(null);
  const [filterConfig, setFilterConfig] = useState<{ key: 'id' | 'nombre'; values: (string | number)[] } | null>(null);
  const [showFilter, setShowFilter] = useState<{ key: 'id' | 'nombre' | null; anchor: HTMLElement | null }>({ key: null, anchor: null });
  const [filterSearch, setFilterSearch] = useState('');

  // Obtener tablas creadas
  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const res = await fetch('/api/list-tables');
      const data = await res.json();
      setTables(data.tables || []);
    } catch {
      setTables([]);
    }
    setLoadingTables(false);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Ordenar y filtrar tablas
  const sortedTables = React.useMemo(() => {
    let sortableTables = [...tables];
    if (filterConfig && filterConfig.values.length > 0) {
      sortableTables = sortableTables.filter(table =>
        filterConfig.values.includes(table[filterConfig.key])
      );
    }
    if (sortConfig !== null) {
      sortableTables.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableTables;
  }, [tables, sortConfig, filterConfig]);

  // Eliminar tabla
  const deleteTable = async (table: string) => {
    if (!window.confirm(`¿Eliminar la tabla "${table}"?`)) return;
    await fetch('/api/delete-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName: table }),
    });
    fetchTables();
  };

  // Truncar tabla
  const truncateTable = async (table: string) => {
    if (!window.confirm(`¿Vaciar la tabla "${table}"?`)) return;
    await fetch('/api/truncate-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName: table }),
    });
    fetchTables();
  };

  // Descargar plantilla Excel
  const downloadTemplateForTable = (table: string) => {
    window.location.href = `/api/download-template?tableName=${table}`;
  };

  // Cambiar orden
  const handleSort = (key: 'id' | 'nombre') => {
    setSortConfig(prev => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  // Mostrar popup de filtro
  const handleFilter = (key: 'id' | 'nombre', e: React.MouseEvent<HTMLButtonElement>) => {
    setShowFilter({ key, anchor: e.currentTarget });
    setFilterSearch('');
  };

  // Obtener valores únicos para el filtro
  const uniqueValues = React.useMemo(() => {
    if (!showFilter.key) return [];
    const values = Array.from(new Set(tables.map(t => t[showFilter.key as 'id' | 'nombre'])));
    return values.filter(v => filterSearch === '' || String(v).toLowerCase().includes(filterSearch.toLowerCase()));
  }, [tables, showFilter, filterSearch]);

  // Aplicar filtro
  const applyFilter = (key: 'id' | 'nombre', values: (string | number)[]) => {
    setFilterConfig(values.length > 0 ? { key, values } : null);
    setShowFilter({ key: null, anchor: null });
  };

  // Limpiar filtro
  const clearFilter = () => {
    setFilterConfig(null);
    setShowFilter({ key: null, anchor: null });
  };

  // Estado de selección de checkboxes
  const [selectedFilterValues, setSelectedFilterValues] = useState<(string | number)[]>([]);
  useEffect(() => {
    if (showFilter.key) {
      setSelectedFilterValues(filterConfig?.key === showFilter.key ? filterConfig.values : []);
    }
  }, [showFilter, filterConfig]);

  // Referencia para el popup de filtro
  const filterPopupRef = React.useRef<HTMLDivElement>(null);

  // Cerrar popup al hacer click fuera (solo si no es dentro del popup)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showFilter.anchor &&
        !showFilter.anchor.contains(event.target as Node) &&
        filterPopupRef.current &&
        !filterPopupRef.current.contains(event.target as Node)
      ) {
        setShowFilter({ key: null, anchor: null });
      }
    };
    if (showFilter.key) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilter]);

  // Calcular posición del popup centrado respecto al botón usando el ancho real
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  React.useLayoutEffect(() => {
    if (showFilter.anchor && filterPopupRef.current) {
      const rect = showFilter.anchor.getBoundingClientRect();
      const popupRect = filterPopupRef.current.getBoundingClientRect();
      
      // Calcular posición centrada horizontalmente respecto al botón
      let leftPosition = rect.left + window.scrollX + rect.width / 2 - popupRect.width / 2;
      
      // Verificar que no se salga de la pantalla por la izquierda
      if (leftPosition < 10) {
        leftPosition = 10;
      }
      
      // Verificar que no se salga de la pantalla por la derecha
      const rightEdge = leftPosition + popupRect.width;
      if (rightEdge > window.innerWidth - 10) {
        leftPosition = window.innerWidth - popupRect.width - 10;
      }
      
      setPopupStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: leftPosition,
        zIndex: 1000,
        minWidth: '250px',
      });
    }
  }, [showFilter, uniqueValues]);

  return (
    <div style={{ background: '#111' }}>
      <Header />
      <div className={styles.glassBg}>
        <div className={styles.glassContainer}>
          <div className={styles.sectionContent}>
            <h3 className={styles.subheading}>Plantillas</h3>
            {loadingTables ? (
              <div>Cargando tablas...</div>
            ) : (
              <div style={{ position: 'relative' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeading}>
                        ID
                        <span className={styles.sortIcons}>
                          <button className={styles.iconBtn} onClick={() => handleSort('id')} title="Ordenar">
                            {sortConfig?.key === 'id' && sortConfig.direction === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                          </button>
                          <button className={styles.iconBtn} onClick={e => handleFilter('id', e)} title="Filtrar"><FaFilter /></button>
                        </span>
                      </th>
                      <th className={styles.tableHeading}>
                        Tabla
                        <span className={styles.sortIcons}>
                          <button className={styles.iconBtn} onClick={() => handleSort('nombre')} title="Ordenar">
                            {sortConfig?.key === 'nombre' && sortConfig.direction === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                          </button>
                          <button className={styles.iconBtn} onClick={e => handleFilter('nombre', e)} title="Filtrar"><FaFilter /></button>
                        </span>
                      </th>
                      <th className={styles.tableHeading}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTables.map(table => (
                      <tr key={table.id}>
                        <td>{table.id}</td>
                        <td>{table.nombre}</td>
                        <td style={{ minWidth: '140px', maxWidth: '160px' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', width: '100%' }}>
                            <button title="Descargar Excel" onClick={() => downloadTemplateForTable(table.nombre)}>📄</button>
                            <button title="Eliminar tabla" onClick={() => deleteTable(table.nombre)}>🗑️</button>
                            <button title="Vaciar tabla" onClick={() => truncateTable(table.nombre)}>🧹</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Popup de filtro */}
                {showFilter.key && (
                  <div
                    ref={filterPopupRef}
                    className={styles.filterPopup}
                    style={popupStyle}
                  >
                    <div className={styles.filterHeader}>Filtrar por {showFilter.key === 'id' ? 'ID' : 'Tabla'}</div>
                    <input
                      className={styles.filterSearch}
                      type="text"
                      placeholder="Buscar..."
                      value={filterSearch}
                      onChange={e => setFilterSearch(e.target.value)}
                    />
                    <div className={styles.filterList}>
                      {uniqueValues.map(val => (
                        <label key={val} className={styles.filterItem}>
                          <input
                            type="checkbox"
                            checked={selectedFilterValues.includes(val)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedFilterValues(prev => [...prev, val]);
                              } else {
                                setSelectedFilterValues(prev => prev.filter(v => v !== val));
                              }
                            }}
                          />
                          {val}
                        </label>
                      ))}
                    </div>
                    <div className={styles.filterActions}>
                      <button onClick={() => applyFilter(showFilter.key as 'id' | 'nombre', selectedFilterValues)}>
                        Aplicar
                      </button>
                      <button onClick={clearFilter} style={{ marginLeft: '8px' }}>
                        Limpiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
