const { model, Schema } = require("mongoose");

const reportSchema = new Schema({
    type: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    url: {
        type: String,
        required: true,
        unique: true
    },
    member: {
        type: Schema.Types.ObjectId,
        ref: 'member'
    },
    servers: [Number],
    transactions: [{
        type: Schema.Types.ObjectId,
        ref: 'transaction'
    }]
});

module.exports = model("report", reportSchema);

reports = "One -> Many | Report -> Txs /"  
members = "One -> Many | Member -> Reports /"
members = "One -> Many | Member -> Txs"
