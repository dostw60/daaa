const pool = require("../db/pool");

async function getIPOs(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM stock_events
      WHERE type='IPO'
      ORDER BY date
      `
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  getIPOs,
};// API controller here
