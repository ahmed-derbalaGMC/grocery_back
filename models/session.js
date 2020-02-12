const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

let Session = new Schema({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    email: { type: String, required: true, max: 100, index: true },
    
    attempt: { type: Number, required: true, min: 0 },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },

    token: { type: String, required: false },

}, { timestamps: true });

//Session.plugin(uniqueValidator, { message: '{PATH}={VALUE} is already taken' });

module.exports = mongoose.model('Session', Session);