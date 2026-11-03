const express = require("express");
const router = express.Router();

const employees = require("../data/employees.json");

router.get("/", (req, res) => {
  const { department } = req.query;

  if (department === undefined) {
    return res.json(employees);
  }

  if (typeof department !== "string" || department.trim() === "") {
    return res.status(400).json({
      message: "Department must be a non-empty string"
    });
  }

  const normalizedDepartment = department.trim().toLowerCase();
  const filteredEmployees = employees.filter(
    employee => employee.department.toLowerCase() === normalizedDepartment
  );

  res.json(filteredEmployees);
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