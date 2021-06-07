const mongoose = require('mongoose');
const News = require('../models/newsModel');
const Comment = require('../models/commentModel');
const CommentReaction = require('../models/commentReactionModel');
const Constants = require('../util/constants');
const Logger = require('../../logger/logger');

/*
 * Fetch All Comments relatd to news item based on  the current page and page size requested
 * If  page details are not provided, it will send all the comments
 * Every query will fetch only ones that are  active and  not blocked
 * It will also return total item count to maintain  pagination on client side
 */

exports.fetchCommentsForNews = (req, res, next) => {
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const newsIdToSearch = req.params.newsId;

  const matchQuery = { newsId: mongoose.Types.ObjectId(newsIdToSearch), active: true, blocked: false };
  var query;
  if (pageSize && currentPage) {
    query = [
      { '$match': matchQuery },
      { '$sort': { createdAt: -1 } },
      { '$skip': (pageSize * (currentPage - 1)) },
      { '$limit': pageSize },
      { '$lookup': { from: 'commentreaction', localField: '_id', foreignField: 'commentId', as: 'likes' } },
      { '$project': { _id: 1, text: 1, type: 1, creator: 1, blocked: 1, createdAt: 1, updatedAt: 1, totalLikes: { $size: '$likes' } } }
    ];
  } else {
    query = [
      { '$match': matchQuery },
      { '$sort': { createdAt: -1 } },
      { '$lookup': { from: 'commentreaction', localField: '_id', foreignField: 'commentId', as: 'likes' } },
      { '$project': { _id: 1, text: 1, type: 1, creator: 1, blocked: 1, createdAt: 1, updatedAt: 1, totalLikes: { $size: '$likes' } } }
    ];
  }

  var commentsQuery = Comment.aggregate(query);
   
  commentsQuery
    .then(documents => {
      if (documents.length > 0) {
        documents.forEach(document => {
          CommentReaction.findOne({ 'commentId': document._id, 'creator': req.userData.userId })
            .then(found => {
              if (found) {
                document['userLiked'] = true;
              } else {
                document['userLiked'] = false;
              }
            });
        });
      }

      Comment.populate(documents, { path: 'creator', select:'name id' })
        .then(populatedDocuments => {
          Comment.countDocuments(matchQuery)
            .then( cnt => {
              res.status(200).json({
                message: 'Comments fetched successfully!',
                comments: populatedDocuments,
                maxComments: cnt
              });
            });
        });
    })
    .catch(error => {
      logger.LOG.error(error);
      res.status(500).json({
        message: 'Fetching comments failed!'
      });
    });
};

/*
 * Create new Comment related to a news
 * It expects text and  news ID
 * It appends  the user Id to each news item for authorization  purpose
 */
exports.addCommentToNews = (req, res, next) => {
  let newsid = req.params.newsId;
  let type = req.body.type;
  const comment = new Comment({
    text: req.body.text,
    newsId: newsid,
    type: type,
    creator: req.userData.userId
  });
  comment
    .save()
    .then(createdComment => {
      if (createdComment) {
        let updateQuery;
        if (type == Constants.commentType[0]) {
          updateQuery = { $inc: { 'comments': 1 } }
        } else {
          updateQuery = { $inc: { 'questions': 1 } }
        }
        News.findOneAndUpdate(
          { _id: newsid },
          updateQuery
        ).then(result => {
          if (result) {
            res.status(201).json({ message: type + ' added successfully' });
          } else {
            res.status(401).json({ message: 'Failed to add ' + type });
          }
        });
      } else {
        res.status(401).json({
          message: 'Failed to add comment'
        });
      }
    })
    .catch(error => {
      Logger.LOG.error('Error in adding comment' + error);
      res.status(500).json({
        message: 'Adding comment failed!'
      });
    });
};

exports.deleteComment = (req, res, next) => {
  Comment.findOneAndUpdate(
    { _id: req.params.commentId, creator: req.userData.userId, active: true },
    {
      $set: { 'active': false }
    })
    .then(result => {
      if (result) {
        res.status(200).json({ message: 'Comment Deletion successful!' });
      } else {
        res.status(401).json({ messag: 'Comment is not available to delete' });
      }
    })
    .catch(error => {
      Logger.LOG.error('Error in deleting comment ' + error);
      res.status(500).json({ message: 'Failed to delete comment!'});
  });
};

