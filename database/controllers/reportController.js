const reportModel = require("../models/reportModel");

const saveUniqueReport = async (item, member) => {
  const query = await reportModel.findOne({ url: item.url });
  if (query) return query;
  
  console.log(`    Adding Report for [${item.first} ${item.last}] to database.`);
  if (!item.date) return

  const report = await reportModel.create({
    type: item.type,
    date: new Date(item.date),
    url: item.url,
    member: member._id,
    servers: [],
  });
  await report.save();
  return report;
};

const findByMemberID = async id => {
  return await reportModel.find({member: id})
}
module.exports = { saveUniqueReport, findByMemberID };
