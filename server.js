require("dotenv").config(); // IMPORTANT (local dev support)

const app = require("./app");
const { startCron } = require("./jobs/cronJob");
const { ensureSchema } = require("./db/ensureSchema");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 🔥 Debug: check if Render is passing DB URL
    console.log(
      "DATABASE_URL:",
      process.env.DATABASE_URL ? "Loaded ✅" : "Missing ❌"
    );

    // If DB is missing, stop early (prevents silent failures)
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }

    await ensureSchema();
    console.log("Schema check complete");
  } catch (err) {
    console.warn("Schema check skipped:", err.message);
  }

  app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
    startCron();
  });
}

startServer();
