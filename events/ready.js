const { connectDatabase } = require("../database/dbConnect");
const { fetchCongressMembers, parseMembers } = require("../modules/members");
const memberController = require("../database/controllers/memberController");
const reportController = require("../database/controllers/reportController");
const txController = require("../database/controllers/txController");
const senate = require("../modules/senate-reports");
const house = require("../modules/house-reports");
const { MessageEmbed } = require("discord.js");

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

const getReportsToSendAndMarkAsSent = async () => {
  console.log(`Looking for reports to send.`)
  let reportsToSend = [];
  const members = await memberController.findMonitored();
  for (const member of members) {
    reports = await reportController.findByMember(member);
    for (let report of reports) {
      destination = member.servers.filter(server => !report.servers.includes(server));
      if (destination.length == 0) continue;

      console.log(`    Marking report as sent for channels ${destination}.`)
      // Mark report as sent for all servers in destination
      report.servers = report.servers.concat(destination)
      await report.save()

      txs = await txController.findByReport(report);
      report = { ...report.toObject(), destination, txs, member };
      reportsToSend.push(report);
    }
  }
  return reportsToSend;
};

const sendReports = async (client, reports) => {
  const getName = (member) => {
    return `${member.position.substring(0, 3)}. ${member.first}, ${member.last}`;};
  reports.forEach(async (report) => {
    
    for (channelID of report.destination) {
      console.log(`    Sending reportEmbed to channel [${channelID}]`)
      const channel = await client.channels.cache.get(channelID);
      // Send Report
      const reportEmbed = new MessageEmbed()
        .setColor("#85bb65")
        .setTitle("Financial Disclosure Report")
        .setURL(report.url)
        .setAuthor({ name: getName(report.member)})
        .setTimestamp(report.date);
      channel.send({ embeds: [reportEmbed] });
      // Send Txs
      for (let tx of report.txs) {
        console.log(`    Sending txEmbed to channel [${channelID}]`)
        const txEmbed = new MessageEmbed()
          .setColor("#85bb65")
          .setTimestamp(tx.date)
          .addFields(
            { name: "Ticker", value: tx.ticker, inline: true },
            { name: "Type", value: tx.type, inline: true },
            { name: "Amount", value: tx.amount, inline: true },
            { name: "Owner", value: tx.owner, inline: true },
            { name: "Class", value: tx.assetType, inline: true },
            { name: "Comment", value: tx.comment, inline: true }
          );
        channel.send({ embeds: [txEmbed] });
      }
      channel.send("** **");
    }
  });
};


module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    await connectDatabase();

    // Set interval to 24 hours in milliseconds
    const interval = 24 * 60 * 60 * 1000;
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
      await updateHouseReports(year)
      
      // Fetch Senate Reports
      await updateSenateReports(year);
      
      // Look for Reports to Send
      const reportsToSend = await getReportsToSendAndMarkAsSent();
      
      // Send Reports
      await sendReports(client, reportsToSend)

    }, interval);
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
