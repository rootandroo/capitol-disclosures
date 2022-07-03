const reportModel = require("../models/reportModel");

const saveUniqueReport = async (item, member) => {
  const query = await reportModel.findOne({ url: item.url });
  if (query) return query;
  
  console.log(`    Adding Report for [${item.first} ${item.last}] to database.`);
  const report = await reportModel.create({
    type: item.type,
    date: new Date(item.date),
    url: item.url,
    member: member._id,
    servers: [],
    transactions: [],
  });
  await report.save();
  return report;
};

module.exports = { saveUniqueReport };
