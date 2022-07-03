const { model, Schema } = require("mongoose");

const txSchema = new Schema({
  date: { type: Date },
  owner: { type: String },
  ticker: { type: String },
  assetName: { type: String },
  assetType: { type: String },
  type: { type: String },
  amount: { type: String },
  comment: { type: String },
  report: {
    type: Schema.Types.ObjectId,
    ref: "report",
  },
  member: {
    type: Schema.Types.ObjectId,
    ref: "member",
  },
});

module.exports = model("transaction", txSchema);
