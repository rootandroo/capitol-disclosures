const { connectDatabase } = require("../database/dbConnect");
const { fetchCongressMembers, parseMembers } = require("../modules/members");
const MemberModel = require("../database/models/MemberModel");
const ReportModel = require("../database/models/ReportModel");
const TxModel = require("../database/models/TxModel");
const senate = require("../modules/senate-reports");
const house = require("../modules/house-reports");

const updateMembers = async (year) => {
  console.log("Updating Congress Members");
  const members = await fetchCongressMembers(year);
  const parsedMembers = parseMembers(members);
  for (item of parsedMembers) {
    let query = await MemberModel.findOne({
      last: item.last,
      first: item.first,
    });
    if (!query) {
      console.log(`Adding [${item.first} ${item.last}] to database.`);
      let member = await MemberModel.create({
        position: item.position,
        last: item.last,
        first: item.first,
        state: item.state,
        district: item.district,
        party: item.party,
        servers: [],
        reports: [],
        transactions: [],
      });
      await member.save();
    }
  }
};

const updateHouseReports = async (year) => {
  console.log("Updating House Reports");
  const houseDisclosures = await house.fetchDisclosures(year);
  const houseReports = house.parseDisclosures(houseDisclosures, year);
  let missing = [];
  for (item of houseReports) {
    first = /"/.test(item.First)
      ? item.First.match(/"(.*?)"/)[0].replaceAll('"', "")
      : item.First;
    let member = await MemberModel.findOne({
      last: { $regex: item.Last },
      first: { $regex: first },
    });
    if (!member) {
      missing.push(`[${first}] ${item.Last}`);
      continue;
    }

    let report = await ReportModel.findOne({ url: item.URL });
    if (!report) {
      console.log(
        `Adding Report for [${item.First} ${item.Last}] to database.`
      );
      report = await ReportModel.create({
        type: item.FilingType,
        date: new Date(item.FilingDate),
        url: item.URL,
        member: member._id,
        servers: [],
        transactions: [],
      });
      await report.save();
    }
  }
  // console.log([...new Set(missing)])
};

const updateSenateReports = async (year) => {
  console.log("Updating Senate Reports");
  const session = senate.createSession();
  const houseDisclosures = await senate.fetchDisclosures(session, year);
  let missing = [];
  for (item of houseDisclosures) {
    let member = await MemberModel.findOne({
      $or: [
        {
          last: { $regex: item.last },
          first: { $regex: item.first },
        },
        {
          last: { $regex: item.last },
          alias: item.first,
        },
      ],
    });
    if (!member) {
      missing.push(`[${item.first}] ${item.last}`);
      continue;
    }

    let report = await ReportModel.findOne({ url: item.url });
    if (!report) {
      console.log(
        `Adding Report for [${item.first} ${item.last}] to database.`
      );
      report = await ReportModel.create({
        type: item.type,
        date: new Date(item.date),
        url: item.url,
        member: member._id,
        servers: [],
        transactions: [],
      });
      await report.save();

      // Fetch Transactions
      let transactions = await senate.fetchTransactions(session, item.url);
      if (!transactions) { continue }
      for (tx of transactions) {
        console.log(`    Saving tx with ticker [${tx.Ticker}]`);
        transaction = await TxModel.create({
          date: new Date(tx["Transaction Date"]),
          owner: tx.Owner,
          ticker: tx.Ticker,
          assetName: tx["Asset Name"],
          assetType: tx["Asset Type"],
          type: tx.Type,
          amount: tx.Amount,
          comment: tx.Comment,
          report: report._id,
          member: member._id,
        });
        await transaction.save();
      }
    }
  }
  // console.log([...new Set(missing)]);
};

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    await connectDatabase();
    
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
      
      // Fetch House Reports
      // await updateHouseReports(year)

      // Fetch Senate Reports
      // await updateSenateReports(year);

      // Filter for unique Reports
      
      // Send Reports

    }, interval);
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
