const express = require('express');
var commentsController = require('../controllers/commentsController');
const checkAuth = require('../../middleware/check-auth');

const router = express.Router();

router.delete('/:commentId', checkAuth, commentsController.deleteComment);
router.put('/:commentId/block', checkAuth, commentsController.blockComment)
router.put('/:commentId/unblock', checkAuth, commentsController.unblockComment)
router.put('/:commentId', checkAuth, commentsController.updateComment);
router.post('/:commentId/likeunlike', checkAuth, commentsController.findActiveComment, commentsController.checkIfUserAlreadyLikedComment, commentsController.likeComment);
router.delete('/:commentId/likeunlike', checkAuth, commentsController.findActiveComment, commentsController.unlikeComment);
router.get('/:commentId/likeunlike', checkAuth, commentsController.findActiveComment, commentsController.fetchLikesCount)

module.exports = router;