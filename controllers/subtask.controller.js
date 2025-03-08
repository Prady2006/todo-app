const pool = require("../models/db").pool;
const { success, error } = require("../utils/response.util");
const config = require("../config/db.config"); // Assume this contains your MySQL connection details

// Helper function to update task progress
const updateTaskProgress = async (taskId) => {
  try {
    // Get total count of subtasks
    const [totalRows] = await pool.query(
      "SELECT COUNT(*) as total FROM subtasks WHERE task_id = ?",
      [taskId]
    );

    // Get count of completed subtasks
    const [completedRows] = await pool.query(
      'SELECT COUNT(*) as completed FROM subtasks WHERE task_id = ? AND status = "completed"',
      [taskId]
    );

    const total = totalRows[0].total;
    const completed = completedRows[0].completed;

    // Calculate progress percentage
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update task progress
    await pool.query("UPDATE tasks SET progress = ? WHERE id = ?", [
      progress,
      taskId,
    ]);

    return true;
  } catch (err) {
    console.error("Error updating task progress:", err);
    return false;
  }
};

// Create a new Subtask
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.title) {
      return error(res, "Title cannot be empty!", 400);
    }

    const taskId = req.params.task_id;

    // Check if task exists and belongs to user
    const [taskRows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.userId]
    );

    if (taskRows.length === 0) {
      return error(res, `Task with id=${taskId} not found!`, 404);
    }

    // Create a Subtask
    const [result] = await pool.query(
      'INSERT INTO subtasks (title, description, task_id, status) VALUES (?, ?, ?, "pending")',
      [req.body.title, req.body.description || null, taskId]
    );

    // Get the created subtask
    const [subtaskRows] = await pool.query(
      "SELECT * FROM subtasks WHERE id = ?",
      [result.insertId]
    );

    // Update task progress
    await updateTaskProgress(taskId);

    return success(res, subtaskRows[0], "Subtask created successfully!", 201);
  } catch (err) {
    return error(
      res,
      err.message || "Some error occurred while creating the Subtask."
    );
  }
};

// Find all Subtasks for a Task
exports.findAll = async (req, res) => {
  try {
    const taskId = req.params.task_id;

    // Check if task exists and belongs to user
    const [taskRows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.userId]
    );

    if (taskRows.length === 0) {
      return error(res, `Task with id=${taskId} not found!`, 404);
    }

    // Get all subtasks for the task
    const [subtasks] = await pool.query(
      "SELECT * FROM subtasks WHERE task_id = ?",
      [taskId]
    );

    return success(res, subtasks);
  } catch (err) {
    return error(
      res,
      err.message || "Some error occurred while retrieving subtasks."
    );
  }
};

// Update a Subtask
exports.update = async (req, res) => {
  try {
    const taskId = req.params.task_id;
    const subtaskId = req.params.subtask_id;

    // Check if task exists and belongs to user
    const [taskRows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.userId]
    );

    if (taskRows.length === 0) {
      return error(res, `Task with id=${taskId} not found!`, 404);
    }

    // Check if subtask exists
    const [subtaskRows] = await pool.query(
      "SELECT * FROM subtasks WHERE id = ? AND task_id = ?",
      [subtaskId, taskId]
    );

    if (subtaskRows.length === 0) {
      return error(res, `Subtask with id=${subtaskId} not found!`, 404);
    }

    // Prepare update fields
    const updates = [];
    const values = [];

    if (req.body.title !== undefined) {
      updates.push("title = ?");
      values.push(req.body.title);
    }

    if (req.body.description !== undefined) {
      updates.push("description = ?");
      values.push(req.body.description);
    }

    if (
      req.body.status !== undefined &&
      ["pending", "completed"].includes(req.body.status)
    ) {
      updates.push("status = ?");
      values.push(req.body.status);
    }

    // If nothing to update
    if (updates.length === 0) {
      return error(res, "No valid fields to update", 400);
    }

    // Add the WHERE clause parameters
    values.push(subtaskId);
    values.push(taskId);

    // Update the subtask
    const [result] = await pool.query(
      `UPDATE subtasks SET ${updates.join(", ")} WHERE id = ? AND task_id = ?`,
      values
    );

    if (result.affectedRows === 1) {
      // Update task progress
      await updateTaskProgress(taskId);

      // Get updated subtask
      const [updatedSubtask] = await pool.query(
        "SELECT * FROM subtasks WHERE id = ?",
        [subtaskId]
      );

      return success(
        res,
        updatedSubtask[0],
        "Subtask was updated successfully."
      );
    } else {
      return error(
        res,
        `Cannot update Subtask with id=${subtaskId}. Maybe Subtask was not found!`
      );
    }
  } catch (err) {
    console.error(err);
    return error(
      res,
      "Error updating Subtask with id=" + req.params.subtask_id
    );
  }
};

