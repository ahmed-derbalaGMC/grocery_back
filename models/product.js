const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Product = new Schema({
    name: {type: String, required: true, max: 100},
    quantity: {type: Number, required: true},
},{timestamps: true});


module.exports = mongoose.model('Product', Product);