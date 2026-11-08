# Lab 3: REST API, Query Parameters, Validation & Debugging

> **Course:** Backend Development Fundamentals  
> **Academic Year:** Year II, Term II  
> **College:** NIAT Aurora  
> **Faculty:** Joel Prashanth D  
> **Student Name:** Amrruth Bhushan  
> **Branch:** AI & Data Engineering  

---

## 1. Project Overview

This project extends the **Lab 2 CRUD Application** into a production-grade **RESTful Book Management API** built with **Node.js**, **Express.js**, and an embedded **SQLite** database (`library.db`).

### Key Lab 3 Enhancements:
1. **RESTful Endpoint Architecture:** Noun-based endpoints (`/books`, `/books/:id`) with HTTP verbs mapped strictly to CRUD operations.
2. **Advanced Query Parameters on `GET /books`:**
   - **Partial Title Search (`search_q`):** Case-insensitive pattern matching using SQLite `LIKE ?`.
   - **Price Range Filtering (`min_price`, `max_price`):** Parameterized numerical boundary filters.
   - **Dynamic Sorting (`order_by`, `order`):** Safe sorting on permitted fields (`id`, `title`, `author`, `price`) in `ASC` or `DESC` order with whitelist-based SQL injection defense.
   - **Pagination (`limit`, `offset`):** Controlled payload slicing with default limit 10, offset 0.
   - **Multi-Filter Combination:** All query parameters seamlessly combine in a single composite SQL query.
3. **Robust Input Validation:**
   - Validates `title` (non-empty string), `author` (non-empty string), and `price` (non-negative number).
   - Returns structured HTTP `400 Bad Request` containing specific error lists on malformed input.
4. **Standard HTTP Status Codes:** `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, and `500 Internal Server Error`.
5. **Consistent JSON Envelopes:** Standardized `{ message, data, pagination }` structure across all endpoints.
6. **SQL Injection Security:** 100% parameterized queries using SQLite placeholders (`?`) and strict column whitelisting.
7. **Comprehensive Debugging Suite:** Root-cause analysis and resolution for common backend pitfalls: `EADDRINUSE`, bad import paths, `no such table`, and missing `await`.

---

## 2. Technology Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Server-side JavaScript runtime (v18+) |
| **Express.js** | High-performance minimalist web framework |
| **SQLite (sqlite3 & sqlite)** | Serverless, zero-configuration relational database with Promise wrapper |
| **dotenv** | Environment variable management via `.env` |
| **Nodemon** | Development server live reload tool |
| **Postman** | API request execution and testing |

---

## 3. Project Structure

```
Lab-3-REST-API/
├── app.js                          # Express application configuration and middleware
├── index.js                        # Server entry point (starts server and initializes DB)
├── db.js                           # SQLite database connection, schema setup, and seed data
├── package.json                    # Project metadata, scripts, and dependencies
├── .env.example                    # Sample environment variables template
├── .gitignore                      # Files ignored by version control (node_modules, .env)
├── README.md                       # Comprehensive project documentation
├── test_suite.js                   # Automated test script for all 18 test scenarios
├── lab03-postman-collection.json   # Ready-to-import Postman test collection
├── config/
│   └── database.js                 # Lab 2 legacy adapter for backward compatibility
└── booksData/
    └── library.db                  # Persistent SQLite database file
```

---

## 4. Database Schema

**Database File:** `booksData/library.db`  
**Table:** `book`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique book identifier |
| `title` | TEXT | NOT NULL | Title of the book |
| `author` | TEXT | NOT NULL | Author's full name |
| `price` | INTEGER | NOT NULL | Price of the book (in INR / currency units) |
| `pages` | INTEGER | DEFAULT 0 | Page count (inherited from Lab 2) |

---

## 5. Installation & Setup Instructions

### Prerequisites
- **Node.js** installed (v18.x or v20.x recommended):
  ```bash
  node -v
  ```
- **npm** (bundled with Node.js):
  ```bash
  npm -v
  ```

### Step 1: Install Dependencies
Open your terminal in the project root directory and run:
```bash
npm install
```

### Step 2: Environment Configuration
Copy the example `.env.example` file to create your `.env` file:
```bash
cp .env.example .env
```
*(On Windows Command Prompt: `copy .env.example .env`)*

Contents of `.env`:
```env
PORT=3000
```

### Step 3: Start the Application

- **Production Mode:**
  ```bash
  npm start
  # or: node index.js
  ```

- **Development Mode (Auto-restart on save):**
  ```bash
  npm run dev
  ```

Once started, the console will confirm:
```
⏳ Initializing SQLite database...
✅ Database initialized successfully.

🚀 Server is running at http://localhost:3000
📚 Books API endpoint: http://localhost:3000/books
```

### Step 4: Run the Automated Test Suite (Optional)
Run all 18 test cases in a single command:
```bash
node test_suite.js
```

---

## 6. RESTful API Endpoint Documentation

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/` | API Health & documentation overview | `200` |
| `GET` | `/books` | Retrieve books with optional filters, sorting, and pagination | `200`, `400`, `500` |
| `GET` | `/books/:id` | Retrieve a specific book by its primary ID | `200`, `400`, `404`, `500` |
| `POST` | `/books` | Create a new book record | `201`, `400`, `500` |
| `PUT` | `/books/:id` | Update an existing book's details | `200`, `400`, `404`, `500` |
| `DELETE` | `/books/:id` | Delete a book record by ID | `200`, `400`, `404`, `500` |

