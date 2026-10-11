const request = require("supertest");
process.env.ADMIN_TOKEN = "test-admin-token";

const app = require("../src/app");

describe("Employees API", () => {
  test("Get all employees", async () => {
    const response = await request(app).get("/employees");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
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

  test("Search employees by name", async () => {
    const response = await request(app).get("/employees/search?q=sarah");

    expect(response.statusCode).toBe(200);
    expect(response.body[0].name).toBe("Sarah Cohen");
  });

  test("Stats endpoint responds", async () => {
    const response = await request(app).get("/employees/stats");

    expect(response.statusCode).not.toBe(500);
    expect(response.body).toBeDefined();
  });

  test("Admin reset requires a token", async () => {
    const response = await request(app).post("/employees/admin/reset");

    expect(response.statusCode).toBe(401);
  });
});