exports.blockComment = async (req, res, next) => {
  try {
    Comment.findOneAndUpdate(
      { _id: req.params.commentId, creator: req.userData.userId, blocked: false },
      {
        $set: { 'blocked': true }
      })
      .then(result => {
        if (result) {
          res.status(200).json({ message: 'Comment blocked successfuly!' });
        } else {
          res.status(401).json({ messag: 'Comment is not available to block' });
        }
      })
  } catch (error) {
    Logger.LOG.error('Error in blocking comment ' + error);
    res.status(500).json({ message: 'Failed to block comment!' });
  }
}

exports.unblockComment = async (req, res, next) => {
  try {
    Comment.findOneAndUpdate(
      { _id: req.params.commentId, creator: req.userData.userId, blocked: true },
      {
        $set: { 'blocked': false }
      })
      .then(result => {
        if (result) {
          res.status(200).json({ message: 'Comment unblocked successfuly!' });
        } else {
          res.status(401).json({ messag: 'Comment is not available to unblock' });
        }
      })
  } catch (error) {
    Logger.LOG.error('Error in unblocking comment ' + error);
    res.status(500).json({ message: 'Failed to unblock comment!' });
  }
}

exports.updateComment = (req, res, next) => {
  Comment.findOneAndUpdate(
      { _id: req.params.commentId, active: true },
      { $set: { 'text': req.body.text }}
    )
    .then(comment => {
      if (comment) {
        // req.updatedComment = comment;
        // next();
        res.status(200).json({
          message: 'Comment updated successfully'
        });
      } else {
        res.status(401).json({
          message: 'The comment you are trying to update is not available!!'
        })
      }
    })
    .catch(error => {
      Logger.LOG.error('Error in updating comment ' + error);
      res.status(500).json({ message: 'Failed to update comment!'});
  });
};

exports.updateNewsWithModifiedComment = (req, res, next) => {
  let newsId = req.updatedComment.newsId;
  let comment = req.updatedComment;
  Logger.LOG.error(comment);
  News.findOneAndUpdate({ _id: newsId, 'comments._id': comment._id },
    { $set: { 'comments.$.text': comment.text } }
  ).then(news => {
    if (news) {
      res.status(200).json({
        message: 'Comment updated successfully'
      });
    } else {
      res.status(401).json({
        message: 'Could not find the comment that you want to update!'
      });
    }
  }).catch(error => {
    Logger.LOG.error('Error in updating comment' + error);
    res.status(500).json({
      message: 'Updating comment failed!'
    });
  });
}

exports.likeComment = async (req, res, next) => {
  const commentReaction = new CommentReaction({
    commentId: req.params.commentId,
    creator: req.userData.userId
  });

  try {
    let savedCommentReaction = await commentReaction.save();
    res.status(201).json({
      message: 'Comment Liked successfully'
    });
  } catch (error) {
    Logger.LOG.error('Error in liking comment' + error);
    res.status(500).json({
      message: 'Failed to like the comment! ' + error
    });
  }
}

exports.unlikeComment = (req, res, next) => {
  CommentReaction.findOneAndDelete({ commentId: req.params.commentId, creator: req.userData.userId })
    .then(doc => {
      if (doc) {
        res.status(200).json({ message: 'Unlike comment successful!' });
      } else {
        res.status(500).json({ message: 'Failed to unlike the comment or comment ID was not liked by the user earlier'});
      }
  })
}

exports.fetchLikesCount = (req, res, next) => {
  CommentReaction.count({ commentId: req.params.commentId })
    .then(count => {
      res.status(200).json({
        message: 'Successfully fetched count of likes for a comment',
        likesCount: count
      });
    })
    .catch(err => {
      res.send(error);
  })
}

exports.findActiveComment = (req, res, next) => {
  let commentid = req.params.commentId
  Comment.findOne({ 'active': true, 'blocked': false, _id: commentid })
    .then(result => {
      req.validComment = { valid: true, comment: result };
      next();
    }).catch(error => {
      Logger.LOG.error('Error in finding the comment that you want to like');
      res.status(400).json({ message: 'Improper Comment ID!' });
    })
}

exports.checkIfUserAlreadyLikedComment = (req, res, next) => {
  let commentid = req.params.commentId
  let userid = req.userData.userId
  CommentReaction.findOne({ commentId: commentid, creator: userid })
    .then(result => {
      if (result == null) {
        next();
      } else {
        res.status(400).json({ message: 'Improper Comment ID or user already liked the comment!' });

        // //Current Code
        // result.remove(error => {
        //   if (error) {
        //     res.status(400).json({ message: 'Improper Comment ID or user already liked the comment!' });
        //   } else {
        //     res.status(200).json({ message: 'Unlike comment successful!' });
        //   }
        // });
      }
    }).catch(error => {
      Logger.LOG.error(error);
      res.status(400).json({ message: 'Improper Comment ID or user already liked the comment!' });
    })
}