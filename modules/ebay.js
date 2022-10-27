const axios = require("axios");
const cheerio = require('cheerio')

class Scraper {
    constructor(query, price) {
        this.query = query
        this.price = price
        this.results = []
    }

    async fetchListings() {
        const url = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${this.query}&_sacat=0&LH_Auction=1&_sop=1&rt=nc&_udhi=${this.price}`
        const resp = await axios.get(url);     
        const $ = cheerio.load(resp.data)
        
        $(".s-item__info").each((_, element) => {
            const title = $(element).find('.s-item__title').text()
            const link = $(element).find('.s-item__link')[0].attribs.href
            const price = $(element).find('.s-item__price').text()
            const timeLeft = $(element).find('.s-item__time-left').text()
            const timeEnd = $(element).find('.s-item__time_end').text()

            const isMatchQuery = title.toLowerCase().includes(this.query.toLowerCase())
            const isEndingSoon = !['h', 'd'].some(unit => timeLeft.includes(unit))

            if (isMatchQuery && isEndingSoon) {
                this.results.push({
                    title,
                    link,
                    price,
                    timeLeft
                })
            }
        })
    }
}

// const query = "google pixel 6a"
// const scraper = new Scraper(query, 250);
// scraper.fetchListings()
// console.log(scraper.results)

module.exports = { Scraper };