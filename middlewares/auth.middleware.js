const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

verifyToken = async (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];

  if (!token) {
    return res.status(403).send({
      success: false,
      message: "No token provided!",
    });
  }

  // Remove Bearer from string if present
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "todo-app-secret-key"
    );
    req.userId = decoded.id;

    // Verify user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "User not found!",
      });
    }

    next();
  } catch (error) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized!",
    });
  }
};

const authMiddleware = {
  verifyToken,
};

module.exports = authMiddleware;
