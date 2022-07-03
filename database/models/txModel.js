const { model, Schema } = require("mongoose");

const txSchema = new Schema({
  id: { type: Number },
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

txSchema.index({
  "$**" : 1
}, {
  unique: true
});

module.exports = model("transaction", txSchema);
