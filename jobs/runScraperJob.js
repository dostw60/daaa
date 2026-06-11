const { scrapeIPOs } = require("../scrapers/ipoScraper");
const { upsertIPO } = require("../services/ipoService");
const { validateIPO } = require("../utils/validator");

async function runScraperJob() {
  try {
    const ipos = await scrapeIPOs();

    for (const ipo of ipos) {
      if (validateIPO(ipo)) {
        await upsertIPO(ipo);
      }
    }

    console.log("IPO Scraper Job Completed");
  } catch (err) {
    console.error("Scraper Job Failed:", err);
  }
}

module.exports = runScraperJob;