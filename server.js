require("dotenv").config();
const app = require("./app");
const { startCron } = require("./jobs/cronJob");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);

  startCron();
});