const express = require('express');
const highlightsController = require('../controllers/highlightsController');
const checkAuth = require('../../middleware/check-auth');

const router = express.Router();

router.get('/:category', highlightsController.fetchHighlights);
router.post('/:category', highlightsController.prepareHighlights, /*highlightsController.checkDocumentsLength, */ highlightsController.insertHighlights);

module.exports = router;