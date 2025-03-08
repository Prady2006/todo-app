const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { success, error } = require("../utils/response.util");

exports.signup = async (req, res) => {
  try {
    // Validate request
    if (!req.body.username || !req.body.email || !req.body.password) {
      return error(res, "Username, email and password are required!", 400);
    }

    // Check if username or email already exists
    const existingUser = await User.findByUsername(req.body.username);
    if (existingUser) {
      return error(res, "Username already in use!", 400);
    }

    const existingEmail = await User.findByEmail(req.body.email);
    if (existingEmail) {
      return error(res, "Email already in use!", 400);
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(req.body.password, 8);

    // Create a user
    const user = {
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    };

    // Save User in the database
    const data = await User.create(user);

    return success(
      res,
      {
        id: data.id,
        username: data.username,
        email: data.email,
      },
      "User registered successfully!",
      201
    );
  } catch (err) {
    console.error("Error in signup:", err);
    return error(
      res,
      err.message || "Some error occurred while creating the User."
    );
  }
};

exports.signin = async (req, res) => {
  try {
    // Validate request
    if (!req.body.username || !req.body.password) {
      return error(res, "Username and password are required!", 400);
    }

    // Find user by username
    const user = await User.findByUsername(req.body.username);

    if (!user) {
      return error(res, "User not found!", 404);
    }

    // Compare passwords
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return error(res, "Invalid Password!", 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "todo-app-secret-key",
      {
        expiresIn: 86400, // 24 hours
      }
    );

    return success(
      res,
      {
        id: user.id,
        username: user.username,
        email: user.email,
        accessToken: token,
      },
      "Login successful"
    );
  } catch (err) {
    console.error("Error in signin:", err);
    return error(res, err.message || "Some error occurred during login.");
  }
};
