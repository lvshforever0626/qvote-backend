const mongoose = require('mongoose');
const Constants = require('../util/constants');

/* Create News Schema */
var newsShareSchema = mongoose.Schema({
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: 'Provide the news ID to which this comment belongs' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medium: { type: String, enum: Constants.shareMedia, required: true },
}, {
        collection: 'newsshare',
        timestamps: true
    });

module.exports = mongoose.model('NewsShare', newsShareSchema);