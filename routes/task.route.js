const { verifyToken } = require("../middlewares/auth.middleware");
const taskController = require("../controllers/task.controller");
const subtaskController = require("../controllers/subtask.controller");

module.exports = function (app) {
  // Task routes
  app.post("/api/tasks", [verifyToken], taskController.create);
  app.get("/api/tasks", [verifyToken], taskController.findAll);
  app.get("/api/tasks/:task_id", [verifyToken], taskController.findOne);
  app.put("/api/tasks/:task_id", [verifyToken], taskController.update);
  app.patch(
    "/api/tasks/:task_id/status",
    [verifyToken],
    taskController.updateStatus
  );
  app.delete("/api/tasks/:task_id", [verifyToken], taskController.delete);

  // Subtask routes
  app.post(
    "/api/tasks/:task_id/subtasks",
    [verifyToken],
    subtaskController.create
  );
  app.get(
    "/api/tasks/:task_id/subtasks",
    [verifyToken],
    subtaskController.findAll
  );
  app.put(
    "/api/tasks/:task_id/subtasks/:subtask_id",
    [verifyToken],
    subtaskController.update
  );
  app.patch(
    "/api/tasks/:task_id/subtasks/:subtask_id/status",
    [verifyToken],
    subtaskController.updateStatus
  );
  app.delete(
    "/api/tasks/:task_id/subtasks/:subtask_id",
    [verifyToken],
    subtaskController.delete
  );
};