---

## 7. Query Parameter Documentation (`GET /books`)

All query parameters are optional and can be freely combined:

| Parameter | Type | Default | Description & Validation | Example |
|---|---|---|---|---|
| `search_q` | string | `""` | Partial title search using `LIKE %search_q%` | `?search_q=code` |
| `min_price` | number | — | Lower price bound (`price >= ?`). Must be non-negative. | `?min_price=200` |
| `max_price` | number | — | Upper price bound (`price <= ?`). Must be non-negative & `>= min_price`. | `?max_price=700` |
| `order_by` | string | `"id"` | Column to sort by. Whitelist: `id`, `title`, `author`, `price`. | `?order_by=price` |
| `order` | string | `"ASC"` | Sort direction. Whitelist: `ASC`, `DESC` (case-insensitive). | `?order=DESC` |
| `limit` | integer | `10` | Maximum records returned. Must be integer `> 0`. | `?limit=5` |
| `offset` | integer | `0` | Number of records to skip. Must be integer `>= 0`. | `?offset=10` |

### Multi-Filter Example:
```http
GET /books?search_q=the&min_price=200&max_price=800&order_by=price&order=ASC&limit=5&offset=0
```

---

## 8. Request & Response Examples

### 1. Get All Books (Paginated List)
- **Request:** `GET http://localhost:3000/books?limit=2&offset=0`
- **Response (`200 OK`):**
  ```json
  {
    "message": "Books fetched successfully",
    "data": [
      {
        "id": 1,
        "title": "Atomic Habits",
        "author": "James Clear",
        "price": 450,
        "pages": 320
      },
      {
        "id": 2,
        "title": "The Pragmatic Programmer",
        "author": "Andrew Hunt",
        "price": 799,
        "pages": 352
      }
    ],
    "pagination": {
      "limit": 2,
      "offset": 0
    }
  }
  ```

### 2. Get Single Book by ID
- **Request:** `GET http://localhost:3000/books/1`
- **Response (`200 OK`):**
  ```json
  {
    "message": "Book fetched successfully",
    "data": {
      "id": 1,
      "title": "Atomic Habits",
      "author": "James Clear",
      "price": 450,
      "pages": 320
    }
  }
  ```

### 3. Create a Book (Success)
- **Request:** `POST http://localhost:3000/books`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Refactoring: Improving the Design of Existing Code",
    "author": "Martin Fowler",
    "price": 850
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "message": "Book created successfully",
    "data": {
      "id": 11,
      "title": "Refactoring: Improving the Design of Existing Code",
      "author": "Martin Fowler",
      "price": 850,
      "pages": 0
    }
  }
  ```

### 4. Create a Book (Validation Failure)
- **Request:** `POST http://localhost:3000/books`
- **Body:**
  ```json
  {
    "author": "Martin Fowler",
    "price": -100
  }
  ```
- **Response (`400 Bad Request`):**
  ```json
  {
    "message": "Validation failed",
    "errors": [
      "Title is required",
      "Price cannot be negative"
    ]
  }
  ```

### 5. Update an Existing Book
- **Request:** `PUT http://localhost:3000/books/1`
- **Body:**
  ```json
  {
    "title": "Atomic Habits (Updated Edition)",
    "author": "James Clear",
    "price": 500
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "message": "Book updated successfully",
    "data": {
      "id": 1,
      "title": "Atomic Habits (Updated Edition)",
      "author": "James Clear",
      "price": 500,
      "pages": 320
    }
  }
  ```

### 6. Book Not Found (GET / PUT / DELETE)
- **Request:** `GET http://localhost:3000/books/9999`
- **Response (`404 Not Found`):**
  ```json
  {
    "message": "Book not found"
  }
  ```

---

## 9. Common Debugging Scenarios & Viva Solutions

This section explains the four essential debugging exercises required for Lab 3:

### 1. `EADDRINUSE` (Port Already in Use)
- **Problem:** Starting the server fails with `Error: listen EADDRINUSE: address already in use :::3000`.
- **Root Cause:** A previous Node.js process is still running in the background and occupying port 3000.
- **Diagnostic & Resolution:**
  - **Identify in Windows PowerShell:**
    ```powershell
    Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
    ```
  - **Kill the Conflicting Process:**
    ```powershell
    Stop-Process -Id <PID> -Force
    ```
  - **Alternative:** Change the `PORT` in your `.env` file (e.g. `PORT=3001`).

