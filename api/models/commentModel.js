const mongoose = require('mongoose');
const Constants = require('../util/constants');

/* Create Comment Schema */
var commentSchema = mongoose.Schema({
  text: { type: String, required: 'Kindly enter the comment text'},
  newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: 'Provide the news ID to which this comment belongs' },
  type: { type: String, enum: Constants.commentType, required: true },
  active: { type: Boolean, default: true},
  blocked: { type: Boolean, default: false },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    collection: 'comment',
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);
