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

// Debug endpoint - check tables exist and show raw data
router.get("/debug", async (req, res) => {
    try {
        console.log("🔍 DEBUG: Checking database...");
        
        // Check if table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'upcoming_ipos'
            )
        `);
        
        console.log("✅ upcoming_ipos table exists:", tableCheck.rows[0].exists);
        
        // Get table info
        const tableInfo = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'upcoming_ipos'
            ORDER BY ordinal_position
        `);
        
        console.log("📊 Table columns:", tableInfo.rows);
        
        // Get row count
        const countResult = await db.query("SELECT COUNT(*) as count FROM upcoming_ipos");
        const rowCount = parseInt(countResult.rows[0].count);
        
        console.log("📈 Row count:", rowCount);
        
        res.json({
            success: true,
            debug: {
                table_exists: tableCheck.rows[0].exists,
                columns: tableInfo.rows,
                row_count: rowCount,
                message: "Database structure is OK"
            }
        });
    } catch (err) {
        console.error("❌ DEBUG Error:", err.message);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// Sync endpoint - accepts both GET and POST
router.get("/sync", syncHandler);
router.post("/sync", syncHandler);

async function syncHandler(req, res) {
    try {
        console.log("🔄 Starting sync...");
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
}

module.exports = router;
