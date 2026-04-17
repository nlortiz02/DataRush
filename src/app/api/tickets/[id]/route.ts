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
const allowedStatuses = new Set([
  "pendiente",
  "aprobado",
  "en_progreso",
  "resuelto",
]);

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let db: mysql.Connection | null = null;

  try {
    const { id } = await params;
    const ticketId = Number(id);
    if (!ticketId || Number.isNaN(ticketId)) {
      return NextResponse.json(
        { message: "Ticket invalido" },
        { status: 400 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let body: any = {};
    let solutionImageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (key === "solution_image" && value instanceof File) {
          if (value.size > 0) {
            solutionImageUrl = await saveImageFile(value);
          }
        } else {
          body[key] = value;
        }
      }
    } else {
      body = await req.json();
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

    const updates: string[] = [];
    const values: any[] = [];

    if (currentUser.role === "admin") {
      if (body.status && allowedStatuses.has(body.status)) {
        updates.push("status = ?");
        values.push(body.status);
      }
      if (body.priority && allowedPriorities.has(body.priority)) {
        updates.push("priority = ?");
        values.push(body.priority);
      }
      if (solutionImageUrl) {
        updates.push("solution_image_url = ?");
        values.push(solutionImageUrl);
      }
    } else if (currentUser.role === "it") {
      if (body.status && ["en_progreso", "resuelto"].includes(body.status)) {
        updates.push("status = ?");
        values.push(body.status);

        if (body.status === "resuelto") {
          const solution = (body.solution_text || "").trim();
          if (!solution) {
            return NextResponse.json(
              { message: "La solucion es requerida" },
              { status: 400 }
            );
          }
          updates.push("solution_text = ?");
          values.push(solution);
          updates.push("resolved_by = ?");
          values.push(currentUser.username);
          updates.push("resolved_at = CURRENT_TIMESTAMP");

          if (solutionImageUrl) {
            updates.push("solution_image_url = ?");
            values.push(solutionImageUrl);
          }
        }
      }

      if (body.solution_text && !updates.includes("solution_text = ?")) {
        const solution = body.solution_text.trim();
        if (solution) {
          updates.push("solution_text = ?");
          values.push(solution);
        }
      }

      if (solutionImageUrl && !updates.includes("solution_image_url = ?")) {
        updates.push("solution_image_url = ?");
        values.push(solutionImageUrl);
      }
    } else {
      return NextResponse.json(
        { message: "Sin permisos para actualizar" },
        { status: 403 }
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: "No hay cambios validos" },
        { status: 400 }
      );
    }

    values.push(ticketId);
    const sql = `UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`;
    await db.execute(sql, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tickets PATCH error:", error);
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let db: mysql.Connection | null = null;

  try {
    const { id } = await params;
    const ticketId = Number(id);
    if (!ticketId || Number.isNaN(ticketId)) {
      return NextResponse.json(
        { message: "Ticket invalido" },
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

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { message: "Sin permisos para eliminar" },
        { status: 403 }
      );
    }

    await db.execute("DELETE FROM tickets WHERE id = ?", [ticketId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tickets DELETE error:", error);
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
