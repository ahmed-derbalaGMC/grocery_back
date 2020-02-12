const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Order = new Schema({
    UserId: {type: Schema.Types.ObjectId, ref: 'User'},
    ProductId: {type: Schema.Types.ObjectId, ref: 'Product'},
},{timestamps: true});


module.exports = mongoose.model('Order', Order);