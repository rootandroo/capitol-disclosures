const { model, Schema } = require("mongoose");


const memberSchema = new Schema({
    chamber: {
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
    servers: [Number],
    reports: [{
        type: Schema.Types.ObjectId,
        ref: 'report',
    }],
    transactions: [{
        type: Schema.Types.ObjectId,
        ref: 'transaction'
    }]
});

memberSchema.index({
    last: 1,
    first: 1
}, {
    unique: true
});


module.exports = model("member", memberSchema);