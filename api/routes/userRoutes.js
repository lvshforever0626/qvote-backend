const express = require('express');

const userController = require('../controllers/userController');
const Constants = require('../util/constants');
const checkAuth = require('../../middleware/check-auth');

const multer = require("multer");
const AWS = require('aws-sdk');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();


router.post('/signup', userController.createUser);
router.post('/login', userController.authenticateUser);
router.put('/pwd', checkAuth, userController.updatePwd);
//update profile
router.post('/details', checkAuth, upload.single("image"), userController.updateDetails);
//register with facebook
router.post('/register/facebook', userController.authenticateFB, userController.generateToken, userController.sendToken);
router.get('', checkAuth, checkAuth, userController.fetchUsers);

router.post('/forgot_password', userController.forgotPassword);
router.post('/reset_password', userController.resetPassword);

//User's news
router.get('/news', checkAuth, userController.fetchUserNews);
router.get('/news/:category', checkAuth, userController.fetchUserNewsInCategory);

//Activation & Verification
router.get('/:token/confirmation', userController.confirmActivation);
router.post('/token/resend', userController.resendActivationToken);


// Passport.js Facebook auth routes
router.get('/facebook', passport.authenticate('facebook', {session: false}));
router.get('/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/login',
    scope: ['email', 'openid', 'profile'],
    session: false
}), (req, res) => {
    const fetchedUser = req.user;

    const token = jwt.sign(
        {email: fetchedUser.email, userId: fetchedUser._id, fullname: fetchedUser.name},
        process.env.JWT_KEY,
        {expiresIn: Constants.expiresInHrs}
    );
    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);

});

// Passport.js Google auth routes
router.get('/google', passport.authenticate('google', {session: false, scope: ['profile', 'email']}));
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/login',
    scope: ['email', 'openid', 'profile'],
    session: false
}), (req, res) => {
    let fetchedUser = req.user;
    console.log('!!!!!')
    console.log(process.env.FRONTEND_URL);
    console.log('!!!!!')
    let token = jwt.sign({
        email: fetchedUser.email,
        userId: fetchedUser._id,
        fullname: fetchedUser.name
    }, 'secretkey', {expiresIn: '8h'});
    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
});


router.get('/logout', userController.socialLogout);


module.exports = router;
