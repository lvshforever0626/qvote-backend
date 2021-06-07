//Framework imports
require('dotenv').config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

//Routes imports
const userRoutes = require('./api/routes/userRoutes');
const newsRoutes = require('./api/routes/newsRoutes');
const commentsRoutes = require('./api/routes/commentsRoutes');
const subscribeRoutes = require('./api/routes/subscriberRoutes')
const generalRoutes = require('./api/routes/generalRoutes');
const highlightsRoutes = require('./api/routes/highlightsRoutes');

//Util
//const Util = require('../util/util');
const Util = require('./api/util/util');

var passportConfig = require('./api/util/passport');

passportConfig();
//Variables
const app = express();
// const uri = "mongodb+srv://andrei:DevWork1234@cluster0.itoca.mongodb.net/news?retryWrites=true&w=majority";

mongoose.connect(process.env.MONGO_DB_SERVER, {
    useCreateIndex: true,
    useNewUrlParser: true
});

// mongoose.connect(uri, {
//     useCreateIndex: true,
//     useNewUrlParser: true
// });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/images', express.static(path.join('images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, PUT, DELETE, OPTIONS'
    );
    next();
});

// app.all("/", (req, res) => {
//     res.redirect(301, "https://qvote.physix.world");
// });

//Intialize sgMail
Util.initialize();


// Passport.js config
const passport = require('passport');
require('./api/config/facebook-passport-strategy')(passport);
require('./api/config/google-passport-strategy')(passport);
app.use(passport.initialize({}));

process.on('uncaughtException', function(err) {
    console.log(err.stack);
    throw err;
  });

//Use the routes
// app.use(function(req, res, next) {
//     req.getUrl = function() {
//       return req.protocol + "://" + req.get('host') + req.originalUrl;
//     }
//     console.log(req.getUrl());
//   });
app.use('/api/user', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/subscribe', subscribeRoutes);
// app.use('/api/push', push);
app.use('/api/general', generalRoutes);
app.use('/api/highlights', highlightsRoutes);
module.exports = app;
