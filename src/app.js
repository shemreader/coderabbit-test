const express = require("express");
const employeeRoutes = require("./routes/employees");
const adminAuth = require("./middleware/adminAuth");

const app = express();

app.use(express.json());
app.use(adminAuth);

app.get("/health", (req, res) => {
  res.json({
    status: "UP"
  });
});

const packageInfo = require("../package.json");
app.get("/version", (req, res) => {
    res.json({
        version: packageInfo.version
    });
});

app.get("/demonew", (req, res) => {
    res.json({
        shemer: "sucks",
        scott: "rules"
    });
});

app.get("/demoolder", (req, res) => {
    res.json({
        shemer: "sucks",
        scott: "rules",
        test: "test"
    });
});

app.use("/employees", employeeRoutes);

// Centralized error handler so clients always get JSON back.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack
  });
});

module.exports = app;
