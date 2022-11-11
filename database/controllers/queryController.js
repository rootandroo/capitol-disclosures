const queryModel = require("../models/queryModel");

const saveQuery = async (queryString, price) => {
  let query = await queryModel.findOne({ query: queryString });
  if (query) return query;
  
  console.log(`    Adding New Query for auctions to database.`);

  query = await queryModel.create({
    query: queryString,
    price: price
  });
  await query.save();
  return query;
};

const getQueries = async () => {
  return await queryModel.find()
}

const deleteQueryIfExists = async queryString => {
  await queryModel.deleteOne({ query: queryString });
}

module.exports = { saveQuery, getQueries, deleteQueryIfExists };
