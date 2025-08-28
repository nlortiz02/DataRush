import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

function getEnv(key: string, def = '') {
  return process.env[key] || def;
}

async function getDB() {
  return mysql.createConnection({
    host: getEnv('DB_HOST'),
    port: Number(getEnv('DB_PORT', '3306')),
    user: getEnv('DB_USER'),
    password: getEnv('DB_PASSWORD'),
    database: getEnv('DB_NAME'),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { tableName, columns } = await req.json();

    if (!tableName || !columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json({ success: false, error: 'Datos incompletos.' }, { status: 400 });
    }

    for (const col of columns) {
      if (!col.name || !col.type) {
        return NextResponse.json({ success: false, error: 'Columnas inválidas.' }, { status: 400 });
      }
    }

    const db = await getDB();

    // Verificar si la tabla ya existe en la base de datos
    const [tables] = await db.query(
      'SHOW TABLES LIKE ?',
      [tableName]
    );
    if (Array.isArray(tables) && tables.length > 0) {
      await db.end();
      return NextResponse.json({ success: false, error: 'El nombre de la tabla ya está en uso.' }, { status: 409 });
    }

    const colsSQL = columns.map(col => `\`${col.name}\` ${col.type}`).join(', ');
    const sql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (${colsSQL})`;

    await db.query(sql);

    // Crear tabla de registro si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS tablas_creadas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) UNIQUE
      )
    `);

    // Registrar la tabla creada
    await db.query(
      'INSERT IGNORE INTO tablas_creadas (nombre) VALUES (?)',
      [tableName]
    );

    await db.end();

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Error interno: ' + String(e) }, { status: 500 });
  }
}
