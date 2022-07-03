const memberModel = require("../models/memberModel");

const bulkSaveUnique = async members => {
    for (item of members) {
        if (!item.last || !item.first) { continue }
        let query = await memberModel.findOne({
          last: item.last,
          first: item.first,
        });
        if (!query) {
          console.log(`Adding [${item.first} ${item.last}] to database.`);
          let member = await memberModel.create({
            position: item.position,
            last: item.last,
            first: item.first,
            state: item.state,
            district: item.district,
            party: item.party,
            servers: [],
            reports: [],
            transactions: [],
          });
          await member.save();
        }
      }
}

const findByNameOrAlias = async (last, first) => {
  let member = await memberModel.findOne({
    $or: [
      {
        last: { $regex: last },
        first: { $regex: first },
      },
      {
        last: { $regex: last },
        alias: first,
      },
    ],
  });
  return member
}

module.exports = { bulkSaveUnique, findByNameOrAlias };