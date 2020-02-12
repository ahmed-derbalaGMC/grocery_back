const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

let User = new Schema({
    email: { type: String, required: true, max: 100 ,unique:true,index:true},
    password: { type: String, required: true },

},{timestamps: true});

User.plugin(uniqueValidator, {message: '{PATH}={VALUE} is already taken'});

module.exports = mongoose.model('User', User);