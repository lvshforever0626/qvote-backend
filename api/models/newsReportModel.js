const mongoose = require('mongoose');
const Constants = require('../util/constants');

/* Create News Schema */
var newsReportSchema = mongoose.Schema({
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Constants.reportTypes, required: true },
    status: { type: String, enum: Constants.reportStatus, default: 'None' }
}, {
        collection: 'newsreport',
        timestamps: true
    });

module.exports = mongoose.model('NewsReport', newsReportSchema);