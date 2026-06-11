const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

const jar = new CookieJar();
const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    timeout: 15000
  })
);

// -------------------------
// FORMAT DATE (SAFE)
// -------------------------
function formatDate(d) {
  const date = new Date(d);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date passed to formatDate()");
  }

  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${m}/${day}/${year}`;
}

// -------------------------
// MAIN SCRAPER
// -------------------------
async function scrapeStockEvents(fromDate, toDate) {
  try {
    // -------------------------
    // DEFAULT DATE RANGE
    // -------------------------
    if (!fromDate || !toDate) {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);

      fromDate = from;
      toDate = to;
    }

    const url =
      "https://www.merolagani.com/handlers/webrequesthandler.ashx";

    const params = {
      type: "stock_event",
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate)
    };

    // -------------------------
    // FIRST REQUEST (cookie warm-up)
    // -------------------------
    await client.get("https://merolagani.com/");

    // -------------------------
    // API REQUEST
    // -------------------------
    const { data } = await client.get(url, {
      params,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "*/*",
        Referer: "https://merolagani.com/",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    console.log("📦 RAW RESPONSE TYPE:", typeof data);

    // -------------------------
    // NORMALIZE RESPONSE
    // -------------------------
    let list = [];

    if (Array.isArray(data)) list = data;
    else if (Array.isArray(data?.data)) list = data.data;
    else if (Array.isArray(data?.d)) list = data.d;
    else if (Array.isArray(data?.result)) list = data.result;
    else if (Array.isArray(data?.Data)) list = data.Data;
    else if (Array.isArray(data?.detail)) list = data.detail; // 🔥 IMPORTANT FIX
    else list = [];

    console.log("📊 Parsed Events Count:", list.length);

    return list;
  } catch (err) {
    console.error("❌ SCRAPER ERROR:", err.message);
    return [];
  }
}

module.exports = { scrapeStockEvents };