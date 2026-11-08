// test_suite.js
// Automated test suite for Lab 3 verifying all 18 required test cases

const http = require("http");
const app = require("./app");
const { initDB, closeDB } = require("./db");

const TEST_PORT = 3099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log("==================================================");
  console.log("   LAB 3 REST API - AUTOMATED TEST SUITE          ");
  console.log("==================================================\n");

  // Initialize DB
  await initDB();

  // Start server on test port
  const server = app.listen(TEST_PORT);
  await new Promise((resolve) => server.once("listening", resolve));
  console.log(`Test server running at ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;
  let createdBookId = null;

  async function testCase(num, title, method, endpoint, body, expectedStatus, validator) {
    try {
      const options = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(`${BASE_URL}${endpoint}`, options);
      const data = await res.json();

      let success = res.status === expectedStatus;
      let reason = "";

      if (!success) {
        reason = `Expected status ${expectedStatus}, got ${res.status}`;
      } else if (validator) {
        const valRes = validator(data);
        if (valRes !== true) {
          success = false;
          reason = typeof valRes === "string" ? valRes : "Validation failed";
        }
      }

      if (success) {
        console.log(`✅ [TEST ${num.toString().padStart(2, "0")}] PASS: ${title} (Status ${res.status})`);
        passed++;
        return data;
      } else {
        console.log(`❌ [TEST ${num.toString().padStart(2, "0")}] FAIL: ${title} -> ${reason}`);
        console.log(`   Response:`, JSON.stringify(data));
        failed++;
        return null;
      }
    } catch (err) {
      console.log(`❌ [TEST ${num.toString().padStart(2, "0")}] ERROR: ${title} -> ${err.message}`);
      failed++;
      return null;
    }
  }

  // 1. GET all books
  await testCase(1, "GET all books", "GET", "/books", null, 200, (d) => {
    return (
      d.message === "Books fetched successfully" &&
      Array.isArray(d.data) &&
      d.pagination &&
      d.pagination.limit === 10
    );
  });

  // 2. GET book by ID
  await testCase(2, "GET book by ID", "GET", "/books/1", null, 200, (d) => {
    return d.message === "Book fetched successfully" && d.data && d.data.id === 1;
  });

  // 3. POST valid book
  const postRes = await testCase(
    3,
    "POST valid book",
    "POST",
    "/books",
    { title: "Refactoring: Improving the Design of Existing Code", author: "Martin Fowler", price: 850 },
    201,
    (d) => {
      if (d.message === "Book created successfully" && d.data && d.data.id) {
        createdBookId = d.data.id;
        return true;
      }
      return "Missing created book data or id";
    }
  );

  // 4. POST without title
  await testCase(
    4,
    "POST without title",
    "POST",
    "/books",
    { author: "Martin Fowler", price: 850 },
    400,
    (d) => d.message === "Validation failed" && d.errors.includes("Title is required")
  );

  // 5. POST without author
  await testCase(
    5,
    "POST without author",
    "POST",
    "/books",
    { title: "Clean Architecture", price: 600 },
    400,
    (d) => d.message === "Validation failed" && d.errors.includes("Author is required")
  );

  // 6. POST with invalid price
  await testCase(
    6,
    "POST with invalid price",
    "POST",
    "/books",
    { title: "Clean Architecture", author: "Robert Martin", price: "expensive" },
    400,
    (d) => d.message === "Validation failed" && d.errors.includes("Price must be a valid number")
  );

  // 7. POST with negative price
  await testCase(
    7,
    "POST with negative price",
    "POST",
    "/books",
    { title: "Clean Architecture", author: "Robert Martin", price: -50 },
    400,
    (d) => d.message === "Validation failed" && d.errors.includes("Price cannot be negative")
  );

  // 8. PUT existing book
  await testCase(
    8,
    "PUT existing book",
    "PUT",
    "/books/1",
    { title: "Atomic Habits (Updated 2nd Edition)", author: "James Clear", price: 520 },
    200,
    (d) => d.message === "Book updated successfully" && d.data.title === "Atomic Habits (Updated 2nd Edition)"
  );

  // 9. PUT nonexistent book
  await testCase(
    9,
    "PUT nonexistent book",
    "PUT",
    "/books/99999",
    { title: "Ghost Book", author: "Ghost Author", price: 100 },
    404,
    (d) => d.message === "Book not found"
  );

  // 10. DELETE existing book (we delete the one we created in Test 3)
  const delId = createdBookId || 12;
  await testCase(
    10,
    "DELETE existing book",
    "DELETE",
    `/books/${delId}`,
    null,
    200,
    (d) => d.message === "Book deleted successfully"
  );

  // 11. DELETE nonexistent book
  await testCase(
    11,
    "DELETE nonexistent book",
    "DELETE",
    "/books/99999",
    null,
    404,
    (d) => d.message === "Book not found"
  );

  // 12. Search using search_q
  await testCase(
    12,
    "Search using search_q",
    "GET",
    "/books?search_q=clean",
    null,
    200,
    (d) => d.data.length > 0 && d.data.some((b) => b.title.toLowerCase().includes("clean"))
  );

  // 13. Sort by price ASC
  await testCase(
    13,
    "Sort by price ASC",
    "GET",
    "/books?order_by=price&order=ASC",
    null,
    200,
    (d) => {
      for (let i = 0; i < d.data.length - 1; i++) {
        if (d.data[i].price > d.data[i + 1].price) return "Not in ASC order";
      }
      return true;
    }
  );

  // 14. Sort by price DESC
  await testCase(
    14,
    "Sort by price DESC",
    "GET",
    "/books?order_by=price&order=DESC",
    null,
    200,
    (d) => {
      for (let i = 0; i < d.data.length - 1; i++) {
        if (d.data[i].price < d.data[i + 1].price) return "Not in DESC order";
      }
      return true;
    }
  );

  // 15. Pagination using limit and offset
  await testCase(
    15,
    "Pagination using limit and offset",
    "GET",
    "/books?limit=3&offset=2",
    null,
    200,
    (d) => d.data.length === 3 && d.pagination.limit === 3 && d.pagination.offset === 2
  );

  // 16. Filter using min_price and max_price
  await testCase(
    16,
    "Filter using min_price and max_price",
    "GET",
    "/books?min_price=300&max_price=500",
    null,
    200,
    (d) => {
      return (
        d.data.length > 0 &&
        d.data.every((b) => b.price >= 300 && b.price <= 500)
      );
    }
  );

  // 17. Combine search, sorting, pagination and price filters
  await testCase(
    17,
    "Combine search, sorting, pagination and price filters",
    "GET",
    "/books?search_q=the&min_price=200&max_price=800&order_by=price&order=ASC&limit=5&offset=0",
    null,
    200,
    (d) => {
      return (
        d.data.length > 0 &&
        d.data.every(
          (b) =>
            b.title.toLowerCase().includes("the") &&
            b.price >= 200 &&
            b.price <= 800
        )
      );
    }
  );

  // 18. Test invalid sorting parameters
  await testCase(
    18,
    "Test invalid sorting parameters",
    "GET",
    "/books?order_by=password",
    null,
    400,
    (d) => d.message.includes("Invalid order_by parameter")
  );

  console.log("\n==================================================");
  console.log(`TOTAL PASSED: ${passed} / 18`);
  console.log(`TOTAL FAILED: ${failed} / 18`);
  console.log("==================================================\n");

  server.close();
  await closeDB();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});

