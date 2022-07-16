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
  console.log(`Looking for reports to send.`);
  let reportsToSend = [];
  const members = await memberController.findMonitored();
  for (const member of members) {
    reports = await reportController.findByMemberID(member._id);
    for (let report of reports) {
      destination = member.servers.filter(
        (server) => !report.servers.includes(server)
      );
      if (destination.length == 0) continue;

      console.log(`    Marking report as sent for channels ${destination}.`);
      // Mark report as sent for all servers in destination
      report.servers = report.servers.concat(destination);
      await report.save();

      report = { ...report.toObject(), destination, member };
      reportsToSend.push(report);
    }
  }
  return reportsToSend;
};

const createReportEmbeds = async ({ report, name = null }) => {
  if (!name) {
    const prefix = `${report.member.position.substring(0, 3)}.`
    name = `${prefix} ${report.member.last}, ${report.member.first}`
  }

  const embeds = [];
  const reportEmbed = new MessageEmbed()
    .setColor("#85bb65")
    .setTitle("Financial Disclosure Report")
    .setURL(report.url)
    .setAuthor({ name: name })
    .setTimestamp(report.date);
  embeds.push(reportEmbed);
  const txs = await txController.findByReportID(report._id)
  for (let tx of txs) {
    const amount = tx.amount ? tx.amount : "N/A"
    const comment = tx.comment ? tx.comment : "N/A"
    const txEmbed = new MessageEmbed()
      .setColor("#85bb65")
      .setTimestamp(tx.date)
      .addFields(
        { name: "Ticker", value: tx.ticker, inline: true },
        { name: "Type", value: tx.type, inline: true },
        { name: "Amount", value: amount, inline: true },
        { name: "Owner", value: tx.owner, inline: true },
        { name: "Class", value: tx.assetType, inline: true },
        { name: "Comment", value: comment, inline: true }
      );
    embeds.push(txEmbed);
  }
  return embeds;
};

const sendReportEmbeds = async ({ embeds, channel = null, interaction = null }) => {
  for (let i = 0; i < Math.ceil(embeds.length / 10); i++) {
    const chunk = embeds.slice(i * 10, i * 10 + 9);
    if (interaction) await interaction.followUp({ embeds: chunk, ephemeral: true });
    if (channel) channel.send({ embeds: chunk });
  }
};


module.exports = {
  updateMembers,
  updateHouseReports,
  updateSenateReports,
  getReportsToSendAndMarkAsSent,
  createReportEmbeds,
  sendReportEmbeds
};


