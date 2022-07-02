const axios = require("axios");
const admZip = require("adm-zip");
const cheerio = require("cheerio");

const fetchDisclosures = async (year) => {
  const url = `https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${year}FD.ZIP`;
  const zipBuffer = await axios.get(url, {
    responseType: "arraybuffer",
  });

  const zip = new admZip(zipBuffer.data);
  const zipEntries = zip.getEntries();

  return zip.readAsText(zipEntries[0]);
};

const parseDisclosures = (disclosures, year) => {
  const lines = disclosures.split("\r\n");
  const header = lines[0].split("\t");
  const result = [];

  for (let line of lines.slice(1)) {
    const values = line.split("\t");
    const row = values.reduce((row, field, index) => {
      row[header[index]] = field;
      return row;
    }, {});
    row.First = parseFirstName(row.First)

    if (row?.DocID && row.First) {
      const reportType = row.FilingType == "P" ? "ptr-pdfs" : "financial-pdfs";
      row.URL = `https://disclosures-clerk.house.gov/public_disc/${reportType}/${year}/${row.DocID}.pdf`;
      result.push(row);
    }
  }
  return result;
};

const fetchCongressMembers = async (year) => {
  const url = "https://www.congress.gov";
  const parsePage = (resp) => {
    const $ = cheerio.load(resp.data);
    const nextPage = $(".next")[0]?.attribs.href;
    const entries = $(".basic-search-results-lists").find(
      ".compact > .quick-search-member"
    );
    entries.each((_, entry) => {
      const name = $(entry).find(".member-image")[0]?.children[0].attribs.alt;
      if (typeof name === "undefined") {
        return;
      }
      const [last, first] = name.split(",").map((item) => item.trim());
      const member = { last, first: parseFirstName(first) };
      const stats = $(entry).find(".member-profile > .result-item");
      stats.each((_, stat) => {
        const [key, value] = $(stat).text().replace(/\n\s+/g, "").split(":");
        member[key] = value;
      });
      members.push(member);
    });
    return nextPage;
  };

  const queryParams = {
    q: { congress: [`${year - 1905}`], source: "members" },
    pageSize: 250,
  };
  const resp = await axios.get(url + "/members?", { params: queryParams });
  const members = [];
  var nextPage = parsePage(resp);
  while (typeof nextPage !== "undefined") {
    const resp = await axios.get(url + nextPage);
    nextPage = parsePage(resp);
  }
  return members;
};

const parseFirstName = (first) => {
  if (/\s/.test(first) && !first.includes(".")) {
    match = first.match(/^([a-zA-Z']+) [A-Z]/);
    first = match ? match[0] + '.' : null
  }
  return first
};

if (require.main === module) {
  console.log('MEMBERS')
  fetchCongressMembers(2022).then(members => {
  })
//   console.log("DISCLOSURES");
//   fetchDisclosures(2022).then((disclosures) => {
//     const reports = parseDisclosures(disclosures, 2022);
//   });
}

module.exports = { fetchDisclosures, parseDisclosures, fetchCongressMembers };
