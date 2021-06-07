const mongoose = require('mongoose');
const Constants = require('../util/constants');

const feedbackSchema = new mongoose.Schema({
    name: { type: String, required: true },
    feedback: { type: String, required: true },
    email: { type: String, trim: true, required: true, lowercase: true },
    status: { type: String, default: 'Open', enum: Constants.feedbackStatus }
}, {
        collection: 'feedback',
        timestamps: true
    });

module.exports = mongoose.model('Feedback', feedbackSchema);