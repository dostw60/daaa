const express = require("express");

const ipoRoutes = require("./routes/ipoRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const corporateActionRoutes = require("./routes/corporateActionRoutes");

const app = express();

app.use(express.json());

app.use("/api/ipo", ipoRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/corporate-actions", corporateActionRoutes);

module.exports = app;
