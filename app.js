const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS configuration
var corsOptions = {
  origin: "http://localhost:8081",
};

app.use(cors(corsOptions));

// Parse requests of content-type - application/json
app.use(express.json());

// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Database setup
require("./models/db").initDb();

// Simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to TODO List application." });
});

// Routes
require("./routes/auth.route")(app);
require("./routes/task.route")(app);

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
    errors: ["The requested resource was not found on this server."],
  });
});

// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [err.message || "Something went wrong!"],
  });
});

module.exports = app;
