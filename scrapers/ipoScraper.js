const axios = require("axios");
const cheerio = require("cheerio");

let client = axios.create({
  timeout: 15000
});

try {
  const { wrapper } = require("axios-cookiejar-support");
  const { CookieJar } = require("tough-cookie");

  const jar = new CookieJar();

  client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      timeout: 15000
    })
  );
} catch (err) {
  console.warn("axios-cookiejar-support not available, using plain axios.");
}

/**
 * IMPORTANT: MeroLagani expects M/D/YYYY (NO zero padding)
 */
function formatDate(d) {
  const date = new Date(d);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date passed to formatDate()");
  }

  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

/**
 * Keep raw object intact (CRITICAL FIX)
 */
function normalizeEventItem(item) {
  if (typeof item === "string") {
    return {
      raw_text: item,
      announcementDetail: item,
      announcement: item,
      source: "merolagani",
      source_url: "https://merolagani.com"
    };
  }

  const text =
    item?.announcementDetail ||
    item?.announcement ||
    item?.detail ||
    item?.title ||
    item?.text ||
    item?.message ||
    item?.event ||
    item?.description ||
    item?.raw_text ||
    item?.rawText ||
    item?.company_name ||
    "";

  return {
    ...item, // 🔥 IMPORTANT: preserve ALL original fields

    announcementDetail: item?.announcementDetail || text,
    announcement: item?.announcement || text,
    raw_text: item?.raw_text || item?.rawText || text,

    source: item?.source || "merolagani",
    source_url: item?.source_url || item?.sourceUrl || "https://merolagani.com"
  };
}

/**
 * Robust JSON + HTML parser
 */
function parseMaybeJson(data) {
  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    for (const key of ["data", "d", "result", "Data", "detail"]) {
      if (Array.isArray(data[key])) return data[key];
    }
  }

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return [];

    try {
      return parseMaybeJson(JSON.parse(trimmed));
    } catch (err) {
      if (trimmed.includes("<")) {
        const $ = cheerio.load(trimmed);

        const rows = [];

        $("tr, li, .announcement, .news, .event, .card").each((_, el) => {
          const text = $(el).text().replace(/\s+/g, " ").trim();
          if (text.length > 10) {
            rows.push({ raw_text: text });
          }
        });

        if (rows.length) return rows;

        const bodyText = $("body").text().replace(/\s+/g, " ").trim();
        if (bodyText.length > 10) return [{ raw_text: bodyText }];
      }

      const match = trimmed.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (!match) return [];

      try {
        return parseMaybeJson(JSON.parse(match[0]));
      } catch {
        return [];
      }
    }
  }

  return [];
}

/**
 * Main scraper
 */
async function scrapeStockEvents(fromDate, toDate) {
  try {
    if (!fromDate || !toDate) {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);

      fromDate = from;
      toDate = to;
    }

    const url = "https://www.merolagani.com/handlers/webrequesthandler.ashx";

    const params = {
      type: "stock_event",
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate)
    };

    console.log("🔍 Fetching:", params);

    // Session init
    await client.get("https://merolagani.com/");

    const { data } = await client.get(url, {
      params,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
        Accept: "application/json, text/plain, */*",
        Referer: "https://merolagani.com/",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const list = parseMaybeJson(data).map(normalizeEventItem);

    console.log("✅ Parsed events:", list.length);

    if (list.length > 0) {
      console.log("📝 Sample:", list[0]);
    }

    return list;
  } catch (err) {
    console.error("❌ SCRAPER ERROR:", err.message);
    return [];
  }
}

module.exports = {
  scrapeStockEvents,
  scrapeIPOs: scrapeStockEvents
};