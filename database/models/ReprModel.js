const { model, Schema } = require("mongoose");


const representativeSchema = new Schema({
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

representativeSchema.index({
    last: 1,
    first: 1,
    guildID: 1
}, {
    unique: true
});

module.exports = model("representative", representativeSchema);