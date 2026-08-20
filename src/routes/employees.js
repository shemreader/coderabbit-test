const express = require("express");
const router = express.Router();

const employees = require("../data/employees.json");

router.get("/", (req, res) => {
  res.json(employees);
});

router.get("/:id", (req, res) => {
  const employee = employees.find(
    e => e.id === parseInt(req.params.id)
  );

  if (!employee) {
    return res.status(404).json({
      message: "Employee not found"
    });
  }

  res.json(employee);
});

module.exports = router;