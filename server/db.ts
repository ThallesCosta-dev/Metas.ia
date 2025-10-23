import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "goals",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

// Test the connection (non-blocking)
pool.getConnection()
  .then((connection) => {
    console.log("✅ Database connected successfully");
    connection.release();
  })
  .catch((err) => {
    console.warn("⚠️ Database connection failed:", err.message);
    console.warn("Make sure your database is running and credentials are correct");
  });

export default pool;
