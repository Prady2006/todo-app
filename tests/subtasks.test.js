const subtaskController = require("../controllers/subtask.controller");
const pool = require("../models/db").pool;
const { success, error } = require("../utils/response.util");

// Mock the database connection and utilities
jest.mock("../models/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));
jest.mock("../utils/response.util");

describe("Subtask Controller", () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request and response objects
    req = {
      body: {},
      params: {
        task_id: "1",
        subtask_id: "1",
      },
      userId: "user123",
    };

    res = {};

    // Mock success and error functions
    success.mockImplementation((res, data, message, code) => {
      return { status: code || 200, data, message };
    });

    error.mockImplementation((res, message, code) => {
      return { status: code || 500, message };
    });
  });

  describe("create", () => {
    it("should create a subtask successfully", async () => {
      // Setup
      req.body = {
        title: "Test Subtask",
        description: "Test Description",
      };

      const mockTask = [{ id: 1, title: "Parent Task", user_id: req.userId }];
      const mockInsertResult = { insertId: 1 };
      const mockSubtask = [
        {
          id: 1,
          title: "Test Subtask",
          description: "Test Description",
          task_id: 1,
          status: "pending",
        },
      ];

      pool.query.mockImplementation((query, params) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [mockTask, []];
        } else if (query.includes("INSERT INTO subtasks")) {
          return [mockInsertResult, []];
        } else if (query.includes("SELECT * FROM subtasks WHERE id")) {
          return [mockSubtask, []];
        } else {
          return [[], []]; // For updateTaskProgress queries
        }
      });

      // Execute
      const result = await subtaskController.create(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
        ["1", req.userId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO subtasks (title, description, task_id, status) VALUES (?, ?, ?, "pending")',
        ["Test Subtask", "Test Description", "1"]
      );
      expect(success).toHaveBeenCalledWith(
        res,
        mockSubtask[0],
        "Subtask created successfully!",
        201
      );
      expect(result.status).toBe(201);
    });

    it("should return error when title is empty", async () => {
      // Setup
      req.body = {
        description: "Test Description",
      };

      // Execute
      const result = await subtaskController.create(req, res);

      // Assert
      expect(pool.query).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(res, "Title cannot be empty!", 400);
      expect(result.status).toBe(400);
    });

    it("should return 404 when task is not found", async () => {
      // Setup
      req.body = {
        title: "Test Subtask",
      };

      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [[], []]; // No task found
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.create(req, res);

      // Assert
      expect(error).toHaveBeenCalledWith(res, "Task with id=1 not found!", 404);
      expect(result.status).toBe(404);
    });
  });

  describe("findAll", () => {
    it("should return all subtasks for a task", async () => {
      // Setup
      const mockTask = [{ id: 1, title: "Parent Task", user_id: req.userId }];
      const mockSubtasks = [
        { id: 1, title: "Subtask 1", task_id: 1 },
        { id: 2, title: "Subtask 2", task_id: 1 },
      ];

      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [mockTask, []];
        } else if (query.includes("SELECT * FROM subtasks")) {
          return [mockSubtasks, []];
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.findAll(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
        ["1", req.userId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM subtasks WHERE task_id = ?",
        ["1"]
      );
      expect(success).toHaveBeenCalledWith(res, mockSubtasks);
      expect(result.status).toBe(200);
    });

    it("should return 404 when task is not found", async () => {
      // Setup
      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [[], []]; // No task found
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.findAll(req, res);

      // Assert
      expect(error).toHaveBeenCalledWith(res, "Task with id=1 not found!", 404);
      expect(result.status).toBe(404);
    });
  });

  describe("update", () => {
    it("should update a subtask successfully", async () => {
      // Setup
      req.body = {
        title: "Updated Subtask",
        description: "Updated Description",
        status: "completed",
      };

      const mockTask = [{ id: 1, title: "Parent Task", user_id: req.userId }];
      const mockSubtask = [{ id: 1, title: "Subtask 1", task_id: 1 }];
      const mockUpdateResult = { affectedRows: 1 };
      const mockUpdatedSubtask = [
        {
          id: 1,
          title: "Updated Subtask",
          description: "Updated Description",
          task_id: 1,
          status: "completed",
        },
      ];

      pool.query.mockImplementation((query, params) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [mockTask, []];
        } else if (
          query.includes("SELECT * FROM subtasks WHERE id = ? AND task_id")
        ) {
          return [mockSubtask, []];
        } else if (query.includes("UPDATE subtasks SET")) {
          return [mockUpdateResult, []];
        } else if (query.includes("SELECT * FROM subtasks WHERE id =")) {
          return [mockUpdatedSubtask, []];
        }
        return [[], []]; // For updateTaskProgress queries
      });

      // Execute
      const result = await subtaskController.update(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
        ["1", req.userId]
      );
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM subtasks WHERE id = ? AND task_id = ?",
        ["1", "1"]
      );
      expect(success).toHaveBeenCalledWith(
        res,
        mockUpdatedSubtask[0],
        "Subtask was updated successfully."
      );
      expect(result.status).toBe(200);
    });

    it("should return 404 when task is not found", async () => {
      // Setup
      req.body = { title: "Updated Subtask" };

      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [[], []]; // No task found
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.update(req, res);

      // Assert
      expect(error).toHaveBeenCalledWith(res, "Task with id=1 not found!", 404);
      expect(result.status).toBe(404);
    });

    it("should return 404 when subtask is not found", async () => {
      // Setup
      req.body = { title: "Updated Subtask" };

      const mockTask = [{ id: 1, title: "Parent Task", user_id: req.userId }];

      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [mockTask, []];
        } else if (query.includes("SELECT * FROM subtasks")) {
          return [[], []]; // No subtask found
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.update(req, res);

      // Assert
      expect(error).toHaveBeenCalledWith(
        res,
        "Subtask with id=1 not found!",
        404
      );
      expect(result.status).toBe(404);
    });

    it("should return error when no valid fields to update", async () => {
      // Setup
      req.body = {}; // Empty body, no fields to update

      const mockTask = [{ id: 1, title: "Parent Task", user_id: req.userId }];
      const mockSubtask = [{ id: 1, title: "Subtask 1", task_id: 1 }];

      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [mockTask, []];
        } else if (query.includes("SELECT * FROM subtasks")) {
          return [mockSubtask, []];
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.update(req, res);

      // Assert
      expect(error).toHaveBeenCalledWith(res, "No valid fields to update", 400);
      expect(result.status).toBe(400);
    });
  });

  describe("updateStatus", () => {
    it("should update subtask status successfully", async () => {
      // Setup
      req.body = {
        status: "completed",
      };

      const mockTask = [{ id: 1, title: "Parent Task", user_id: req.userId }];
      const mockSubtask = [
        { id: 1, title: "Subtask 1", task_id: 1, status: "pending" },
      ];
      const mockUpdateResult = { affectedRows: 1 };
      const mockUpdatedSubtask = [
        { id: 1, title: "Subtask 1", task_id: 1, status: "completed" },
      ];

      pool.query.mockImplementation((query, params) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [mockTask, []];
        } else if (
          query.includes("SELECT * FROM subtasks WHERE id = ? AND task_id")
        ) {
          return [mockSubtask, []];
        } else if (query.includes("UPDATE subtasks SET status")) {
          return [mockUpdateResult, []];
        } else if (query.includes("SELECT * FROM subtasks WHERE id =")) {
          return [mockUpdatedSubtask, []];
        }
        return [[], []]; // For updateTaskProgress queries
      });

      // Execute
      const result = await subtaskController.updateStatus(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        "UPDATE subtasks SET status = ? WHERE id = ? AND task_id = ?",
        ["completed", "1", "1"]
      );
      expect(success).toHaveBeenCalledWith(
        res,
        mockUpdatedSubtask[0],
        "Subtask status was updated successfully."
      );
      expect(result.status).toBe(200);
    });

    it("should return error for invalid status", async () => {
      // Setup
      req.body = {
        status: "invalid-status",
      };

      // Execute
      const result = await subtaskController.updateStatus(req, res);

      // Assert
      expect(error).toHaveBeenCalledWith(
        res,
        "Status must be either 'pending' or 'completed'",
        400
      );
      expect(result.status).toBe(400);
    });
  });

  describe("delete", () => {
    it("should delete a subtask successfully", async () => {
      // Setup
      const mockTask = [{ id: 1, title: "Parent Task", user_id: req.userId }];
      const mockSubtask = [{ id: 1, title: "Subtask 1", task_id: 1 }];
      const mockDeleteResult = { affectedRows: 1 };

      pool.query.mockImplementation((query, params) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [mockTask, []];
        } else if (
          query.includes("SELECT * FROM subtasks WHERE id = ? AND task_id")
        ) {
          return [mockSubtask, []];
        } else if (query.includes("DELETE FROM subtasks")) {
          return [mockDeleteResult, []];
        }
        return [[], []]; // For updateTaskProgress queries
      });

      // Execute
      const result = await subtaskController.delete(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        "DELETE FROM subtasks WHERE id = ? AND task_id = ?",
        ["1", "1"]
      );
      expect(success).toHaveBeenCalledWith(
        res,
        null,
        "Subtask was deleted successfully!"
      );
      expect(result.status).toBe(200);
    });

    it("should return 404 when task is not found", async () => {
      // Setup
      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [[], []]; // No task found
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.delete(req, res);

      // Assert
      expect(error).toHaveBeenCalledWith(res, "Task with id=1 not found!", 404);
      expect(result.status).toBe(404);
    });

    it("should return 404 when subtask is not found", async () => {
      // Setup
      const mockTask = [{ id: 1, title: "Parent Task", user_id: req.userId }];

      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT * FROM tasks")) {
          return [mockTask, []];
        } else if (query.includes("SELECT * FROM subtasks")) {
          return [[], []]; // No subtask found
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.delete(req, res);

      // Assert
      expect(error).toHaveBeenCalledWith(
        res,
        "Subtask with id=1 not found!",
        404
      );
      expect(result.status).toBe(404);
    });
  });

  describe("updateTaskProgress", () => {
    it("should calculate progress correctly when there are subtasks", async () => {
      // Setup
      const totalRows = [{ total: 4 }];
      const completedRows = [{ completed: 2 }];

      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT COUNT(*) as total")) {
          return [[totalRows[0]], []];
        } else if (query.includes("SELECT COUNT(*) as completed")) {
          return [[completedRows[0]], []];
        } else if (query.includes("UPDATE tasks SET progress")) {
          return [{ affectedRows: 1 }, []];
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.updateTaskProgress("1");

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        "UPDATE tasks SET progress = ? WHERE id = ?",
        [50, "1"] // 2/4 completed = 50%
      );
      expect(result).toBe(true);
    });

    it("should set progress to 0 when there are no subtasks", async () => {
      // Setup
      const totalRows = [{ total: 0 }];
      const completedRows = [{ completed: 0 }];

      pool.query.mockImplementation((query) => {
        if (query.includes("SELECT COUNT(*) as total")) {
          return [[totalRows[0]], []];
        } else if (query.includes("SELECT COUNT(*) as completed")) {
          return [[completedRows[0]], []];
        } else if (query.includes("UPDATE tasks SET progress")) {
          return [{ affectedRows: 1 }, []];
        }
        return [[], []];
      });

      // Execute
      const result = await subtaskController.updateTaskProgress("1");

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        "UPDATE tasks SET progress = ? WHERE id = ?",
        [0, "1"]
      );
      expect(result).toBe(true);
    });

    it("should handle errors during progress update", async () => {
      // Setup
      pool.query.mockRejectedValue(new Error("Database error"));

      // Execute
      const result = await subtaskController.updateTaskProgress("1");

      // Assert
      expect(result).toBe(false);
    });
  });
});
