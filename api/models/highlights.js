const mongoose = require('mongoose');
const Constants = require('../util/constants');

const highlightsNewsSchema = new mongoose.Schema({
    newsId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'News' },
    category: { type: String, enum: Constants.categories, required: true },
}, {
    collection: 'highlight',
    timestamps: true
});

module.exports = mongoose.model('Highlights', highlightsNewsSchema);