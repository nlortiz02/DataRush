import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import ExcelJS from 'exceljs';

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tableName = searchParams.get('tableName') || 'Plantilla';

  try {
    const db = await getDB();
    const [columns] = await db.query(
      `SHOW COLUMNS FROM \`${tableName}\``
    );
    await db.end();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(tableName);

    sheet.addRow(columns.map((col: any) => col.Field));

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${tableName}.xlsx"`,
      },
    });
  } catch {
    const buffer = Buffer.from('');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${tableName}.xlsx"`,
      },
    });
  }
}
