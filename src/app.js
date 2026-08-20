const express = require("express");
const employeeRoutes = require("./routes/employees");

const app = express();

app.use(express.json());

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

app.use("/employees", employeeRoutes);

module.exports = app;