const { model, Schema } = require("mongoose");

const reportSchema = new Schema({
    type: {
        type: String,
        required: true
    },
    date: {
        type: Date,
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
    servers: [String],
});

module.exports = model("report", reportSchema);

reports = "One -> Many | Report -> Txs /"  
members = "One -> Many | Member -> Reports /"
members = "One -> Many | Member -> Txs"
