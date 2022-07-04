const { model, Schema } = require("mongoose");


const memberSchema = new Schema({
    position: {
        type: String,
        required: true
    }, 
    last: {
        type: String,
        required: true
    },
    first: {
        type: String,
        required: true
    },
    state: {
        type: String,
    },
    district: {
        type: String
    },
    party: {
        type: String
    },
    alias: {
        type: String
    },
    servers: [String],
});

memberSchema.index({
    last: 1,
    first: 1
}, {
    unique: true
});

memberSchema.index({
    last: 'text',
    first: 'text'
})

module.exports = model("member", memberSchema);