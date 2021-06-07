const mongoose = require('mongoose');
const Constants = require('../util/constants');

/* Create News Schema */
var commentReportSchema = mongoose.Schema({
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Constants.reportTypes, required: true },
    status: { type: String, enum: Constants.reportStatus, default: 'None' }
}, {
    collection: 'commentreport',
    timestamps: true
});

module.exports = mongoose.model('CommentReport', commentReportSchema);