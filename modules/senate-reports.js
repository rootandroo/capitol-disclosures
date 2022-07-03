const axios = require("axios");
const cheerio = require("cheerio");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

const ROOT = "https://efdsearch.senate.gov";
const LANDING_PAGE_URL = `${ROOT}/search/home/`;
const SEARCH_PAGE_URL = `${ROOT}/search/`;
const REPORTS_URL = `${ROOT}/search/report/data/`;

const _csrf = async (session) => {
  let _prewalk = await session.get(LANDING_PAGE_URL);
  let tree = cheerio.load(_prewalk.data);
  let csrf = tree("input[type=hidden]")[0].attribs.value;
  session.defaults.headers["X-CSRFToken"] = csrf;
  const params = new URLSearchParams({
    prohibition_agreement: 1,
    csrfmiddlewaretoken: csrf,
  });
  try {
    let resp = await session.post(LANDING_PAGE_URL, params.toString());
  } catch (error) {
    console.log(error);
  }
  return csrf;
};

const parseName = (first, last) => {
  first =
    first.toUpperCase() === first
      ? first.charAt(0) + first.slice(1).toLowerCase().trim()
      : first.trim();
  last =
    last.toUpperCase() === last
      ? last.charAt(0) + last.slice(1).toLowerCase()
      : last.trim();
  last = last.includes(",") ? last.split(",")[0] : last;
  return [first, last];
};

const fetchDisclosures = async (session, year) => {
  const params = new URLSearchParams({
    draw: 1,
    start: 0,
    length: 100,
    submitted_start_date: `01/01/${year} 00:00:00`,
    report_types: "[11]",
  });
  const hrefRegex = /(?<=href=")([\s\S]*?)(?=")/;
  const hrefTextRegex = /(?<=>)([\s\S]*?)(?=<)/;
  const parsePage = (resp) => {
    const reports = resp.data.data;
    reports.forEach(async (report) => {
      [first, last, office, anchor, date] = report;
      [first, last] = parseName(first, last);
      var url = `${ROOT}${anchor.match(hrefRegex)[0]}`;
      var type = anchor.match(hrefTextRegex)[0].trim();
      var entry = { first, last, office, url, type, date };

      disclosures.push(entry);
    });
  };

  await _csrf(session);
  let resp = await session.post(REPORTS_URL, params.toString());
  const numReports = resp.data.recordsTotal;
  const disclosures = [];
  parsePage(resp);
  for (page = 1; page < Math.ceil(numReports / 100); page++) {
    params.set("start", page * 100);
    resp = await session.post(REPORTS_URL, params.toString());
    parsePage(resp);
  }
  return disclosures;
};

const fetchTransactions = async (session, url) => {
  if (url.includes("paper")) return;
  var resp = await session.get(url);
  // CSRF token expired, renew token and session
  if (resp.request.res.responseUrl == LANDING_PAGE_URL) {
    await _csrf(session);
    resp = await session.get(url);
  }
  const $ = cheerio.load(resp.data);
  const table = $(".table-responsive > .table");
  const header = table.find(".header");
  const body = table.find("tbody > tr");
  const txs = [];
  const headers = [
    'ID',
    ...header
      .text()
      .split("\n")
      .filter((col) => /[a-zA-Z]/.test(col))
      .map((col) => col.trim()),
  ];
  body.each((_, row) => {
    values = $(row)
      .text()
      .split("\n")
      .filter((col) => /[a-zA-Z0-9]/.test(col))
      .map((col) => col.trim());
    row = {};
    headers.forEach((key, i) => (row[key] = values[i]));
    row.Comment = row.Comment || "";
    txs.push(row);
  });
  return txs;
};

const createSession = () => {
  return wrapper(
    axios.create({
      jar: new CookieJar(),
      headers: {
        Referer: ROOT,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
      },
    })
  );
};
if (require.main == module) {
  const session = createSession();

  fetchDisclosures(session, 2022).then((disclosures) => {
    console.log(disclosures[0])
    fetchTransactions(session, disclosures[0].url).then((result) => {
      console.log(result[0]);
    });
  });
}

module.exports = { fetchDisclosures, fetchTransactions, createSession };
