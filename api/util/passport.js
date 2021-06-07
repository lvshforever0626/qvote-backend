'use strict';

var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var User = require('../models/userModel');

module.exports = function () {
    passport.use(new FacebookTokenStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET
    },
        function (accessToken, refreshToken, profile, done) {
            User.upsertFbUser(accessToken, refreshToken, profile, function (err, user) {
                return done(err, user);
            });
        }));

};