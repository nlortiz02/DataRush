import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";

function getEnv(key: string, def = "") {
  return process.env[key] || def;
}

async function getDB() {
  return mysql.createConnection({
    host: getEnv("DB_HOST"),
    port: Number(getEnv("DB_PORT", "3306")),
    user: getEnv("DB_USER"),
    password: getEnv("DB_PASSWORD"),
    database: getEnv("DB_NAME"),
  });
}

async function ensureSchema(db: mysql.Connection) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      priority ENUM('baja','media','alta','critica') NOT NULL DEFAULT 'media',
      status ENUM('pendiente','aprobado','en_progreso','resuelto') NOT NULL DEFAULT 'pendiente',
      created_by VARCHAR(120) NOT NULL,
      assigned_to VARCHAR(120) NULL,
      solution_text TEXT NULL,
      resolved_by VARCHAR(120) NULL,
      user_image_url VARCHAR(255) NULL,
      solution_image_url VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL
    )
  `);

  const optionalColumns = [
    { name: "user_image_url", type: "VARCHAR(255) NULL" },
    { name: "solution_image_url", type: "VARCHAR(255) NULL" },
  ];

  for (const column of optionalColumns) {
    try {
      await db.query(
        `ALTER TABLE tickets ADD COLUMN ${column.name} ${column.type}`
      );
    } catch {
      // Ignore if column already exists.
    }
  }
}

async function getCurrentUser(db: mysql.Connection) {
  const cookieStore = await cookies();
  const username = cookieStore.get("username")?.value;

  if (!username) {
    return null;
  }

  const [rows] = await db.execute(
    "SELECT usuario, rol FROM users WHERE usuario = ?",
    [username]
  );
  const result = rows as { usuario: string; rol: string }[];

  if (result.length === 0) {
    return null;
  }

  return {
    username: result[0].usuario,
    role: (result[0].rol || "").toLowerCase(),
  };
}

const allowedPriorities = new Set(["baja", "media", "alta", "critica"]);

async function saveImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Tipo de archivo no permitido");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "tickets");

  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = path.extname(file.name) || ".png";
  const filename = `${safeName}${ext}`;
  const fullPath = path.join(uploadsDir, filename);

  await fs.writeFile(fullPath, buffer);

  return `/uploads/tickets/${filename}`;
}

export async function GET() {
  let db: mysql.Connection | null = null;

  try {
    db = await getDB();
    await ensureSchema(db);

    const currentUser = await getCurrentUser(db);
    if (!currentUser) {
      return NextResponse.json(
        { message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const params: any[] = [];
    let sql =
      "SELECT id, title, description, priority, status, created_by, assigned_to, solution_text, resolved_by, user_image_url, solution_image_url, created_at, updated_at, resolved_at FROM tickets";

    if (currentUser.role === "usuario") {
      sql += " WHERE created_by = ?";
      params.push(currentUser.username);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await db.execute(sql, params);

    return NextResponse.json({
      tickets: rows,
      role: currentUser.role,
      username: currentUser.username,
    });
  } catch (error) {
    console.error("Tickets GET error:", error);
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    );
  } finally {
    if (db) {
      try {
        await db.end();
      } catch (error) {
        console.error("DB close error:", error);
      }
    }
  }
}

export async function POST(req: NextRequest) {
  let db: mysql.Connection | null = null;

  try {
    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let description = "";
    let priority = "";
    let userImageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = String(formData.get("title") || "");
      description = String(formData.get("description") || "");
      priority = String(formData.get("priority") || "");

      const imageFile = formData.get("image");
      if (imageFile instanceof File && imageFile.size > 0) {
        userImageUrl = await saveImageFile(imageFile);
      }
    } else {
      const body = await req.json();
      title = body?.title || "";
      description = body?.description || "";
      priority = body?.priority || "";
    }

    if (!title || !description) {
      return NextResponse.json(
        { message: "Titulo y descripcion son requeridos" },
        { status: 400 }
      );
    }

    if (priority && !allowedPriorities.has(priority)) {
      return NextResponse.json(
        { message: "Prioridad invalida" },
        { status: 400 }
      );
    }

    db = await getDB();
    await ensureSchema(db);

    const currentUser = await getCurrentUser(db);
    if (!currentUser) {
      return NextResponse.json(
        { message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "admin" && currentUser.role !== "usuario") {
      return NextResponse.json(
        { message: "Sin permisos para crear tickets" },
        { status: 403 }
      );
    }

    await db.execute(
      `INSERT INTO tickets (title, description, priority, status, created_by, user_image_url)
       VALUES (?, ?, ?, 'pendiente', ?, ?)` ,
      [
        title.trim(),
        description.trim(),
        priority || "media",
        currentUser.username,
        userImageUrl,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tickets POST error:", error);
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    );
  } finally {
    if (db) {
      try {
        await db.end();
      } catch (error) {
        console.error("DB close error:", error);
      }
    }
  }
}
