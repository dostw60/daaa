const express = require("express");

const ipoRoutes = require("./routes/ipoRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const corporateActionRoutes = require("./routes/corporateActionRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NEPSE API is running",
  });
});

app.get("/health", (req, res) => {
  res.json({ success: true });
});

app.use("/api/ipo", ipoRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/corporate-actions", corporateActionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
    availableRoutes: ["/", "/health", "/api/ipo", "/api/calendar", "/api/corporate-actions"],
  });
});

module.exports = app;
