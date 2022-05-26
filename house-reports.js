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
        let member = members.find(member => member.last === row.Last && member.first === row.First)
        if (member) result.push(row)
    }
    return result
}

const fetchDocuments = async (disclosures, year) => {
    const documents = [];
    for (disclosure of disclosures) {
        const DocID = disclosure["DocID"]
        const url = `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${year}/${DocID}.pdf`
        documents.push({first: disclosure.First, last: disclosure.Last, report: url})
    }
    return documents;
}



const main = async () => {
    const members = [
        {last: 'Pelosi', first: 'Nancy'},
    ]
    const year = 2022;
    const text = await fetchDisclosures(year);
    const disclosures = parseDisclosures(text, members);
    const documents = await fetchDocuments(disclosures, year);
    console.log(documents)
}

// main()


module.exports = { fetchDisclosures, parseDisclosures, fetchDocuments };