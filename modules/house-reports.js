const axios = require("axios");
const admZip = require("adm-zip");

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
    let [ prefix, last, first, suffix, type, state, year, date, doc ] = values
    if (doc && type !== "C") {
      const reportType = type == "P" ? "ptr-pdfs" : "financial-pdfs";
      url = `https://disclosures-clerk.house.gov/public_disc/${reportType}/${year}/${doc}.pdf`;
      first = /"/.test(first)
        ? first.match(/"(.*?)"/)[0].replaceAll('"', "")
        : first;
      result.push({url, first, last, type, date});
    }
  }
  return result;
};

if (require.main === module) {
  console.log("DISCLOSURES");
  fetchDisclosures(2022).then((disclosures) => {
    const reports = parseDisclosures(disclosures, 2022);
    console.log(reports);
  });
}

module.exports = { fetchDisclosures, parseDisclosures };
