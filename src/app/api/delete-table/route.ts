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
    const { tableName } = await req.json();
    if (!tableName) return NextResponse.json({ success: false });
    const db = await getDB();
    // Elimina la tabla por nombre
    await db.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    await db.query('DELETE FROM tablas_creadas WHERE nombre = ?', [tableName]);
    await db.end();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
