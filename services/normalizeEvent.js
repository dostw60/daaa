const { classifyEvent } = require("./eventClassifier");

const SYMBOL_BY_COMPANY = {
  "appolo hydropower limited": "APHL",
  "bhujung hydropower limited": "BJHL",
  "ridge line energy limited": "RLEL",
  "snow rivers limited": "SNOW",
  "sopan pharmaceuticals limited": "SOPL",
  "suryakunda hydro electric limited": "SKHEL"
};

const INVALID_SYMBOLS = new Set([
  "AGM",
  "FPO",
  "IPO",
  "LOCALS",
  "PUBLIC",
  "QII",
  "SGM",
  "SHARE",
  "SHARES"
]);

/**
 * MAIN NORMALIZER
 */
function normalizeEvent(raw = {}) {
  const rawText = getRawText(raw);
  if (!rawText || rawText.length < 10) return null;

  const { type, confidence } = classifyEvent(rawText);
  const issueType = normalizeIssueType(type);

  if (!issueType || confidence < 0.3) return null;

  const companyName = extractCompanyName(rawText);
  if (!companyName) return null;

  const shares = extractShares(rawText);
  const symbol = extractSymbol(rawText, companyName);
  const status = determineStatus(rawText);

  const percentage = extractPercentage(rawText);
  const ratio = extractRatio(rawText);

  const manualReviewReasons = getManualReviewReasons({
    companyName,
    symbol,
    shares,
    rawText,
    type: issueType
  });

  return {
    company_name: companyName,
    symbol,
    shares,
    issue_type: issueType,

    issue_size:
      shares ||
      (issueType === "DIVIDEND" || issueType === "BONUS" ? percentage : 0),

    status,

    // ✅ FIXED DATE
    date: extractEventDate(raw),

    announcement: rawText,

    event_value: {
      units: shares || null,
      percentage,
      ratio,
      manual_review: manualReviewReasons.length > 0,
      manual_review_reasons: manualReviewReasons
    },

    source: raw.source || "merolagani",
    source_url: raw.source_url || raw.sourceUrl || "https://merolagani.com",

    confidence: calculateConfidence({
      baseConfidence: confidence,
      companyName,
      symbol,
      shares,
      manualReviewReasons
    })
  };
}

/**
 * ISSUE TYPE
 */
function normalizeIssueType(type = "") {
  const t = String(type).toUpperCase();

  if (t === "IPO") return "IPO";
  if (t === "BONUS") return "BONUS";
  if (t === "DIVIDEND") return "DIVIDEND";
  if (t === "RIGHT_SHARE") return "RIGHT_SHARE";
  if (t === "AGM") return "AGM";

  return null;
}

/**
 * 🔥 FIXED DATE HANDLER (MAIN FIX)
 */
function extractEventDate(raw = {}) {
  const candidate =
    raw.actionDate ||
    raw.date ||
    raw.announcementDate ||
    raw.open_date ||
    raw.openDate;

  if (!candidate) return null;

  const normalized = String(candidate).replace(/-/g, "/");
  const parts = normalized.split("/");

  if (parts.length !== 3) return null;

  const [year, month, day] = parts.map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toISOString().slice(0, 10);
}

/**
 * RAW TEXT
 */