### 2. Wrong Import Path
- **Problem:** `Error: Cannot find module '../db'` or `MODULE_NOT_FOUND`.
- **Root Cause:** Node.js module resolution requires accurate relative paths starting with `./` or `../`. Missing the prefix causes Node to check `node_modules` instead.
- **Resolution:**
  - Inside `routes/books.js`, the database module at root is reached via `require("../db")`.
  - Inside `index.js`, files in the same directory are reached via `require("./db")` and `require("./app")`.

### 3. `no such table: book`
- **Problem:** SQLite queries crash with `SQLITE_ERROR: no such table: book`.
- **Root Cause:**
  1. The SQL query uses a mismatched table name (e.g., `SELECT * FROM books` plural instead of `book` singular).
  2. The application attempted to query the database before `CREATE TABLE IF NOT EXISTS book ...` completed execution.
- **Resolution:**
  - Standardize on `book` across all SQL statements.
  - Await the `initDB()` promise before starting `app.listen()` so the table is guaranteed to exist before any incoming request arrives.

### 4. Missing `await` on Asynchronous Database Calls
- **Problem:** Route handlers return an empty object `{}` or finish before queries complete; or `TypeError: Cannot read properties of undefined`.
- **Root Cause:** SQLite methods `db.get()`, `db.all()`, and `db.run()` return Promises. If `await` is omitted, the variable holds a pending `Promise { <pending> }` object rather than the actual query result. Express serializes the pending Promise to `{}` immediately.
- **Resolution:**
  - Always mark the route handler as `async (req, res, next) => { ... }`.
  - Always prepend `await` before any database call:
    ```javascript
    const book = await db.get("SELECT * FROM book WHERE id = ?", [id]);
    ```

---

## 10. Postman Testing Guide

An importable Postman collection file is included: `lab03-postman-collection.json`.

### How to Import into Postman:
1. Open **Postman**.
2. Click the **Import** button in the top-left corner.
3. Select or drag-and-drop `lab03-postman-collection.json` from the project directory.
4. You will see a collection named **Lab 3 - RESTful Book Management API** with all 18 test cases organized in order.

### All 18 Test Cases Summary:

| # | Test Scenario | Method | URL / Query / Body | Expected Status |
|---|---|---|---|---|
| **01** | GET all books | `GET` | `/books` | `200 OK` |
| **02** | GET book by ID | `GET` | `/books/1` | `200 OK` |
| **03** | POST valid book | `POST` | `/books` + Body: `{ "title": "Refactoring", "author": "Martin Fowler", "price": 850 }` | `201 Created` |
| **04** | POST without title | `POST` | `/books` + Body: `{ "author": "Martin Fowler", "price": 850 }` | `400 Bad Request` |
| **05** | POST without author | `POST` | `/books` + Body: `{ "title": "Clean Architecture", "price": 600 }` | `400 Bad Request` |
| **06** | POST with invalid price | `POST` | `/books` + Body: `{ "title": "Clean Code", "author": "Uncle Bob", "price": "expensive" }` | `400 Bad Request` |
| **07** | POST with negative price | `POST` | `/books` + Body: `{ "title": "Clean Code", "author": "Uncle Bob", "price": -50 }` | `400 Bad Request` |
| **08** | PUT existing book | `PUT` | `/books/1` + Body: `{ "title": "Atomic Habits (Updated)", "author": "James Clear", "price": 520 }` | `200 OK` |
| **09** | PUT nonexistent book | `PUT` | `/books/99999` + Body: `{ "title": "Ghost", "author": "Ghost", "price": 100 }` | `404 Not Found` |
| **10** | DELETE existing book | `DELETE`| `/books/11` | `200 OK` |
| **11** | DELETE nonexistent book | `DELETE`| `/books/99999` | `404 Not Found` |
| **12** | Search using `search_q` | `GET` | `/books?search_q=clean` | `200 OK` |
| **13** | Sort by price ASC | `GET` | `/books?order_by=price&order=ASC` | `200 OK` |
| **14** | Sort by price DESC | `GET` | `/books?order_by=price&order=DESC` | `200 OK` |
| **15** | Pagination using limit & offset | `GET` | `/books?limit=3&offset=2` | `200 OK` |
| **16** | Filter using min_price & max_price | `GET` | `/books?min_price=300&max_price=500` | `200 OK` |
| **17** | Combined search, sort, paginate, filter | `GET` | `/books?search_q=the&min_price=200&max_price=800&order_by=price&order=ASC&limit=5&offset=0` | `200 OK` |
| **18** | Test invalid sorting parameters | `GET` | `/books?order_by=invalid_col` | `400 Bad Request` |

---

## 11. Security & Best Practices Implemented

- **SQL Injection Prevention:** Every user-supplied value in WHERE, LIMIT, and OFFSET clauses utilizes parameterized placeholders (`?`). Dynamic sorting strings (`order_by`, `order`) are strictly checked against compile-time arrays of allowed column names.
- **Input Sanitization:** Strings are `.trim()`med before SQL execution to avoid blank padding.
- **Separation of Concerns:**
  - `db.js`: Database configuration and query utilities.
  - `routes/books.js`: Business logic, validation, and route definitions.
  - `app.js`: Express middleware and routing registration.
  - `index.js`: Environment loading and HTTP server lifecycle.
