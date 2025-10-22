import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // puerto por defecto de MySQL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
