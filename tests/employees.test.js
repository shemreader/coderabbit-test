const request = require("supertest");
const app = require("../src/app");

describe("Employees API", () => {
  test("Get all employees", async () => {
    const response = await request(app).get("/employees");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(3);
  });

  test("Filter employees by department", async () => {
    const response = await request(app).get("/employees?department=Product");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      { id: 2, name: "Sarah Cohen", department: "Product" }
    ]);
  });

  test("Filter department case-insensitively and ignore surrounding whitespace", async () => {
    const response = await request(app).get("/employees?department=%20engineering%20");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
      { id: 1, name: "John Doe", department: "Engineering" }
    ]);
  });

  test("Unknown department returns an empty list", async () => {
    const response = await request(app).get("/employees?department=Legal");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("Reject an empty department filter", async () => {
    const response = await request(app).get("/employees?department=%20");

    expect(response.statusCode).toBe(400);
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