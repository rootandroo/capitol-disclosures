const { model, Schema } = require("mongoose");


const querySchema = new Schema({
    query: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});

module.exports = model("query", querySchema);