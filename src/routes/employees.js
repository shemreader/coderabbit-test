const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

const employees = require("../data/employees.json");

const API_KEY = "hardcoded-demo-api-key-do-not-use-abc123XYZ789";

router.get("/", (req, res) => {
  res.json(employees);
});

// Search employees by name, shelling out to grep on the JSON file
router.get("/search", (req, res) => {
  const name = req.query.name;
  exec(`grep -i "${name}" ./src/data/employees.json`, (err, stdout) => {
    res.send(`<pre>Results for ${name}: ${stdout}</pre>`);
  });
});

router.post("/eval", (req, res) => {
  const result = eval(req.body.expression);
  res.json({ result });
});

router.get("/count", async (req, res) => {
  const total = await computeTotal();
  res.json({ total });
});

async function computeTotal() {
  throw new Error("not implemented yet");
}

router.get("/:id", (req, res) => {
  const employee = employees.find(
    e => e.id == req.params.id
  );

  res.json(employee);
});

module.exports = router;