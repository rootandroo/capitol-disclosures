const axios = require('axios');
const admZip = require('adm-zip');
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf");


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
const parseDisclosures = (text, members) => {
    const lines = text.split('\r\n')
    const header = lines[0].split('\t')
    const result = []
    for (let line of lines.slice(1)) {
        const values = line.split('\t');
        const row = values.reduce((row, field, index) => {
            row[header[index]] = field
            return row;
        }, {})   
        result.push(row)
    }
    return result.filter(doc => members.some(member => member.last === doc.Last && member.first === doc.First))
}

const fetchDocuments = async (disclosures, year) => {
    const documents = [];
    for (disclosure of disclosures) {
        const DocID = disclosure["DocID"]
        console.log(DocID)
        const url = `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${year}/${DocID}.pdf`
        const pdfBuffer = await axios.get(url, {
            responseType: 'arraybuffer'
        });
        const doc = await pdfjsLib.getDocument(pdfBuffer).promise;
        documents.push(doc);
    }
    return documents;
}

const parseDocument = async document => {
    const keys = ['transaction', 'date', 'amount']
    const headers = {};
    const transactions = [];

    for (let index = 1; index <= document.numPages; index++) {
        let row = {};

        const page = await document.getPage(index);
        const content = await page.getTextContent();
        for (item of content.items) {
            const text = item.str
            const xCoord = item.transform[4];
            const yCoord = item.transform[5];

            if (!text || text.includes('cap.')) continue;

            if (text.toLowerCase() === 'asset') {
                headers[text.toLowerCase()] = {x: xCoord, y: yCoord};
                continue;
            }

            if (headers?.asset?.y == item.transform[5] && keys.includes(text.toLowerCase())) {
                headers[text.toLowerCase()] = {x: xCoord, y: yCoord};
                continue;
            }
            
            const col = Object.keys(headers).find(col => Math.abs(headers[col]?.x - xCoord) < 53)

            if (col) {
                if (['type', 'date', 'gains >', '$200?'].includes(text.toLowerCase())) {
                    continue;
                }

                if (!row[col]) row[col] = "";
                if (text == "notification") console.log(xCoord)
                row[col] += text;

                if (text.charAt(text.length - 1) == "." && row["amount"]?.trim()) {
                    if ("asset" in row) {
                        const textArray = row.asset.split(/[:]+/)
                        row.asset = textArray[0]
                        row.description = textArray[textArray.length -1]
                        transactions.push(row);
                    }
                    row = {};
                };
            }
        }
        // console.log(headers)
    }
    console.log(transactions)
}

const main = async () => {
    const members = [
        {last: 'Pelosi', first: 'Nancy'},
        {last: 'Auchincloss', first: 'Jake'}
    ]
    const year = 2022
    const text = await fetchDisclosures(year);
    const disclosures = parseDisclosures(text, members);
    const documents = await fetchDocuments(disclosures, year);

    parseDocument(documents[4])
}

main();

module.exports = { fetchDisclosures, parseDisclosures };