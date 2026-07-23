// Seed d'un compte admin par lien d'activation.
//
//   npm run seed-admin -- <email> [--super] [--label "Nom affiché"]
//
// Crée la ligne admin_users avec un token d'activation valable 14 jours et
// affiche le lien à transmettre : la personne choisit son mot de passe via
// /reset-password (même mécanique que l'invitation depuis l'UI, sans envoi
// d'email). L'adresse est aussi ajoutée aux emails de notification des
// nouvelles demandes (notification_emails).
//
// Si le compte existe déjà sans mot de passe activé, le lien est simplement
// régénéré. Si un mot de passe est déjà actif, le script refuse (utiliser
// "Mot de passe oublié" sur la page de connexion).

import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });

const TOKEN_TTL_DAYS = 14;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const labelIdx = args.indexOf("--label");
const label = labelIdx !== -1 ? args[labelIdx + 1] : "Admin";
const email = args.find((a, i) => !a.startsWith("--") && (labelIdx === -1 || i !== labelIdx + 1));

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage : npm run seed-admin -- <email> [--super] [--label \"Nom\"]");
  process.exit(1);
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!baseUrl) {
  console.error("NEXT_PUBLIC_APP_URL manquant dans .env.local");
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * TOKEN_TTL_DAYS);
  const isSuper = flags.has("--super") ? 1 : 0;

  const [rows] = await pool.query(
    "SELECT id, password_hash FROM admin_users WHERE email = ?",
    [email]
  );
  const existing = rows[0];

  if (existing && existing.password_hash !== "!invalid") {
    console.error(
      `✗ ${email} a déjà un mot de passe actif — utiliser « Mot de passe oublié » sur ${baseUrl}/login.`
    );
    process.exit(1);
  }

  if (existing) {
    await pool.query(
      "UPDATE admin_users SET reset_token = ?, reset_token_expires = ?, is_super_admin = ? WHERE id = ?",
      [tokenHash, expires, isSuper, existing.id]
    );
    console.log(`↻ Compte ${email} existant sans mot de passe : lien régénéré.`);
  } else {
    await pool.query(
      "INSERT INTO admin_users (email, password_hash, reset_token, reset_token_expires, is_super_admin) VALUES (?, '!invalid', ?, ?, ?)",
      [email, tokenHash, expires, isSuper]
    );
    console.log(`✓ Compte admin créé : ${email}${isSuper ? " (super admin)" : ""}`);
  }

  await pool.query(
    "INSERT IGNORE INTO notification_emails (email, label) VALUES (?, ?)",
    [email, label]
  );
  console.log("✓ Ajouté aux destinataires des notifications de demandes.");

  console.log("\nLien d'activation (valable " + TOKEN_TTL_DAYS + " jours, jusqu'au " +
    expires.toLocaleDateString("fr-BE") + ") :\n");
  console.log(`  ${baseUrl}/reset-password?token=${rawToken}\n`);
  console.log("À transmettre à la personne : elle y choisira son mot de passe.");
} finally {
  await pool.end();
}
