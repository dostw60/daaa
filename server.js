require("dotenv").config();
const app = require("./app");
const { startCron } = require("./jobs/cronJob");
const { ensureSchema } = require("./db/ensureSchema");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await ensureSchema();
    console.log("Schema check complete");
  } catch (err) {
    console.warn("Schema check skipped:", err.message);
  }

  app.listen(PORT, () => {
    console.log("Server running on port", PORT);
    startCron();
  });
}

startServer();
