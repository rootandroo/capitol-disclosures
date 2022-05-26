const { model, Schema } = require("mongoose");


const disclosureSchema = new Schema({
    docID: {
        type: String,
        required: true,
        unique: true
    },
    last: {
        type: String,
        required: true
    },
    first: {
        type: String,
        required: true
    },
});

module.exports = model("disclosure", disclosureSchema);