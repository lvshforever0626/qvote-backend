const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', unique: true },
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now/*, expires: 43200*/ }
}, {
        collection: 'resettoken',
        timestamps: true
    });

module.exports = mongoose.model('ResetToken', resetTokenSchema);