// Update Subtask status
exports.updateStatus = async (req, res) => {
  try {
    const taskId = req.params.task_id;
    const subtaskId = req.params.subtask_id;
    const { status } = req.body;

    if (!status || !["pending", "completed"].includes(status)) {
      return error(res, "Status must be either 'pending' or 'completed'", 400);
    }

    // Check if task exists and belongs to user
    const [taskRows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.userId]
    );

    if (taskRows.length === 0) {
      return error(res, `Task with id=${taskId} not found!`, 404);
    }

    // Check if subtask exists
    const [subtaskRows] = await pool.query(
      "SELECT * FROM subtasks WHERE id = ? AND task_id = ?",
      [subtaskId, taskId]
    );

    if (subtaskRows.length === 0) {
      return error(res, `Subtask with id=${subtaskId} not found!`, 404);
    }

    // Update status
    const [result] = await pool.query(
      "UPDATE subtasks SET status = ? WHERE id = ? AND task_id = ?",
      [status, subtaskId, taskId]
    );

    if (result.affectedRows === 1) {
      // Update task progress
      await updateTaskProgress(taskId);

      // Get updated subtask
      const [updatedSubtask] = await pool.query(
        "SELECT * FROM subtasks WHERE id = ?",
        [subtaskId]
      );

      return success(
        res,
        updatedSubtask[0],
        "Subtask status was updated successfully."
      );
    } else {
      return error(res, `Cannot update Subtask status with id=${subtaskId}.`);
    }
  } catch (err) {
    return error(
      res,
      "Error updating Subtask status with id=" + req.params.subtask_id
    );
  }
};

// Delete a Subtask
exports.delete = async (req, res) => {
  try {
    const taskId = req.params.task_id;
    const subtaskId = req.params.subtask_id;

    // Check if task exists and belongs to user
    const [taskRows] = await pool.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.userId]
    );

    if (taskRows.length === 0) {
      return error(res, `Task with id=${taskId} not found!`, 404);
    }

    // Check if subtask exists
    const [subtaskRows] = await pool.query(
      "SELECT * FROM subtasks WHERE id = ? AND task_id = ?",
      [subtaskId, taskId]
    );

    if (subtaskRows.length === 0) {
      return error(res, `Subtask with id=${subtaskId} not found!`, 404);
    }

    // Delete subtask
    const [result] = await pool.query(
      "DELETE FROM subtasks WHERE id = ? AND task_id = ?",
      [subtaskId, taskId]
    );

    if (result.affectedRows === 1) {
      // Update task progress
      await updateTaskProgress(taskId);

      return success(res, null, "Subtask was deleted successfully!");
    } else {
      return error(res, `Cannot delete Subtask with id=${subtaskId}.`);
    }
  } catch (err) {
    return error(
      res,
      "Could not delete Subtask with id=" + req.params.subtask_id
    );
  }
};

// Export updateTaskProgress for use in other modules
exports.updateTaskProgress = updateTaskProgress;
