const reportModel = require("../database/models/reportModel");

const saveUniqueReport = (report, member) => {
    let report = await reportModel.findOne({ url: report.URL });
    if (!report) {
      console.log(`Adding Report for [${report.First} ${report.Last}] to database.`);
      report = await reportModel.create({
        type: report.FilingType,
        date: new Date(report.FilingDate),
        url: report.URL,
        member: member._id,
        servers: [],
        transactions: [],
      });
      await report.save();
    }
    return report
}


module.exports = { saveUniqueReport };