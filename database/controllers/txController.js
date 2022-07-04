const txModel = require("../models/txModel");

const bulkSaveUnique = async (transactions, report, member) => {
  for (const tx of transactions) {
    const query = await txModel.findOne({
      id: tx.ID,
      date: new Date(tx["Transaction Date"]),
      ticker: tx.Ticker,
      type: tx.Type,
      owner: tx.Owner,
    });
    if (query) continue;
    
    console.log(`        Saving tx with ticker [${tx.Ticker}]`);
    const transaction = await txModel.create({
      id: tx.ID,
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
};

const findByReportID = async id => {
  return await txModel.find({report: id })
}

module.exports = { bulkSaveUnique, findByReportID };
