const router = require("express").Router();
const db = require("../config/db");
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
        const result = await db.query(
            "SELECT * FROM upcoming_ipos ORDER BY open_date ASC"
        );

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows.map(serializeIPO)
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
        const result = await syncAllEvents();

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
