const axios = require('axios');
const admZip = require('adm-zip');
const cheerio = require('cheerio');

const fetchDisclosures = async year => {
    const url = `https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${year}FD.ZIP`;
    const zipBuffer = await axios.get(url, {
        responseType: 'arraybuffer'
    });

    const zip = new admZip(zipBuffer.data)
    const zipEntries = zip.getEntries();

    return zip.readAsText(zipEntries[0]);
}

const parseDisclosures = (disclosures, year) => {
    const lines = disclosures.split('\r\n')
    const header = lines[0].split('\t')
    const result = [];

    for (let line of lines.slice(1)) {
        const values = line.split('\t');
        console.log(values)
        const row = values.reduce((row, field, index) => {
            row[header[index]] = field            
            return row;
        }, {})
        if (row?.DocID ) {
            const reportType = (row.FilingType == "P") ? "ptr-pdfs" : "financial-pdfs"
            row.URL = `https://disclosures-clerk.house.gov/public_disc/${reportType}/${year}/${row.DocID}.pdf`
            result.push(row)
        }
    }
    return result
}

const fetchCongressMembers = async year => {
    const parsePage = resp => {
        const $ = cheerio.load(resp.data)
        const nextPage = $('.next')[0]?.attribs.href
        const entries = $('.basic-search-results-lists').find('.compact > .quick-search-member')
        entries.each((_, entry) => {
            const name = $(entry).find('.member-image')[0]?.children[0].attribs.alt
            if (typeof name === 'undefined') {return}
            const [first, last] = name.split(',').map(item => item.trim()); 
            const member = { first, last }
            const stats = $(entry).find('.member-profile > .result-item')
            stats.each((_, stat) => {
                const [key, value] = $(stat).text().replace(/\n\s+/g, '').split(':')
                member[key] = value
            })
            members.push(member)
        })

        return nextPage
    }

    const url = 'https://www.congress.gov'
    const queryParams = {
        q: '{"congress":117}',
        pageSize: 250 
    }
    const resp = await axios.get(url + '/members?', { params: queryParams });
    const members = []

    var nextPage = parsePage(resp)
    while (typeof nextPage !== 'undefined') { 
        const resp = await axios.get(url + nextPage);
        nextPage = parsePage(resp);
    }
    return members
}

if (require.main === module) {
    fetchCongressMembers(2022).then(member => {  
        console.log('Complete')
    })
}

module.exports = { fetchDisclosures, parseDisclosures, fetchCongressMembers };  