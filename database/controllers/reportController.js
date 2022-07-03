const reportModel = require("../models/reportModel");

const saveUniqueReport = async (item, member) => {
    let reportDoc = await reportModel.findOne({ url: item.url });
    if (!reportDoc) {
      console.log(`Adding Report for [${item.first} ${item.last}] to database.`);
      reportDoc = await reportModel.create({
        type: item.type,
        date: new Date(item.date),
        url: item.url,
        member: member._id,
        servers: [],
        transactions: [],
      });
      await reportDoc.save();
    }
    return reportDoc
}


module.exports = { saveUniqueReport };