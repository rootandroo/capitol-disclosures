const { connectDatabase } = require("../database/dbConnect");
const MemberModel = require("../database/models/MemberModel");
const ReportModel = require("../database/models/ReportModel");
const TxModel = require("../database/models/TxModel");
const senate = require("../modules/senate-reports");
const house = require("../modules/house-reports");

const updateMembers = async (year) => {
  console.log('Updating Congress Members')
  const members = await house.fetchCongressMembers(year);
  for (item of members) {
    let query = await MemberModel.findOne({
      last: item.last,
      first: item.first,
    });
    if (!query) {
      console.log(`Adding [${item.first} ${item.last}] to database.`);
      let member = await MemberModel.create({
        chamber: item.Served,
        last: item.last,
        first: item.first,
        state: item.State,
        district: item.District,
        party: item.Party,
        servers: [],
        reports: [],
        transactions: [],
      });
      await member.save();
    }
  }
};

const updateHouseReports = async (year) => {
  console.log('Updating House Reports')
  const houseDisclosures = await house.fetchDisclosures(year);
  const houseReports = house.parseDisclosures(houseDisclosures, year);
  let missing = []
  for (item of houseReports) {
    let member = await MemberModel.findOne({
      last: item.Last,
      first: item.First
    });
    if (!member) {
      missing.push(`[${item.first}] ${item.last}`)
      continue
    }

    let report = await ReportModel.findOne({ url: item.URL });
    if (!report) {
      console.log(`Adding Report for [${item.First} ${item.Last}] to database.`)
      report = await ReportModel.create({
        type: item.FilingType,
        date: new Date(item.FilingDate),
        url: item.URL,
        member: member._id,
        servers: [],
        transactions: []
      });
      await report.save()
    }
  }
};

const updateSenateReports = async (year) => {
  console.log('Updating Senate Reports')
  const session = senate.createSession();
  const houseDisclosures = await senate.fetchDisclosures(session, year);
  let missing = []
  for (item of houseDisclosures) {
    let member = await MemberModel.findOne({
      last: item.last,
      first: item.first
    });
    if (!member) {missing.push(`${item.first} ${item.last}`)}
  }
  console.log([...new Set(missing)])
}

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    await connectDatabase();
    await updateSenateReports(2022)

    // Set interval to 24 hours in milliseconds
    const interval = 60 * 1000;
    const monitor = setInterval(async () => {
      const timestamp = new Date(Date.now());
      const day = timestamp.getDay();
      const month = timestamp.getMonth();
      const year = timestamp.getFullYear();

      // Fetch Congress Members
      if (month % 4 == 0 && month == day) {
        await updateMembers(year);
      }

      //   // Fetch House Reports
      // await updateHouseReports(year)

      //   // Fetch Senate Reports
      //   const session = senate.createSession();
      //   const senateDisclosures = await senate.fetchDisclosures(session, year);
      //   const senateReports = await senate.parseDisclosures(session, senateDisclosures);
    }, interval);
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
