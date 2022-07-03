const memberModel = require("../models/memberModel");

const bulkSaveUnique = async (members) => {
  for (const item of members) {
    if (!item.last || !item.first) continue;
    const query = await memberModel.findOne({ last: item.last, first: item.first });
    if (query) continue;
    
    console.log(`    Adding [${item.first} ${item.last}] to database.`);
    const member = await memberModel.create({
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
};

const findByNameOrAlias = async (last, first) => {
  const member = await memberModel.findOne({
    $or: [
      {
        last: { $regex: last, $options: "i" },
        first: { $regex: first, $options: "i" },
      },
      {
        last: { $regex: last, $options: "i" },
        alias: first,
      },
    ],
  });
  return member;
};

const searchByName = async (name) => {
  const members = await memberModel.find({$text: {$search: name}})
    .limit(5);
  return members
};

const findById = async (id) => {
  return await memberModel.findById(id)
}

module.exports = { bulkSaveUnique, findByNameOrAlias, searchByName, findById };
