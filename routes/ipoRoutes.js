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
        const upcomingResult = await db.query(
            "SELECT * FROM upcoming_ipos ORDER BY open_date ASC"
        );

        if (upcomingResult.rows.length > 0) {
            return res.json({
                success: true,
                count: upcomingResult.rows.length,
                data: upcomingResult.rows.map(serializeIPO)
            });
        }

        const stockEventResult = await db.query(
            `
            SELECT *
            FROM stock_events
            WHERE type = 'IPO'
            ORDER BY date DESC
            `
        );

        res.json({
            success: true,
            count: stockEventResult.rows.length,
            data: stockEventResult.rows.map((row) => ({
                company_name: row.company_name || "",
                symbol: row.symbol || "UNKNOWN",
                shares: Number(row.shares || 0),
                issue_size: Number(row.issue_size || 0),
                issue_type: row.type || "IPO",
                status: row.status || "Upcoming",
                source: row.source || "merolagani",
                source_url: row.source_url || "https://merolagani.com",
                confidence: Number(row.confidence || 0),
                event_value: row.event_value || null,
                open_date: row.date || null,
                announcement: row.announcement || ""
            }))
        });

    } catch (err) {
        console.error(err);

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
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
