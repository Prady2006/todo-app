const taskController = require("../controllers/task.controller");
const Task = require("../models/task.model");
const Subtask = require("../models/subtask.model");
const { success, error } = require("../utils/response.util");

// Mock the models and utilities
jest.mock("../models/task.model");
jest.mock("../models/subtask.model");
jest.mock("../utils/response.util");

describe("Task Controller", () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request and response objects
    req = {
      body: {},
      params: {},
      query: {},
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
    it("should create a task successfully", async () => {
      // Setup
      req.body = {
        title: "Test Task",
        description: "Test Description",
        dueDate: "2025-12-31",
        priority: "high",
      };

      const mockTask = { id: 1, ...req.body, userId: req.userId };
      Task.create.mockResolvedValue(mockTask);

      // Execute
      const result = await taskController.create(req, res);

      // Assert
      expect(Task.create).toHaveBeenCalledWith({
        title: "Test Task",
        description: "Test Description",
        dueDate: "2025-12-31",
        priority: "high",
        userId: "user123",
      });
      expect(success).toHaveBeenCalledWith(
        res,
        mockTask,
        "Task created successfully!",
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
      const result = await taskController.create(req, res);

      // Assert
      expect(Task.create).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(res, "Title cannot be empty!", 400);
      expect(result.status).toBe(400);
    });

    it("should handle database errors", async () => {
      // Setup
      req.body = {
        title: "Test Task",
      };

      const dbError = new Error("Database error");
      Task.create.mockRejectedValue(dbError);

      // Execute
      const result = await taskController.create(req, res);

      // Assert
      expect(Task.create).toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(res, "Database error");
      expect(result.status).toBe(500);
    });
  });

  describe("findAll", () => {
    it("should return all tasks with their subtasks", async () => {
      // Setup
      const mockTasks = [
        { id: 1, title: "Task 1", userId: req.userId },
        { id: 2, title: "Task 2", userId: req.userId },
      ];

      const mockSubtasks = [
        { id: 1, title: "Subtask 1", taskId: 1 },
        { id: 2, title: "Subtask 2", taskId: 1 },
      ];

      Task.findAll.mockResolvedValue(mockTasks);
      Subtask.findByTaskId.mockResolvedValue(mockSubtasks);

      // Execute
      const result = await taskController.findAll(req, res);

      // Assert
      expect(Task.findAll).toHaveBeenCalledWith(req.userId, undefined);
      expect(Subtask.findByTaskId).toHaveBeenCalledTimes(2);
      expect(success).toHaveBeenCalledWith(res, [
        { ...mockTasks[0], subtasks: mockSubtasks },
        { ...mockTasks[1], subtasks: mockSubtasks },
      ]);
      expect(result.status).toBe(200);
    });

    it("should filter tasks by status", async () => {
      // Setup
      req.query = { status: "pending" };
      const mockTasks = [
        { id: 1, title: "Task 1", status: "pending", userId: req.userId },
      ];
      const mockSubtasks = [];

      Task.findAll.mockResolvedValue(mockTasks);
      Subtask.findByTaskId.mockResolvedValue(mockSubtasks);

      // Execute
      await taskController.findAll(req, res);

      // Assert
      expect(Task.findAll).toHaveBeenCalledWith(req.userId, "pending");
    });

    it("should handle errors when retrieving tasks", async () => {
      // Setup
      const dbError = new Error("Database error");
      Task.findAll.mockRejectedValue(dbError);

      // Execute
      const result = await taskController.findAll(req, res);

      // Assert
      expect(error).toHaveBeenCalledWith(res, "Database error");
      expect(result.status).toBe(500);
    });
  });

  describe("findOne", () => {
    it("should return a task with its subtasks", async () => {
      // Setup
      req.params = { task_id: "1" };
      const mockTask = { id: 1, title: "Task 1", userId: req.userId };
      const mockSubtasks = [{ id: 1, title: "Subtask 1", taskId: 1 }];

      Task.findOne.mockResolvedValue(mockTask);
      Subtask.findByTaskId.mockResolvedValue(mockSubtasks);

      // Execute
      const result = await taskController.findOne(req, res);

      // Assert
      expect(Task.findOne).toHaveBeenCalledWith("1", req.userId);
      expect(Subtask.findByTaskId).toHaveBeenCalledWith("1");
      expect(success).toHaveBeenCalledWith(res, {
        ...mockTask,
        subtasks: mockSubtasks,
      });
      expect(result.status).toBe(200);
    });

    it("should return 404 when task is not found", async () => {
      // Setup
      req.params = { task_id: "999" };
      Task.findOne.mockResolvedValue(null);

      // Execute
      const result = await taskController.findOne(req, res);

      // Assert
      expect(Task.findOne).toHaveBeenCalledWith("999", req.userId);
      expect(error).toHaveBeenCalledWith(
        res,
        "Task with id=999 not found!",
        404
      );
      expect(result.status).toBe(404);
    });
  });

  describe("update", () => {
    it("should update a task successfully", async () => {
      // Setup
      req.params = { task_id: "1" };
      req.body = { title: "Updated Task", priority: "low" };

      const mockTask = { id: 1, title: "Task 1", userId: req.userId };
      const updatedTask = { ...mockTask, ...req.body };
      const mockSubtasks = [];

      Task.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(updatedTask);
      Task.update.mockResolvedValue(1);
      Subtask.findByTaskId.mockResolvedValue(mockSubtasks);

      // Execute
      const result = await taskController.update(req, res);

      // Assert
      expect(Task.findOne).toHaveBeenCalledWith("1", req.userId);
      expect(Task.update).toHaveBeenCalledWith("1", req.userId, req.body);
      expect(success).toHaveBeenCalledWith(
        res,
        { ...updatedTask, subtasks: mockSubtasks },
        "Task was updated successfully."
      );
      expect(result.status).toBe(200);
    });

    it("should return 404 when task to update is not found", async () => {
      // Setup
      req.params = { task_id: "999" };
      req.body = { title: "Updated Task" };

      Task.findOne.mockResolvedValue(null);

      // Execute
      const result = await taskController.update(req, res);

      // Assert
      expect(Task.update).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(
        res,
        "Task with id=999 not found!",
        404
      );
      expect(result.status).toBe(404);
    });
  });

  describe("updateStatus", () => {
    it("should update task status to completed and complete all subtasks", async () => {
      // Setup
      req.params = { task_id: "1" };
      req.body = { status: "completed" };

      const mockTask = {
        id: 1,
        title: "Task 1",
        status: "pending",
        userId: req.userId,
      };
      const mockSubtasks = [
        { id: 1, title: "Subtask 1", taskId: 1, status: "pending" },
        { id: 2, title: "Subtask 2", taskId: 1, status: "pending" },
      ];
      const updatedTask = { ...mockTask, status: "completed", progress: 100 };

      Task.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(updatedTask);
      Subtask.findByTaskId.mockResolvedValue(mockSubtasks);
      Subtask.updateStatus.mockResolvedValue(true);
      Task.update.mockResolvedValue(1);

      // Execute
      const result = await taskController.updateStatus(req, res);

      // Assert
      expect(Task.findOne).toHaveBeenCalledWith("1", req.userId);
      expect(Subtask.findByTaskId).toHaveBeenCalledWith("1");
      expect(Subtask.updateStatus).toHaveBeenCalledTimes(2);
      expect(Task.update).toHaveBeenCalledWith("1", req.userId, {
        status: "completed",
        progress: 100,
      });
      expect(success).toHaveBeenCalled();
      expect(result.status).toBe(200);
    });

    it("should return error for invalid status", async () => {
      // Setup
      req.params = { task_id: "1" };
      req.body = { status: "invalid-status" };

      // Execute
      const result = await taskController.updateStatus(req, res);

      // Assert
      expect(Task.findOne).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(
        res,
        "Status must be either 'pending' or 'completed'",
        400
      );
      expect(result.status).toBe(400);
    });
  });

  describe("delete", () => {
    it("should delete a task successfully", async () => {
      // Setup
      req.params = { task_id: "1" };

      const mockTask = { id: 1, title: "Task 1", userId: req.userId };

      Task.findOne.mockResolvedValue(mockTask);
      Task.delete.mockResolvedValue(1);

      // Execute
      const result = await taskController.delete(req, res);

      // Assert
      expect(Task.findOne).toHaveBeenCalledWith("1", req.userId);
      expect(Task.delete).toHaveBeenCalledWith("1", req.userId);
      expect(success).toHaveBeenCalledWith(
        res,
        null,
        "Task was deleted successfully!"
      );
      expect(result.status).toBe(200);
    });

    it("should return 404 when task to delete is not found", async () => {
      // Setup
      req.params = { task_id: "999" };

      Task.findOne.mockResolvedValue(null);

      // Execute
      const result = await taskController.delete(req, res);

      // Assert
      expect(Task.delete).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(
        res,
        "Task with id=999 not found!",
        404
      );
      expect(result.status).toBe(404);
    });
  });
});
