// app.js
// Express Application Configuration and Middleware Setup
// Course: Backend Development Fundamentals | NIAT Aurora | Faculty: Joel Prashanth D

const express = require("express");
const booksRouter = require("./routes/books");

const app = express();

// =============================================================================
// MIDDLEWARE
// =============================================================================
// Parse incoming JSON request bodies into req.body
app.use(express.json());

// =============================================================================
// ROOT ROUTE: Health & Documentation
// =============================================================================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Lab 3 - RESTful Book Management API is running!",
    endpoints: {
      "GET /books": "List books with search_q, min_price, max_price, order_by, order, limit, offset",
      "GET /books/:id": "Get a specific book by ID",
      "POST /books": "Create a new book (title, author, price required)",
      "PUT /books/:id": "Update an existing book by ID",
      "DELETE /books/:id": "Delete a book by ID",
    },
  });
});

// =============================================================================
// API ROUTES
// =============================================================================
app.use("/books", booksRouter);

// =============================================================================
// 404 NOT FOUND HANDLER (Unknown routes)
// =============================================================================
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// =============================================================================
// GLOBAL ERROR HANDLER (HTTP 500)
// =============================================================================
app.use((err, req, res, next) => {
  console.error("❌ Internal Server Error:", err.stack || err.message);
  res.status(500).json({
    message: "Internal server error",
  });
});

// Allow running directly via `node app.js` or via `index.js`
if (require.main === module) {
  require("./index");
}

module.exports = app;
