const { connectDatabase } = require("../database/dbConnect");
const { fetchCongressMembers, parseMembers } = require("../modules/members");
const memberController = require("../database/controllers/memberController");
const reportController = require("../database/controllers/reportController");
const txController = require("../database/controllers/txController");
const senate = require("../modules/senate-reports");
const house = require("../modules/house-reports");

const updateMembers = async (year) => {
  console.log("Updating Congress Members");
  const members = await fetchCongressMembers(year);
  const parsedMembers = parseMembers(members);
  await memberController.bulkSaveUnique(parsedMembers);
};

const updateHouseReports = async (year) => {
  console.log("Updating House Reports");
  const houseDisclosures = await house.fetchDisclosures(year);
  const houseReports = house.parseDisclosures(houseDisclosures, year);
  for (const item of houseReports) {
    let member = await memberController.findByNameOrAlias(
      item.last,
      item.first
    );
    if (!member) continue;
    let report = await reportController.saveUniqueReport(item, member);
  }
};

const updateSenateReports = async (year) => {
  console.log("Updating Senate Reports");
  const session = senate.createSession();
  const senateDisclosures = await senate.fetchDisclosures(session, year);
  for (const item of senateDisclosures) {
    let member = await memberController.findByNameOrAlias(
      item.last,
      item.first
    );
    if (!member) continue;

    let report = await reportController.saveUniqueReport(item, member);
    if (!report) continue;

    let transactions = await senate.fetchTransactions(session, item.url);
    if (!transactions) continue;
    await txController.bulkSaveUnique(transactions, report, member);
  }
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
