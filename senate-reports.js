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

const fetchDisclosures = async (session, year) => {
  const params = new URLSearchParams({
    draw: 1,
    start: 0,
    length: 25,
    submitted_start_date: `01/01/${year} 00:00:00`,
    report_types: "[11]",
  });
  await _csrf(session);
  const resp = await session.post(REPORTS_URL, params.toString());
  const reports = resp.data.data;
  const hrefRegex = /(?<=href=")([\s\S]*?)(?=")/;
  const hrefText = /(?<=>)([\s\S]*?)(?=<)/;
  const disclosures = [];
  reports.forEach(async (report) => {
    [first, last, office, anchor, date] = report;
    var url = `${ROOT}${anchor.match(hrefRegex)[0]}`;
    var type = anchor.match(hrefText)[0].trim();
    var entry = { first, last, office, url, type, date };
    disclosures.push(entry);
  });
  return disclosures;
};

const parseDisclosures = async (session, disclosures) => {
  const parseReport = async (url) => {
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
    const headers = header
      .text()
      .split("\n")
      .filter((col) => /[a-zA-Z]/.test(col))
      .map((col) => col.trim());
    body.each((_, row) => {
      values = $(row)
        .text()
        .split("\n")
        .filter((col) => /[a-zA-Z0-9]/.test(col))
        .map((col) => col.trim())
        .slice(1);

      row = {};
      headers.forEach((key, i) => (row[key] = values[i]));
      txs.push(row);
    });
    return txs;
  };

  const result = [];
  for (let disclosure of disclosures) {
    if (!disclosure.url.includes("paper")) {
      disclosure.txs = await parseReport(disclosure.url);
    }
    result.push(disclosure);
  }
  return result;
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
    parseDisclosures(session, disclosures).then((result) => {
      console.log(result[0]);
    });
  });
}

module.exports = { fetchDisclosures, parseDisclosures, createSession };
