const { connect } = require("mongoose");

const connectDatabase = async () => {
    try {
        await connect(process.env.MONGO_URI);
        console.log('Database connection successful.')
    } catch (error) {
        console.log(error)
    }
};

module.exports = { connectDatabase }