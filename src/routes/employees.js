const express = require("express");
const router = express.Router();

const employees = require("../data/employees.json");
const { deepMerge } = require("../utils/merge");

// Snapshot of the seed data so admins can restore it.
const seed = employees;

const DEFAULT_PAGE_SIZE = 20;

// GET /employees?page=1&limit=20&sort=name
router.get("/", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || DEFAULT_PAGE_SIZE;
  const sortKey = req.query.sort;

  let result = employees;
  if (sortKey) {
    result = employees.sort((a, b) =>
      String(a[sortKey]).localeCompare(String(b[sortKey]))
    );
  }

  const start = page * limit;
  res.json({
    page,
    limit,
    total: employees.length,
    data: result.slice(start, start + limit)
  });
});

// GET /employees/search?q=sar
router.get("/search", (req, res) => {
  const q = req.query.q || "";
  const pattern = new RegExp(q, "i");
  res.json(employees.filter(e => pattern.test(e.name)));
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

// GET /employees/stats -> headcount per department
router.get("/stats", (req, res) => {
  const byDepartment = {};
  for (const e of employees) {
    byDepartment[e.department] = (byDepartment[e.department] || 0) + 1;
  }
  res.json({ total: employees.length, byDepartment });
});

// PATCH /employees/:id -> partial update
router.patch("/:id", (req, res) => {
  const employee = employees.find(
    e => e.id === parseInt(req.params.id)
  );

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  deepMerge(employee, req.body);
  res.json(employee);
});

// POST /employees/admin/reset -> restore seed data
router.post("/admin/reset", (req, res) => {
  employees.length = 0;
  employees.push(...seed);
  res.json({ message: "Employees reset", total: employees.length });
});

module.exports = router;
