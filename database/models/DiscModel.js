const { model, Schema } = require("mongoose");


const disclosureSchema = new Schema({
    docID: {
        type: String,
        required: true,
    },
    last: {
        type: String,
        required: true
    },
    first: {
        type: String,
        required: true
    },
    guildID: {
        type: String,
        required: true
    }
});

disclosureSchema.index({
    docID: 1,
    guildID: 1
}, {
    unique: true
});


module.exports = model("disclosure", disclosureSchema);