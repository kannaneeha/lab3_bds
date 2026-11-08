# Lab 3 Viva Preparation Guide

> **Course:** Backend Development Fundamentals  
> **Topic:** REST API, Query Parameters, Validation & Debugging  
> **Campus:** NIAT Aurora  
> **Faculty:** Joel Prashanth D  
> **Student:** Amrruth Bhushan  

---

## 🎯 Official Lab Sheet Viva Questions

### 1. Query parameter vs path parameter?
**Answer:**
- **Path Parameter (Route Parameter, `req.params`):**
  - Used to identify a **specific, unique resource**.
  - Part of the URL path itself (e.g., `GET /books/5` targets the unique book with Primary Key ID `5`).
  - Required for locating that individual resource.
- **Query Parameter (`req.query`):**
  - Used to **filter, sort, search, or paginate** a collection without altering the endpoint identity.
  - Appended after a `?` as key-value pairs (e.g., `GET /books?search_q=code&order_by=price&order=ASC`).
  - Optional; the endpoint still functions with default values if omitted.

---

### 2. What does stateless mean in REST APIs?
**Answer:**
- **Statelessness** means that **each HTTP request from a client must contain all the information needed by the server to understand and process the request**.
- The server does **not store any client session state** between requests in server memory.
- **Why it matters:**
  1. **Scalability:** Any server instance in a cluster can handle any incoming request because it doesn't depend on past session data stored locally.
  2. **Reliability:** If a server crashes and restarts, clients don't lose active session state.
  3. **Simplicity:** Server logic is decoupled from client state tracking.

---

### 3. Which status code for bad input vs a missing record?
**Answer:**
- **Bad Input (Client Validation Failure):** `400 Bad Request`
  - Used when the request body or query parameter is invalid, malformed, or fails validation (e.g., missing title/author, negative price, invalid `order_by` column).
  - Example response:
    ```json
    {
      "message": "Validation failed",
      "errors": ["Title is required", "Price cannot be negative"]
    }
    ```
- **Missing Record (Resource Does Not Exist):** `404 Not Found`
  - Used when the client requests, updates, or deletes an ID that does not exist in the database (e.g., `GET /books/99999`).
  - Example response:
    ```json
    {
      "message": "Book not found"
    }
    ```

---

## 🛠️ Debugging Exercise Viva Questions (The 4 Common Errors)

### 4. What causes `EADDRINUSE` and how do you resolve it?
**Answer:**
- **Cause:** Express is attempting to listen on a port (e.g., 3000) that is already held open by another active process (often an earlier Node instance that wasn't cleanly terminated).
- **Resolution:**
  1. In PowerShell, find the PID occupying the port:
     ```powershell
     Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
     ```
  2. Kill the process:
     ```powershell
     Stop-Process -Id <PID> -Force
     ```
  3. Or change the port in `.env` (e.g., `PORT=3001`).

---

### 5. What causes a wrong import path (e.g., `MODULE_NOT_FOUND`)?
**Answer:**
- **Cause:** Node.js distinguishes relative paths from npm package imports. If you write `require("db")` instead of `require("./db")`, Node looks inside `node_modules/` instead of your project directory.
- **Resolution:**
  - Same folder: use `./` (e.g., `require("./db")` inside `index.js`).
  - Parent folder: use `../` (e.g., `require("../db")` inside `routes/books.js`).

---

### 6. What causes `SQLITE_ERROR: no such table: book` and how do you fix it?
**Answer:**
- **Cause:**
  1. Typo in table name (e.g., query uses plural `books` while table was created as singular `book`).
  2. Race condition: querying the database before `CREATE TABLE IF NOT EXISTS book` has completed.
- **Resolution:**
  - Standardize on `book` across all SQL queries.
  - Await `initDB()` before starting the HTTP listener `app.listen()` so the table is guaranteed to exist before requests arrive.

---

### 7. What happens if you forget the `await` keyword before a database query?
**Answer:**
- SQLite methods (`db.all()`, `db.get()`, `db.run()`) return **Promises**.
- Without `await`, your variable holds an unresolved `Promise { <pending> }` instead of the data rows.
- Express immediately serializes that pending Promise into an empty JSON object `{}` and returns it to the client before the database query finishes.
- **Fix:** Mark the route handler as `async` and prepend `await` before every `db.*` call:
  ```javascript
  const book = await db.get("SELECT * FROM book WHERE id = ?", [id]);
  ```

---

## 🔒 Advanced Concepts & SQL Security

### 8. Why can't we use `?` placeholders for `ORDER BY`? How did you secure it?
**Answer:**
- SQL parameter placeholders (`?`) can only replace **literals / data values** (numbers, strings). They cannot substitute SQL identifiers such as column names or keywords (`ASC`/`DESC`).
- If you use `ORDER BY ?`, SQLite treats the string as a literal constant, which does not sort the table.
- **Solution:** We use **Whitelisting**:
  ```javascript
  const allowedOrderBy = ["id", "title", "author", "price"];
  if (!allowedOrderBy.includes(safeOrderBy)) {
    return res.status(400).json({ message: "Invalid order_by parameter" });
  }
  ```
  Any value not in the whitelist is rejected immediately, making SQL injection impossible.

---

### 9. How does partial title search work in SQLite?
**Answer:**
- We use the SQL `LIKE` operator with `%` wildcards:
  ```sql
  SELECT * FROM book WHERE title LIKE ?
  ```
- We bind `'%clean%'` to `?`. The `%` matches zero or more characters before and after the term.
- In SQLite, `LIKE` is case-insensitive for ASCII characters, so `"clean"`, `"Clean"`, and `"CLEAN"` all match.

---

### 10. How does pagination work using `LIMIT` and `OFFSET`?
**Answer:**
- **`LIMIT`:** Maximum number of records to return on the current page (e.g., `LIMIT 10`).
- **`OFFSET`:** Number of records to skip from the beginning (e.g., `OFFSET 20` skips the first 20 records to show page 3).
- **Formula:**
  $$\text{OFFSET} = (\text{Page Number} - 1) \times \text{Page Size}$$
