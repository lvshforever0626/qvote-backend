const Users = require('../models/userModel');
const to = require('../helpers/getPromiseResult');
const GoogleStrategy = require('passport-google-oauth20');


// Strategy config
module.exports = (passport) => {
    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.API_URL}api/user/google/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
            delete profile._json['id'];
            const data = profile._json;
            data.provider = 'google';
            delete data['roles'];

            let user = await to(Users.findOne({email: data.email}));

            if (!user) {
                user = await to(Users.create(data));
            }


            done(null, user);
        }
    ));
};
