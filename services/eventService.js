const pool = require("../db/pool");
const { scrapeStockEvents } = require("../scrapers/ipoScraper");

async function upsertEvents(fromDate, toDate) {
  const events = await scrapeStockEvents(fromDate, toDate);

  for (const e of events) {
    await pool.query(
      `
      INSERT INTO stock_events 
      (date, day, company_name, announcement, type, source)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (company_name, date, type)
      DO NOTHING
      `,
      [
        e.date,
        e.day,
        extractCompany(e.announcement),
        e.announcement,
        e.type,
        e.source,
      ]
    );
  }

  return events.length;
}

function extractCompany(text = "") {
  return text.split(" Limited")[0] + " Limited";
}

module.exports = { upsertEvents };