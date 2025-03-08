const { pool } = require("./db");

// Subtask model with mysql2
const Subtask = {
  // Create a new subtask
  create: async (subtaskData) => {
    const { title, description, taskId } = subtaskData;
    const [result] = await pool.execute(
      "INSERT INTO subtasks (title, description, task_id) VALUES (?, ?, ?)",
      [title, description || null, taskId]
    );

    return { id: result.insertId, ...subtaskData, status: "pending" };
  },

  // Find all subtasks for a task
  findByTaskId: async (taskId) => {
    const [rows] = await pool.execute(
      "SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC",
      [taskId]
    );
    return rows;
  },

  // Find a specific subtask by id and task id
  findOne: async (id, taskId) => {
    const [rows] = await pool.execute(
      "SELECT * FROM subtasks WHERE id = ? AND task_id = ?",
      [id, taskId]
    );
    return rows.length ? rows[0] : null;
  },

  // Update a subtask
  update: async (id, taskId, subtaskData) => {
    const { title, description } = subtaskData;

    let query = "UPDATE subtasks SET ";
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

    if (updateFields.length === 0) {
      return 0; // Nothing to update
    }

    query += updateFields.join(", ") + " WHERE id = ? AND task_id = ?";
    params.push(id, taskId);

    const [result] = await pool.execute(query, params);
    return result.affectedRows;
  },

  // Update subtask status
  updateStatus: async (id, taskId, status) => {
    const [result] = await pool.execute(
      "UPDATE subtasks SET status = ? WHERE id = ? AND task_id = ?",
      [status, id, taskId]
    );
    return result.affectedRows;
  },

  // Delete a subtask
  delete: async (id, taskId) => {
    const [result] = await pool.execute(
      "DELETE FROM subtasks WHERE id = ? AND task_id = ?",
      [id, taskId]
    );
    return result.affectedRows;
  },

  // Count total and completed subtasks for a task
  getCompletionStats: async (taskId) => {
    const [rows] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM subtasks
      WHERE task_id = ?`,
      [taskId]
    );

    return rows[0];
  },
};

module.exports = Subtask;
