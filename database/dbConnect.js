const { connect } = require("mongoose");
const { mongoURI } = require('../config.json');

const connectDatabase = async () => {
    try {
        await connect(mongoURI);
        console.log('Database connection successful.')
    } catch (error) {
        console.log(error)
    }
};

module.exports = { connectDatabase }