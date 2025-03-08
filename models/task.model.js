const { pool } = require("./db");

const Task = {
  // Create a new task
  create: async (taskData) => {
    const { title, description, dueDate, priority, userId } = taskData;
    const [result] = await pool.execute(
      "INSERT INTO tasks (title, description, due_date, priority, user_id) VALUES (?, ?, ?, ?, ?)",
      [title, description, dueDate || null, priority || "medium", userId]
    );

    return { id: result.insertId, ...taskData };
  },

  // Find all tasks for a user with optional status filter
  findAll: async (userId, status = null) => {
    let query = "SELECT * FROM tasks WHERE user_id = ?";
    const params = [userId];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  // Find a specific task by id and user id
  findOne: async (id, userId) => {
    const [rows] = await pool.execute(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return rows.length ? rows[0] : null;
  },

  // Update a task
  update: async (id, userId, taskData) => {
    const { title, description, dueDate, priority, status, progress } =
      taskData;

    let query = "UPDATE tasks SET ";
    const params = [];
    const updateFields = [];

    if (title !== undefined) {
      updateFields.push("title = ?");
      params.push(title);
    }

    if (description !== undefined) {
      updateFields.push("description = ?");
      params.push(description);
    }

    if (dueDate !== undefined) {
      updateFields.push("due_date = ?");
      params.push(dueDate);
    }

    if (priority !== undefined) {
      updateFields.push("priority = ?");
      params.push(priority);
    }

    if (status !== undefined) {
      updateFields.push("status = ?");
      params.push(status);
    }

    if (progress !== undefined) {
      updateFields.push("progress = ?");
      params.push(progress);
    }

    if (updateFields.length === 0) {
      return 0; // Nothing to update
    }

    query += updateFields.join(", ") + " WHERE id = ? AND user_id = ?";
    params.push(id, userId);

    const [result] = await pool.execute(query, params);
    return result.affectedRows;
  },

  // Update task status
  updateStatus: async (id, userId, status) => {
    const [result] = await pool.execute(
      "UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?",
      [status, id, userId]
    );
    return result.affectedRows;
  },

  // Update task progress
  updateProgress: async (id, progress) => {
    const [result] = await pool.execute(
      "UPDATE tasks SET progress = ? WHERE id = ?",
      [progress, id]
    );
    return result.affectedRows;
  },

  // Delete a task
  delete: async (id, userId) => {
    const [result] = await pool.execute(
      "DELETE FROM tasks WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.affectedRows;
  },
};

module.exports = Task;
// TODO: Need to add soft delete rather than hard delete .
