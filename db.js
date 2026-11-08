// db.js
// SQLite database connection, table initialization, and seeding helper
// Subject: Backend Development Fundamentals | NIAT Aurora | Faculty: Joel Prashanth D

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const fs = require("fs");

// Ensure the booksData directory exists
const booksDataDir = path.join(__dirname, "booksData");
if (!fs.existsSync(booksDataDir)) {
  fs.mkdirSync(booksDataDir, { recursive: true });
}

// Database file path
const DB_PATH = path.join(booksDataDir, "library.db");

let dbInstance = null;

/**
 * Initializes and returns the SQLite database connection.
 * Creates the 'book' table and seeds initial sample records if empty.
 */
async function initDB() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  // Create table if it doesn't already exist
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS book (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      title  TEXT    NOT NULL,
      author TEXT    NOT NULL,
      price  INTEGER NOT NULL,
      pages  INTEGER DEFAULT 0
    )
  `);

  // Seed sample data if table has 0 records
  const countRow = await dbInstance.get("SELECT COUNT(*) AS count FROM book");
  if (countRow.count === 0) {
    const sampleBooks = [
      { title: "Atomic Habits", author: "James Clear", price: 450, pages: 320 },
      { title: "The Pragmatic Programmer", author: "Andrew Hunt", price: 799, pages: 352 },
      { title: "Clean Code", author: "Robert C. Martin", price: 650, pages: 431 },
      { title: "Deep Work", author: "Cal Newport", price: 399, pages: 304 },
      { title: "You Don't Know JS", author: "Kyle Simpson", price: 350, pages: 278 },
      { title: "The Alchemist", author: "Paulo Coelho", price: 250, pages: 197 },
      { title: "Introduction to Algorithms", author: "Thomas H. Cormen", price: 1200, pages: 1292 },
      { title: "Design Patterns", author: "Gang of Four", price: 950, pages: 395 },
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", price: 499, pages: 499 },
      { title: "The Psychology of Money", author: "Morgan Housel", price: 350, pages: 256 },
    ];

    const insertSQL = `INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)`;
    for (const b of sampleBooks) {
      await dbInstance.run(insertSQL, [b.title, b.author, b.price, b.pages]);
    }
    console.log("✅ Seeded initial sample books into SQLite database.");
  }

  return dbInstance;
}

/**
 * Returns the active database instance.
 * Throws an informative error if initDB() has not been called yet.
 */
function getDB() {
  if (!dbInstance) {
    throw new Error("Database has not been initialized. Call initDB() before accessing the database.");
  }
  return dbInstance;
}

/**
 * Closes the active database connection (useful during testing or shutdown).
 */
async function closeDB() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  initDB,
  getDB,
  closeDB,
  DB_PATH,
};

