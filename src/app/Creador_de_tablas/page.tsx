'use client';
import { useSessionGuard } from '../hooks/useSessionGuard';
import React, { useState } from 'react';
import Header from '../../components/Header';
import styles from './creador_tablas.module.css';

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

  const handleColumnChange = (idx: any, field: any, value: any) => {
    // No permitir editar la columna id
    if (columns[idx].fixed) return;
    const newCols = [...columns];
    newCols[idx][field] = value;
    setColumns(newCols);
  };

  const addColumn = () => {
    setColumns([...columns, { name: '', type: DATA_TYPES[0].value }]);
  };

  const removeColumn = (idx: any) => {
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

  return (
    <div style={{ background: '#111' }}>
      <Header />
      <div className={styles.glassBg}>
        <div className={styles.glassContainer}>
          <div className={styles.sectionContent}>
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
                        {/* Campo id bloqueado visualmente al pasar el mouse */}
                        {col.fixed ? (
                          <input
                            type="text"
                            value={col.name}
                            className={styles.inputText + ' ' + styles.idBlocked}
                            placeholder="id"
                            disabled
                            title="Campo bloqueado"
                            // Aplica el estilo bloqueado siempre, ya que está deshabilitado
                          />
                        ) : (
                          <input
                            type="text"
                            value={col.name}
                            onChange={e => handleColumnChange(idx, 'name', e.target.value)}
                            className={styles.inputText}
                            placeholder="Nombre columna"
                            disabled={col.fixed}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.formRow}>
                        {/* Oculta el tipo de dato para la columna id */}
                        {!col.fixed ? (
                          <select
                            className={styles.selectType}
                            value={col.type}
                            onChange={e => handleColumnChange(idx, 'type', e.target.value)}
                            disabled={col.fixed}
                          >
                            {DATA_TYPES.map(dt => (
                              <option key={dt.value} value={dt.value}>{dt.label}</option>
                            ))}
                          </select>
                        ) : (
                          // No mostrar nada para el tipo de dato de id
                          <span></span>
                        )}
                      </div>
                    </td>
                    <td
                      className={
                        columns.length > 2 && !col.fixed
                          ? undefined
                          : styles.actionCellEmpty
                      }
                    >
                      {/* No permitir eliminar la columna id */}
                      {columns.length > 2 && !col.fixed ? (
                        <button onClick={() => removeColumn(idx)} title="Eliminar columna">-</button>
                      ) : (
                        // Renderiza un span con la misma clase que el botón para mantener el fondo
                        <span className={styles.addColumnBtn} style={{ visibility: 'hidden' }}>-</span>
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
        </div>
      </div>
    </div>
  );
}