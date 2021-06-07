const Users = require('../models/userModel');
const FacebookStrategy = require('passport-facebook').Strategy;
const to = require('../helpers/getPromiseResult');

// Strategy config
module.exports = (passport) => {
    passport.use(new FacebookStrategy({
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: `${process.env.API_URL}api/user/facebook/callback`,
            profileFields: ['id', 'emails', 'name']
        },
        async (accessToken, refreshToken, profile, cb) => {

            const data = profile._json;
            data.name = data.first_name + ' ' + data.last_name;
            data.provider = 'facebook';
            delete data['id'];
            delete data['first_name'];
            delete data['last_name'];

            let user = await to(Users.findOne({email: data.email}));

            if (!user) {
                user = await to(Users.create(data));
            }

            cb(null, user);


        }
    ));
};
