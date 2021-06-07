const mongoose = require('mongoose');

/* Create Comment Reaction Schema */
var commentReactionSchema = mongoose.Schema({
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: 'Provide the comment ID to which this comment reaction belongs to!' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  collection: 'commentreaction',
  timestamps: true
});

module.exports = mongoose.model('CommentReaction', commentReactionSchema);
