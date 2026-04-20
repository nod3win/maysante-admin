/**
 * Usage: npx tsx scripts/create-admin.ts admin@corporus.be monMotDePasse
 */
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const hash = await bcrypt.hash(password, 12);
await pool.query(
  "INSERT INTO admin_users (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = ?",
  [email, hash, hash]
);
console.log(`✅ Admin créé : ${email}`);
await pool.end();