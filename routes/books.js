// routes/books.js
// Express Router for RESTful Books API
// Handles: GET /books, GET /books/:id, POST /books, PUT /books/:id, DELETE /books/:id
// Course: Backend Development Fundamentals | NIAT Aurora | Faculty: Joel Prashanth D

const express = require("express");
const router = express.Router();
const { getDB } = require("../db");

// =============================================================================
// HELPER: Validate Request Body for POST and PUT
// =============================================================================
function validateBookBody(body) {
  const errors = [];
  const { title, author, price } = body;

  // Title validation
  if (title === undefined || title === null) {
    errors.push("Title is required");
  } else if (typeof title !== "string" || title.trim() === "") {
    errors.push("Title cannot be empty");
  }

  // Author validation
  if (author === undefined || author === null) {
    errors.push("Author is required");
  } else if (typeof author !== "string" || author.trim() === "") {
    errors.push("Author cannot be empty");
  }

  // Price validation
  if (price === undefined || price === null) {
    errors.push("Price is required");
  } else if (typeof price !== "number" || isNaN(price)) {
    errors.push("Price must be a valid number");
  } else if (price < 0) {
    errors.push("Price cannot be negative");
  }

  return errors;
}

// =============================================================================
// ROUTE 1: GET /books
// Supports: search_q, min_price, max_price, order_by, order, limit, offset
// =============================================================================
router.get("/", async (req, res, next) => {
  try {
    const db = getDB();
    const { search_q, min_price, max_price, order_by, order, limit, offset } = req.query;

    const validationErrors = [];

    // 1. Validate min_price if provided
    let minPriceNum;
    if (min_price !== undefined) {
      minPriceNum = Number(min_price);
      if (isNaN(minPriceNum) || minPriceNum < 0) {
        validationErrors.push("min_price must be a valid non-negative number");
      }
    }

    // 2. Validate max_price if provided
    let maxPriceNum;
    if (max_price !== undefined) {
      maxPriceNum = Number(max_price);
      if (isNaN(maxPriceNum) || maxPriceNum < 0) {
        validationErrors.push("max_price must be a valid non-negative number");
      }
    }

    // 3. Validate price range logic (min <= max)
    if (minPriceNum !== undefined && maxPriceNum !== undefined && !isNaN(minPriceNum) && !isNaN(maxPriceNum)) {
      if (minPriceNum > maxPriceNum) {
        validationErrors.push("min_price cannot be greater than max_price");
      }
    }

    // 4. Validate order_by against whitelist
    const allowedOrderBy = ["id", "title", "author", "price"];
    let safeOrderBy = "id";
    if (order_by !== undefined) {
      const lower = String(order_by).trim().toLowerCase();
      if (!allowedOrderBy.includes(lower)) {
        return res.status(400).json({
          message: "Invalid order_by parameter. Allowed values: id, title, author, price",
        });
      }
      safeOrderBy = lower;
    }

    // 5. Validate order against whitelist
    const allowedOrder = ["ASC", "DESC"];
    let safeOrder = "ASC";
    if (order !== undefined) {
      const upper = String(order).trim().toUpperCase();
      if (!allowedOrder.includes(upper)) {
        return res.status(400).json({
          message: "Invalid order parameter. Allowed values: ASC, DESC",
        });
      }
      safeOrder = upper;
    }

    // 6. Validate limit
    let limitNum = 10;
    if (limit !== undefined) {
      limitNum = Number(limit);
      if (!Number.isInteger(limitNum) || limitNum <= 0) {
        validationErrors.push("limit must be a positive integer greater than 0");
      }
    }

    // 7. Validate offset
    let offsetNum = 0;
    if (offset !== undefined) {
      offsetNum = Number(offset);
      if (!Number.isInteger(offsetNum) || offsetNum < 0) {
        validationErrors.push("offset must be a non-negative integer");
      }
    }

    // If query parameter validations failed, return HTTP 400
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Construct SQL WHERE clause dynamically using parameterized queries (?)
    const conditions = [];
    const params = [];

    // Search partial title
    if (search_q && search_q.trim() !== "") {
      conditions.push("title LIKE ?");
      params.push(`%${search_q.trim()}%`);
    }

    // Filter minimum price
    if (minPriceNum !== undefined) {
      conditions.push("price >= ?");
      params.push(minPriceNum);
    }

    // Filter maximum price
    if (maxPriceNum !== undefined) {
      conditions.push("price <= ?");
      params.push(maxPriceNum);
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";

    // Build final SQL query (safeOrderBy and safeOrder are strictly whitelisted)
    const sql = `SELECT * FROM book${whereClause} ORDER BY ${safeOrderBy} ${safeOrder} LIMIT ? OFFSET ?`;
    const queryParams = [...params, limitNum, offsetNum];

    const books = await db.all(sql, queryParams);

    res.status(200).json({
      message: "Books fetched successfully",
      data: books,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// ROUTE 2: GET /books/:id
// Returns a single book by ID
// =============================================================================
router.get("/:id", async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);

    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: ["id must be a positive integer"],
      });
    }

    const book = await db.get("SELECT * FROM book WHERE id = ?", [id]);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book fetched successfully",
      data: book,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// ROUTE 3: POST /books
// Creates a new book record with body validation
// =============================================================================
router.post("/", async (req, res, next) => {
  try {
    const db = getDB();

    // Validate request body
    const errors = validateBookBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    const { title, author, price, pages } = req.body;
    const pagesCount = pages !== undefined && pages !== null && !isNaN(Number(pages)) ? Number(pages) : 0;

    // Parameterized INSERT query prevents SQL injection
    const result = await db.run(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
      [title.trim(), author.trim(), Number(price), pagesCount]
    );

    // Fetch the newly created book
    const newBook = await db.get("SELECT * FROM book WHERE id = ?", [result.lastID]);

    res.status(201).json({
      message: "Book created successfully",
      data: newBook,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// ROUTE 4: PUT /books/:id
// Updates an existing book after checking existence and validating body
// =============================================================================
router.put("/:id", async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);

    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: ["id must be a positive integer"],
      });
    }

    // Check if the book exists before attempting update
    const existing = await db.get("SELECT * FROM book WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    // Validate request body
    const errors = validateBookBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    const { title, author, price, pages } = req.body;
    const pagesCount = pages !== undefined && pages !== null && !isNaN(Number(pages)) ? Number(pages) : existing.pages;

    // Parameterized UPDATE query
    await db.run(
      "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?",
      [title.trim(), author.trim(), Number(price), pagesCount, id]
    );

    const updatedBook = await db.get("SELECT * FROM book WHERE id = ?", [id]);

    res.status(200).json({
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// ROUTE 5: DELETE /books/:id
// Deletes an existing book after checking existence
// =============================================================================
router.delete("/:id", async (req, res, next) => {
  try {
    const db = getDB();
    const id = Number(req.params.id);

    // Validate ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: ["id must be a positive integer"],
      });
    }

    // Check if the book exists before attempting deletion
    const existing = await db.get("SELECT * FROM book WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    // Parameterized DELETE query
    await db.run("DELETE FROM book WHERE id = ?", [id]);

    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

