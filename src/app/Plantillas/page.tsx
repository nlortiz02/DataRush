'use client';
import { useSessionGuard } from '../hooks/useSessionGuard';
import React, { useEffect, useState } from 'react';
import styles from './plantillas.module.css';

export default function Plantillas() {
  useSessionGuard();
  const [tables, setTables] = useState<{ id: number; nombre: string }[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

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

  return (
    <div className={styles.glassBg}>
      <div className={styles.glassContainer}>
        <div className={styles.sectionContent}>
          <h3 className={styles.subheading}>Plantillas</h3>
          {loadingTables ? (
            <div>Cargando tablas...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableHeading}>ID</th>
                  <th className={styles.tableHeading}>Tabla</th>
                  <th className={styles.tableHeading}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tables.map(table => (
                  <tr key={table.id}>
                    <td>{table.id}</td>
                    <td>{table.nombre}</td>
                    <td>
                      <button title="Descargar Excel" onClick={() => downloadTemplateForTable(table.nombre)}>📄</button>
                      <button title="Eliminar tabla" onClick={() => deleteTable(table.nombre)}>🗑️</button>
                      <button title="Vaciar tabla" onClick={() => truncateTable(table.nombre)}>🧹</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
