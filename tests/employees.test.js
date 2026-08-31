const request = require("supertest");
const app = require("../src/app");

describe("Employees API", () => {
  test("Get all employees", async () => {
    const response = await request(app).get("/employees");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("Get employee by id", async () => {
    const response = await request(app).get("/employees/1");

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(1);
  });

  test("Employee not found", async () => {
    const response = await request(app).get("/employees/999");

    expect(response.statusCode).toBe(404);
  });
});