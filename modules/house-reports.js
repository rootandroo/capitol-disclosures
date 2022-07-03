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
    const row = values.reduce((row, field, index) => {
      row[header[index]] = field;
      return row;
    }, {});
    if (row?.DocID && row.FilingType !== "C") {
      const reportType = row.FilingType == "P" ? "ptr-pdfs" : "financial-pdfs";
      row.URL = `https://disclosures-clerk.house.gov/public_disc/${reportType}/${year}/${row.DocID}.pdf`;
      row.First = /"/.test(item.First)
        ? item.First.match(/"(.*?)"/)[0].replaceAll('"', "")
        : item.First;
      result.push(row);
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
