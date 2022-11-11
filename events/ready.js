const { connectDatabase } = require("../database/dbConnect");
const {
  updateMembers,
  updateHouseReports,
  updateSenateReports,
  getReportsToSendAndMarkAsSent,
  createReportEmbeds,
  sendReportEmbeds,
} = require("../modules/utils");
const { sendAuctions } = require("../modules/ebay")

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

      console.log(`Updating database for [${month}/${day}/${year}]`);
      // Fetch Congress Members
      if (month % 4 == 0 && month == day) {
        await updateMembers(year);
      }

      // Fetch House Reports
      await updateHouseReports(year);

      // Fetch Senate Reports
      await updateSenateReports(year);

      // Look for Reports to Send
      const reportsToSend = await getReportsToSendAndMarkAsSent();

      //Send Reports
      reportsToSend.forEach(async (report) => {
        const reportEmbeds = await createReportEmbeds({ report });
        for (channelID of report.destination) {
          const channel = await client.channels.cache.get(channelID);
          await sendReportEmbeds({ embeds: reportEmbeds, channel });
        }
      });
    }, interval);

    const auctionMonitor = setInterval(async () => {
      const channel = await client.channels.cache.get('1035288898668072960')
      await sendAuctions(channel)
    }, 30 * 60 * 1000)
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
