const txModel = require("../models/txModel")

const bulkSave = async (transactions, report, member) => {
    for (tx of transactions) {
        console.log(`    Saving tx with ticker [${tx.Ticker}]`);
        transaction = await txModel.create({
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
}

module.exports = { bulkSave }