import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

export const SECRET_KEY = process.env.JWT_SECRET_KEY;

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const verifyToken = (token: string): boolean => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return !!decoded;
  } catch (error) {
    return false;
  }
};

export async function POST(req: NextRequest) {
  let connection: mysql.Connection | null = null;

  try {
    if (!SECRET_KEY) {
      return NextResponse.json(
        { message: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const body = await req.json();
    let { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username y password son requeridos' },
        { status: 400 }
      );
    }

    username = username.toLowerCase();
    
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      `SELECT contraseña, rol, status, usuario 
       FROM users 
       WHERE LOWER(usuario) = LOWER(?) OR LOWER(Nrodocumento) = LOWER(?)`,
      [username, username]
    );

    const result = rows as any[];

    if (result.length > 0) {
      const storedHash = result[0].contraseña;
      const userRole = result[0].rol;
      const userStatus = result[0].status;
      const dbUsername = result[0].usuario;

      if (userStatus === 0) {
        return NextResponse.json(
          { message: 'Credenciales inválidas' },
          { status: 401 }
        );
      }

      const hashedPassword = hashPassword(password);
      
      if (hashedPassword === storedHash) {
        const token = jwt.sign(
          { username: dbUsername, role: userRole },
          SECRET_KEY,
          { expiresIn: '1h' }
        );

        return NextResponse.json({
          token,
          role: userRole,
          username: dbUsername
        });
      }

      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Credenciales inválidas' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (error) {
        console.error('Error cerrando conexión:', error);
      }
    }
  }
}
