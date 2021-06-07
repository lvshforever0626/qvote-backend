const mongoose = require('mongoose');
const Constants = require('../util/constants');

/* Create News Schema */
var newsVoteSchema = mongoose.Schema({
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: 'Provide the news ID to which this comment belongs' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    voteCategory: { type: String, enum: Constants.votes.values, required: true },
    object: {type: Number},
    subject: {type: Number},
    skip: {type: Boolean}
}, {
        collection: 'newsvote',
        timestamps: true
    });

module.exports = mongoose.model('NewsVote', newsVoteSchema);