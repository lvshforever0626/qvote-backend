const express = require('express');
var newsController = require('../controllers/newsController');
var newsVoteController = require('../controllers/newsVoteController');
var commentsController = require('../controllers/commentsController');

const multer = require("multer");
const AWS = require('aws-sdk');
// const upload = require('../multer/multerController');
// const singleUpload = upload.single('image');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const checkAuth = require('../../middleware/check-auth');
const extractFile = require('../../middleware/file');

const router = express.Router();


//Create News
router.post('', upload.single("image"), newsController.createNews);
//Fetch News
router.get('', newsController.fetchAllNews);
//Votes
router.get('/user/:type', checkAuth, newsController.fetchAllUserNews);
router.post('/:newsId/vote', checkAuth, newsVoteController.validateVoteAndInsert, newsController.updateVotes);
router.post('/:newsId/report', checkAuth, newsController.updateReport);
// router.post('/:newsId/vote', checkAuth, newsController.findActiveNews, newsVoteController.validateVoteAndInsert, newsController.updateVotesCountForNews, newsController.updateVoteCategoriesForNews);
//Fetch News and user voted details
//Fetch one news item details
router.get('/:newsId', newsController.fetchNewsItem);
//Fetch one news item details and user voted details
router.get('/:newsId/votedetails', checkAuth, newsController.fetchNewsItemsWithVotes);
//Update news
// router.put('/:newsId', checkAuth, newsController.findActiveNews, newsController.updateNews);
router.post('/:newsId', checkAuth, upload.single("image"), newsController.updateNews);
//Delete news
router.delete('/:newsId', checkAuth, newsController.deleteNews);
//Block or Unblock news
router.put('/:newsId/block', checkAuth, newsController.blockNews);

//Admin APIs
router.get('/admin/:status', checkAuth, newsController.fetchBlockedNews);
router.get('/admin/update/:newsId', checkAuth, newsController.updateActiveNews);
router.delete('/admin/:newsId', checkAuth, newsController.removeNews);
//Fetch News in category

router.get('/category/:category', newsController.fetchNewsInCategory);
//Fetch News in category along with user voted details
router.get('/user/voted/category/:category', checkAuth, newsController.fetchNewsInCategory);
//Fetch news in category and filter based on vote
router.get('/category/:category/vote/:vote', newsController.fetchNewsInCategoryAndFilterVotes);
//Fetch news in category and filter based on vote along with user voted details
router.get('/user/voted/category/:category/vote/:vote', checkAuth, newsController.fetchNewsInCategoryAndFilterVotes);

//Update Views
router.post('/:newsId/views', newsController.findActiveNews, newsController.updateViewCount);
router.get('/:newsId/views', newsController.fetchViewCount);


//Votes
// router.post('/:newsId/vote', checkAuth, newsController.findActiveNews, newsVoteController.validateVoteAndInsert, newsController.updateVotesCountForNews, newsController.updateVoteCategoriesForNews);
router.get('/:newsId/vote', checkAuth, newsController.findActiveNews, newsVoteController.fetchVotesForNews);

//Get comments for news & Post Comment for the news
router.get('/:newsId/comments', checkAuth, commentsController.fetchCommentsForNews);
router.post('/:newsId/comment', checkAuth, newsController.findActiveNews, commentsController.addCommentToNews);

//Share
router.post('/:newsId/shares/:medium', checkAuth, newsController.findActiveNews, newsController.updateShareForNews);
router.get('/:newsId/shares', checkAuth, newsController.fetchSharesForNews);
module.exports = router;