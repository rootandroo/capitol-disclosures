const axios = require('axios');
const admZip = require('adm-zip');

// TODO: Create tests to verify transaction output

const fetchDisclosures = async year => {
    const url = `https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${year}FD.ZIP`;
    const zipBuffer = await axios.get(url, {
        responseType: 'arraybuffer'
    });

    const zip = new admZip(zipBuffer.data)
    const zipEntries = zip.getEntries();

    return zip.readAsText(zipEntries[0]);
}

// members is an array of objects each containing first & last names of a member
const parseDisclosures = (disclosures, members) => {
    const lines = disclosures.split('\r\n')
    const header = lines[0].split('\t')
    const result = [];

    for (let line of lines.slice(1)) {
        const values = line.split('\t');
        const row = values.reduce((row, field, index) => {
            row[header[index]] = field
            return row;
        }, {})   
        let member = members.find(member => 
            member.last.toLowerCase() === row?.Last?.toLowerCase() && 
            member.first.toLowerCase() === row?.First?.toLowerCase())
        if (member) result.push(row)
    }
    return result
}

const fetchDocuments = async (disclosures, year) => {
    const documents = [];
    for (disclosure of disclosures) {
        const DocID = disclosure["DocID"]
        const reportType = (disclosure["FilingType"] == "P") ? "ptr-pdfs" : "financial-pdfs"
        const url = `https://disclosures-clerk.house.gov/public_disc/${reportType}/${year}/${DocID}.pdf`
        documents.push({
            first: disclosure.First,
            last: disclosure.Last,
            report: url,
            date: disclosure.FilingDate,
            state: disclosure.FilingType
        })
    }
    return documents;
}

module.exports = { fetchDisclosures, parseDisclosures, fetchDocuments };