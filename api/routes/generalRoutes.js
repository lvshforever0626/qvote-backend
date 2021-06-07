const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const reportController = require('../controllers/reportController');
const newsController = require('../controllers/newsController');
const commentReportController = require('../controllers/commentReportController');
const checkAuth = require('../../middleware/check-auth');

const router = express.Router();

router.post('/feedback', feedbackController.createFeedbackEntry);
router.post('/reports', checkAuth, newsController.findActiveNews, reportController.createReport);
router.get('/reports', checkAuth, reportController.fetchReports);
router.put('/reports/:reportId', checkAuth, reportController.updateReport);
router.post('/commentReports', checkAuth, commentReportController.createReport)
router.get('/commentReports', checkAuth, commentReportController.fetchReports);
router.put('/commentReports/:reportId', checkAuth, commentReportController.updateReport);

module.exports = router;