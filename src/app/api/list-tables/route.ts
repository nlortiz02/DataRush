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

export async function GET() {
  try {
    const db = await getDB();
    await db.query(`
      CREATE TABLE IF NOT EXISTS tablas_creadas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) UNIQUE
      )
    `);
    const [rows] = await db.query('SELECT id, nombre FROM tablas_creadas');
    await db.end();
    return NextResponse.json({ tables: rows.map((r: any) => ({ id: r.id, nombre: r.nombre })) });
  } catch {
    return NextResponse.json({ tables: [] });
  }
}
