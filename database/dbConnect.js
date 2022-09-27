const { connect } = require("mongoose");

const connectDatabase = async () => {
    const MONGO_URI = `mongodb+srv://loopandroo:${process.env.MONGO_PASS}@cluster0.luhjz.mongodb.net/disclosures?retryWrites=true&w=majority`
    try {
        await connect(MONGO_URI);
        console.log('Database connection successful.')
    } catch (error) {
        console.log(error)
    }
};

module.exports = { connectDatabase }