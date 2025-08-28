'use client';
import { useSessionGuard } from '../hooks/useSessionGuard';
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';

const DATA_TYPES = [
  { label: 'Texto', value: 'VARCHAR(255)' },
  { label: 'Número', value: 'INT' },
  { label: 'Decimal', value: 'FLOAT' },
  { label: 'Fecha', value: 'DATE' },
  // ...otros tipos si es necesario
];

export default function TableCreator() {
  useSessionGuard();
  // Inicializa con columna id como clave primaria
  const [columns, setColumns] = useState([
    { name: 'id', type: 'INT AUTO_INCREMENT PRIMARY KEY', fixed: true },
    { name: '', type: DATA_TYPES[0].value }
  ]);
  const [tableName, setTableName] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tables, setTables] = useState<{ id: number; nombre: string }[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [activeTab, setActiveTab] = useState<'crear' | 'plantillas'>('crear');

  const handleColumnChange = (idx, field, value) => {
    // No permitir editar la columna id
    if (columns[idx].fixed) return;
    const newCols = [...columns];
    newCols[idx][field] = value;
    setColumns(newCols);
  };

  const addColumn = () => {
    setColumns([...columns, { name: '', type: DATA_TYPES[0].value }]);
  };

  const removeColumn = (idx) => {
    // No permitir eliminar la columna id
    if (columns[idx].fixed) return;
    setColumns(columns.filter((_, i) => i !== idx));
  };

  const createTable = async () => {
    setSuccess('');
    setError('');
    // Validación básica
    if (!tableName.trim()) {
      setError('El nombre de la tabla es obligatorio.');
      return;
    }
    // Validar solo columnas no fijas
    if (columns.some(col => !col.fixed && !col.name.trim())) {
      setError('Todas las columnas deben tener nombre.');
      return;
    }
    try {
      // Filtra columnas vacías y mantiene la columna id
      const colsToSend = columns.filter(col => col.fixed || col.name.trim());
      const res = await fetch('/api/create-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, columns: colsToSend }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setError('El nombre de la tabla ya está en uso.');
      } else if (data.success) {
        setSuccess('Tabla creada exitosamente.');
      } else {
        setError(data.error || 'Error al crear la tabla.');
      }
    } catch (e) {
      setError('Error de conexión.');
    }
  };

  const downloadTemplate = async () => {
    // Descarga plantilla Excel basada en columnas
    window.location.href = `/api/download-template?tableName=${tableName}`;
  };

  const uploadExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tableName', tableName);
    try {
      const res = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) setSuccess('Datos importados correctamente.');
      else setError(data.error || 'Error al importar datos.');
    } catch {
      setError('Error de conexión.');
    }
  };

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
  }, [success]);

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
          {/* Navegación de pestañas */}
          <div className={styles.tabs}>
            <button
              className={activeTab === 'crear' ? styles.activeTab : ''}
              onClick={() => setActiveTab('crear')}
            >
              Crear tabla
            </button>
            <button
              className={activeTab === 'plantillas' ? styles.activeTab : ''}
              onClick={() => setActiveTab('plantillas')}
            >
              Plantillas
            </button>
          </div>

          {/* Contenido de pestañas */}
          {activeTab === 'crear' && (
            <div>
              <h2 className={styles.heading}>Crear nueva tabla</h2>
              <div className={styles.formRow}>
                <label htmlFor="tableName" className={styles.label}>Nombre de la tabla</label>
                <input
                  id="tableName"
                  type="text"
                  placeholder="Nombre de la tabla"
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                  className={styles.inputText}
                />
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableHeading}>Nombre columna</th>
                    <th className={styles.tableHeading}>Tipo de dato</th>
                    <th className={styles.tableHeading}></th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((col, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className={styles.formRow}>
                          <input
                            type="text"
                            value={col.name}
                            onChange={e => handleColumnChange(idx, 'name', e.target.value)}
                            className={styles.inputText}
                            placeholder="Nombre columna"
                            disabled={col.fixed}
                          />
                        </div>
                      </td>
                      <td>
                        <div className={styles.formRow}>
                          <select
                            className={styles.selectType}
                            value={col.type}
                            onChange={e => handleColumnChange(idx, 'type', e.target.value)}
                            disabled={col.fixed}
                          >
                            {col.fixed ? (
                              <option value={col.type}>INT AUTO_INCREMENT PRIMARY KEY</option>
                            ) : (
                              DATA_TYPES.map(dt => (
                                <option key={dt.value} value={dt.value}>{dt.label}</option>
                              ))
                            )}
                          </select>
                        </div>
                      </td>
                      <td>
                        {/* No permitir eliminar la columna id */}
                        {columns.length > 2 && !col.fixed && (
                          <button onClick={() => removeColumn(idx)} title="Eliminar columna">-</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.formRow}>
                <button className={styles.addColumnBtn} onClick={addColumn}>+ Agregar columna</button>
                <button className={styles.createTableBtn} onClick={createTable}>Crear tabla</button>
              </div>
              {success && <div className={styles.successMsg}>{success}</div>}
              {error && <div className={styles.errorMsg}>{error}</div>}
            </div>
          )}

          {activeTab === 'plantillas' && (
            <div>
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
          )}
        </div>
      </div>
    </div>
  );
}