require("dotenv").config();

module.exports = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "todo_app_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
