const { pool } = require("./db");

// User model with mysql2
const User = {
  // Create a new user
  create: async (userData) => {
    const { username, email, password } = userData;
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, password]
    );
    return { id: result.insertId, username, email };
  },

  // Find user by username
  findByUsername: async (username) => {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    return rows.length ? rows[0] : null;
  },

  // Find user by email
  findByEmail: async (email) => {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows.length ? rows[0] : null;
  },

  // Find user by id
  findById: async (id) => {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  },
};

module.exports = User;
