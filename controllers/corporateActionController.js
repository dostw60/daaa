const pool = require("../db/pool");

const CORPORATE_ACTION_TYPES = ["BONUS", "DIVIDEND", "RIGHT_SHARE"];

async function getCorporateActions(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM stock_events
      WHERE type = ANY($1::text[])
      ORDER BY date DESC
      `,
      [CORPORATE_ACTION_TYPES]
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
  getCorporateActions,
};
