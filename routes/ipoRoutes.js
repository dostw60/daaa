const router = require("express").Router();
const db = require("../db/pool");
const { syncAllEvents } = require("../services/syncService");

function serializeIPO(row) {
    return {
        ...row,
        shares: Number(row.shares || 0),
        issue_size: Number(row.issue_size || 0)
    };
}

async function getUpcomingIPOs(req, res) {
    try {
        // Query only upcoming_ipos table (stock_events fallback removed)
        const upcomingResult = await db.query(
            "SELECT * FROM upcoming_ipos ORDER BY open_date ASC"
        );

        res.json({
            success: true,
            count: upcomingResult.rows.length,
            data: upcomingResult.rows.map(serializeIPO)
        });

    } catch (err) {
        console.error("❌ Error in getUpcomingIPOs:", err.message);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

router.get("/", getUpcomingIPOs);

router.get("/upcoming", async (req, res) => {
    return getUpcomingIPOs(req, res);
});

router.post("/sync", async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        const result = await syncAllEvents(fromDate, toDate);

        res.json(result);
    } catch (err) {
        console.error("❌ Error in sync:", err.message);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
