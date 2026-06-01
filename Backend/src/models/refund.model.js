const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['requested','approved','rejected','processing','completed'], required: true },
    amount: { type: Number, default: 0 },
    note: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('RefundLog', refundSchema);
