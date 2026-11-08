// config/database.js
// Database configuration and initialization (Lab 2 compatibility module)

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "booksData", "library.db");

async function connectDatabase() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
  return db;
}

async function createTable(db) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS book (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      title  TEXT    NOT NULL,
      author TEXT    NOT NULL,
      price  INTEGER NOT NULL,
      pages  INTEGER DEFAULT 0
    )
  `);
}

async function seedData(db) {
  const { count } = await db.get("SELECT COUNT(*) AS count FROM book");

  if (count === 0) {
    const books = [
      { title: "Atomic Habits",                 author: "James Clear",            price: 450,  pages: 320 },
      { title: "The Pragmatic Programmer",       author: "Andrew Hunt",            price: 799,  pages: 352 },
      { title: "Clean Code",                    author: "Robert C. Martin",       price: 650,  pages: 431 },
      { title: "Deep Work",                     author: "Cal Newport",            price: 399,  pages: 304 },
      { title: "You Don't Know JS",             author: "Kyle Simpson",           price: 350,  pages: 278 },
      { title: "The Alchemist",                 author: "Paulo Coelho",           price: 250,  pages: 197 },
      { title: "Introduction to Algorithms",   author: "Thomas H. Cormen",       price: 1200, pages: 1292 },
      { title: "Design Patterns",              author: "Gang of Four",           price: 950,  pages: 395 },
      { title: "Thinking, Fast and Slow",       author: "Daniel Kahneman",        price: 499,  pages: 499 },
      { title: "The Psychology of Money",       author: "Morgan Housel",          price: 350,  pages: 256 },
    ];

    const insertSQL = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?)
    `;

    for (const book of books) {
      await db.run(insertSQL, [book.title, book.author, book.price, book.pages]);
    }

    console.log("✅ 10 sample books seeded into the database.");
  } else {
    console.log(`ℹ️  Database already has ${count} book(s). Skipping seed.`);
  }
}

module.exports = { connectDatabase, createTable, seedData, DB_PATH };
