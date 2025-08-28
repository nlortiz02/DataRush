import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Next.js no parsea multipart/form-data automáticamente.
    // Necesitas usar una librería como 'formidable' o 'busboy' para procesar el archivo.
    // Aquí solo se simula la respuesta.

    // Al insertar, omite la columna id
    const columns = allColumns.filter(col => col !== 'id');
    const sql = `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(',')}) VALUES ?`;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Error al importar.' }, { status: 500 });
  }
}
