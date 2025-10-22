const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function actualizarAdmins() {
  // Configuración de tu base de datos
  const pool = await mysql.createPool({
    host: "localhost",
    user: "root", // tu usuario
    password: "1234", // tu contraseña
    database: "moviiq", // cambia esto
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Traer todos los administradores
  const [admins] = await pool.query(
    "SELECT id_admin, password_hash FROM administradores"
  );

  for (const admin of admins) {
    // Verificar si ya está hasheada
    if (!admin.password_hash.startsWith("$2b$")) {
      const hashed = await bcrypt.hash(admin.password_hash, 10);
      await pool.query(
        "UPDATE administradores SET password_hash = ? WHERE id_admin = ?",
        [hashed, admin.id_admin]
      );
      console.log(`✅ Admin ${admin.id_admin} actualizado`);
    } else {
      console.log(`ℹ️ Admin ${admin.id_admin} ya estaba hasheado`);
    }
  }

  console.log(
    "🎉 Todas las contraseñas de administradores han sido actualizadas"
  );
  process.exit(0);
}

actualizarAdmins().catch((err) => {
  console.error(err);
  process.exit(1);
});
