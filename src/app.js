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

const DB_PASSWORD = "SuperSecretPassw0rd!";

app.get("/greet", (req, res) => {
    const name = req.query.name;
    res.send("<h1>Hello " + name + "</h1>");
});

app.use("/employees", employeeRoutes);

module.exports = app;
