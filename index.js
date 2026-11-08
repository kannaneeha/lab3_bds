// index.js
// Main Server Entry Point
// Course: Backend Development Fundamentals | NIAT Aurora | Faculty: Joel Prashanth D

const dotenv = require("dotenv");
const app = require("./app");
const { initDB } = require("./db");

// Load environment variables from .env
dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Step 1: Connect to SQLite, initialize table and seed data if needed
    console.log("⏳ Initializing SQLite database...");
    await initDB();
    console.log("✅ Database initialized successfully.");

    // Step 2: Start Express server
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Server is running at http://localhost:${PORT}`);
      console.log(`📚 Books API endpoint: http://localhost:${PORT}/books`);
      console.log(`💡 Press Ctrl + C to stop the server\n`);
    });

    // Handle common server startup errors like EADDRINUSE
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`\n❌ Error: Port ${PORT} is already in use (EADDRINUSE).`);
        console.error(`👉 Solutions:`);
        console.error(`   1. Stop the existing process running on port ${PORT}.`);
        console.error(`   2. In PowerShell, find the PID: Get-NetTCPConnection -LocalPort ${PORT}`);
        console.error(`   3. Stop it: Stop-Process -Id <PID> -Force`);
        console.error(`   4. Or change PORT in .env (e.g. PORT=3001).\n`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Failed to initialize database:", error.message);
    process.exit(1);
  }
}

startServer();