function getRawText(raw) {
  return String(
    raw.announcementDetail ||
    raw.announcement ||
    raw.raw_text ||
    raw.rawText ||
    raw.company_name ||
    ""
  )
    .replace(/\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * COMPANY NAME
 */
function extractCompanyName(text = "") {
  const cleaned = text
    .replace(/^Listing of\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const afterDash = cleaned.match(/\s-\s(.+?)(?:\s+\([A-Z]{2,10}\))?$/);
  if (afterDash && looksLikeCompany(afterDash[1])) {
    return cleanCompanyName(afterDash[1]);
  }

  const beforeAction = cleaned.match(
    /^(.+?)\s+(?:has|is|will|opened|closed|published|notified|issued|distributed|listed)/i
  );

  if (beforeAction && looksLikeCompany(beforeAction[1])) {
    return cleanCompanyName(beforeAction[1]);
  }

  const companyPrefix = cleaned.match(
    /^(.+?\b(?:Limited|Ltd\.?|Bank|Hydropower|Hydro|Energy|Company|Finance|Insurance|Hospital|College|Pharmaceuticals|Industries)\b)/i
  );

  if (companyPrefix) {
    return cleanCompanyName(companyPrefix[1]);
  }

  return null;
}

/**
 * CLEAN NAME
 */
function cleanCompanyName(name = "") {
  return name
    .replace(/\s+\([A-Z]{2,10}\)\s*$/i, "")
    .replace(/\s+(has|is|will|published|issued|notified|listed).*$/i, "")
    .replace(/[.,;:\-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * CHECK COMPANY
 */
function looksLikeCompany(value = "") {
  return /\b(Limited|Ltd\.?|Bank|Hydropower|Hydro|Energy|Company|Finance|Insurance|Hospital|College|Pharmaceuticals|Industries)\b/i.test(value);
}

/**
 * SYMBOL
 */
function extractSymbol(text = "", companyName = "") {
  const symbols = [...text.matchAll(/\(([A-Z]{2,12})\)/gi)]
    .map(m => m[1].toUpperCase())
    .filter(s => !INVALID_SYMBOLS.has(s));

  if (symbols.length) return symbols[symbols.length - 1];

  return SYMBOL_BY_COMPANY[companyName.toLowerCase()] || "UNKNOWN";
}

/**
 * SHARES
 */
function extractShares(text = "") {
  const match = text.match(/([\d,]+(?:\.\d+)?)\s*(units?|shares?)/i);
  if (!match) return 0;

  return Number(match[1].replace(/,/g, "").split(".")[0]) || 0;
}

/**
 * PERCENTAGE
 */
function extractPercentage(text = "") {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? match[1] : null;
}

/**
 * RATIO
 */
function extractRatio(text = "") {
  const match = text.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/);
  return match ? `${match[1]}:${match[2]}` : null;
}

/**
 * STATUS
 */
function determineStatus(text = "") {
  const t = text.toLowerCase();

  if (/\b(listed|listing)\b/.test(t)) return "LISTED";
  if (/\b(allotted|distributed|closed)\b/.test(t)) return "CLOSED";
  if (/\b(opened|opening|extended)\b/.test(t)) return "OPEN";
  if (/\b(will|upcoming|issue|issuing)\b/.test(t)) return "UPCOMING";

  return "UPCOMING";
}

/**
 * MANUAL REVIEW
 */
function getManualReviewReasons({ companyName, symbol, shares, rawText, type }) {
  const reasons = [];

  if (!companyName || !looksLikeCompany(companyName)) {
    reasons.push("company_name_partial");
  }

  if (symbol === "UNKNOWN") {
    reasons.push("symbol_missing");
  }

  const percentage = extractPercentage(rawText);

  if (["DIVIDEND", "BONUS"].includes(type) && !percentage) {
    reasons.push("percentage_missing");
  }

  if (!shares && !["DIVIDEND", "BONUS", "AGM"].includes(type)) {
    reasons.push("units_missing");
  }

  return reasons;
}

/**
 * CONFIDENCE
 */
function calculateConfidence({
  baseConfidence,
  companyName,
  symbol,
  shares,
  manualReviewReasons
}) {
  if (manualReviewReasons.includes("company_name_partial")) return 0.2;
  if (!shares && symbol === "UNKNOWN") return 0.2;
  if (symbol === "UNKNOWN") return 0.8;
  if (companyName && symbol !== "UNKNOWN" && shares) return 1;

  return Math.min(baseConfidence || 0.95, 0.95);
}

module.exports = {
  normalizeEvent,
  extractCompanyName,
  extractShares,
  extractSymbol,
  determineStatus
};