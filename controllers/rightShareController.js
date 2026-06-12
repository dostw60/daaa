const pool = require("../db/pool");

async function getRightShares(req, res) {
  try {
    let result = await pool.query(
      `
      SELECT *
      FROM stock_events
      WHERE UPPER(type) = 'RIGHT_SHARE'
      ORDER BY date DESC NULLS LAST, updated_at DESC
      `
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        `
        SELECT *
        FROM upcoming_ipos
        WHERE UPPER(issue_type) = 'RIGHT_SHARE'
        ORDER BY updated_at DESC NULLS LAST, id DESC
        `
      );
    }

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
  getRightShares,
};
