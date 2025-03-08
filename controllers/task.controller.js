const Task = require("../models/task.model");
const Subtask = require("../models/subtask.model");
const { success, error } = require("../utils/response.util");

// Create and Save a new Task
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.title) {
      return error(res, "Title cannot be empty!", 400);
    }

    // Create a Task
    const task = {
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      userId: req.userId,
    };

    // Save Task in the database
    const data = await Task.create(task);
    return success(res, data, "Task created successfully!", 201);
  } catch (err) {
    console.error("Error creating task:", err);
    return error(
      res,
      err.message || "Some error occurred while creating the Task."
    );
  }
};

// Retrieve all Tasks from the database
exports.findAll = async (req, res) => {
  try {
    const { status } = req.query;
    const tasks = await Task.findAll(req.userId, status);

    // For each task, fetch its subtasks to include in response
    const tasksWithSubtasks = await Promise.all(
      tasks.map(async (task) => {
        const subtasks = await Subtask.findByTaskId(task.id);
        return {
          ...task,
          subtasks,
        };
      })
    );

    return success(res, tasksWithSubtasks);
  } catch (err) {
    console.error("Error retrieving tasks:", err);
    return error(
      res,
      err.message || "Some error occurred while retrieving tasks."
    );
  }
};

// Find a single Task with an id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.task_id;
    const task = await Task.findOne(id, req.userId);

    if (!task) {
      return error(res, `Task with id=${id} not found!`, 404);
    }

    // Get subtasks for this task
    const subtasks = await Subtask.findByTaskId(id);

    // Create response with task and its subtasks
    const taskWithSubtasks = {
      ...task,
      subtasks,
    };

    return success(res, taskWithSubtasks);
  } catch (err) {
    console.error("Error retrieving task:", err);
    return error(res, "Error retrieving Task with id=" + req.params.task_id);
  }
};

// Update a Task by the id
exports.update = async (req, res) => {
  try {
    const id = req.params.task_id;

    // Check if task exists
    const task = await Task.findOne(id, req.userId);
    if (!task) {
      return error(res, `Task with id=${id} not found!`, 404);
    }

    // Update the task
    const affectedRows = await Task.update(id, req.userId, req.body);

    if (affectedRows > 0) {
      // Get the updated task
      const updatedTask = await Task.findOne(id, req.userId);
      // Get subtasks for this task
      const subtasks = await Subtask.findByTaskId(id);

      return success(
        res,
        {
          ...updatedTask,
          subtasks,
        },
        "Task was updated successfully."
      );
    } else {
      return error(
        res,
        `Cannot update Task with id=${id}. Maybe req.body is empty!`
      );
    }
  } catch (err) {
    console.error("Error updating task:", err);
    return error(res, "Error updating Task with id=" + req.params.task_id);
  }
};

// Update Task status
exports.updateStatus = async (req, res) => {
  try {
    const id = req.params.task_id;
    const { status } = req.body;

    if (!status || !["pending", "completed"].includes(status)) {
      return error(res, "Status must be either 'pending' or 'completed'", 400);
    }

    // Check if task exists
    const task = await Task.findOne(id, req.userId);
    if (!task) {
      return error(res, `Task with id=${id} not found!`, 404);
    }

    // Update all subtasks if task is marked as completed
    if (status === "completed") {
      // Get all subtasks
      const subtasks = await Subtask.findByTaskId(id);

      // Update all subtasks to completed
      for (const subtask of subtasks) {
        await Subtask.updateStatus(subtask.id, id, "completed");
      }

      // Update task status and progress
      await Task.update(id, req.userId, {
        status: "completed",
        progress: 100,
      });
    } else {
      // If marking as pending, we need to recalculate progress
      await updateTaskProgress(id);
    }

    // Get the updated task and its subtasks
    const updatedTask = await Task.findOne(id, req.userId);
    const subtasks = await Subtask.findByTaskId(id);

    return success(
      res,
      {
        ...updatedTask,
        subtasks,
      },
      "Task status was updated successfully."
    );
  } catch (err) {
    console.error("Error updating task status:", err);
    return error(
      res,
      "Error updating Task status with id=" + req.params.task_id
    );
  }
};

// Delete a Task with the specified id
exports.delete = async (req, res) => {
  try {
    const id = req.params.task_id;

    // Check if task exists
    const task = await Task.findOne(id, req.userId);
    if (!task) {
      return error(res, `Task with id=${id} not found!`, 404);
    }

    // Delete the task (cascade deletion will handle subtasks)
    const affectedRows = await Task.delete(id, req.userId);

    if (affectedRows > 0) {
      return success(res, null, "Task was deleted successfully!");
    } else {
      return error(
        res,
        `Cannot delete Task with id=${id}. Maybe Task was not found!`
      );
    }
  } catch (err) {
    console.error("Error deleting task:", err);
    return error(res, "Could not delete Task with id=" + req.params.task_id);
  }
};

// Helper function to update task progress based on subtasks
const updateTaskProgress = async (taskId) => {
  try {
    // Get completion statistics for the task's subtasks
    const stats = await Subtask.getCompletionStats(taskId);

    if (stats.total === 0) {
      // No subtasks, set task status to pending and progress to 0
      await Task.update(taskId, null, {
        status: "pending",
        progress: 0,
      });
      return;
    }

    // Calculate progress percentage
    const progress = (stats.completed / stats.total) * 100;

    // Update task progress and status
    if (stats.completed === stats.total) {
      await Task.update(taskId, null, {
        status: "completed",
        progress: 100,
      });
    } else {
      await Task.update(taskId, null, {
        status: "pending",
        progress: progress,
      });
    }
  } catch (error) {
    console.error("Error updating task progress:", error);
    throw error;
  }
};

// Export updateTaskProgress for use in subtask controller
exports.updateTaskProgress = updateTaskProgress;
