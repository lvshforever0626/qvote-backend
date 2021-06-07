const express = require('express');
const subscriberController = require('../controllers/subscriberController');
const checkAuth = require('../../middleware/check-auth');

const router = express.Router();

router.post('', checkAuth, subscriberController.addSubscription);
router.post('/post', checkAuth, subscriberController.push);
module.exports = router;