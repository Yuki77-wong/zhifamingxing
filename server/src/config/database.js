import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const requiredEnvironmentVariables = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME"
];

for (const variableName of requiredEnvironmentVariables) {
  if (!process.env[variableName]) {
    throw new Error(`缺少环境变量：${variableName}`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  charset: "utf8mb4"
});

export async function testDatabaseConnection() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(`
      SELECT
        DATABASE() AS databaseName,
        CURRENT_USER() AS currentUser,
        VERSION() AS mysqlVersion
    `);

    return rows[0];
  } finally {
    connection.release();
  }
}

export default pool;