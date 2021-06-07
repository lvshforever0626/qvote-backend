const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var crypto = require('crypto');
var passport = require('passport');
const Constants = require('../util/constants');
const Logger = require('../../logger/logger');


const multer = require("multer");
const AWS = require('aws-sdk');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const User = require('../models/userModel');
const News = require('../models/newsModel');
const Token = require('../models/tokenModel');
const ResetToken = require('../models/resetTokenModel');
const Util = require('../util/util');
const EmailTemplate = require('../util/emailTemplate');

exports.createUser = async (req, res, next) => {
    let name = req.body.name;
    let pwd = req.body.password;
    let email = req.body.email;

    if (!name || name.length < 2 || !pwd || !Util.validatePassword(pwd) || !email || !Util.validateEmail(email)) {
        return res.status(500).json({
            message: 'Email, Password & Name must be valid'
        });
    }

    try {
        let hash = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hash,
            provider: 'email'
        });

        User.findOne({email: email, active: true, blocked: false}, function (err, doc) {
            if (!doc) {
                saveUser(user, res);
            } else if (doc.isVerified) {
                res.status(200).send({message: 'The account has been verified. Please log in.'});
            } else {
                doc.remove({}, function (err, result) {
                    if (err) {
                        res.status(500).json({
                            message: 'Cant create the account with credentials provided!'
                        });
                    } else {
                        saveUser(user, res);
                    }
                })
            }
        });
    } catch (err) {
        Logger.LOG.error(err);
        res.status(500).json({
            message: 'Cant create the account with credentials provided!'
        });
    }
}

exports.authenticateUser = async (req, res, next) => {
    let pwd = req.body.password;
    let email = req.body.email;
    try {
        if (!pwd || !email || !Util.validateEmail(email)) {
            return res.status(500).json({
                message: 'Invalid credentials!'
            });
        }

        let fetchedUser = await User.findOne({email: email, active: true, blocked: false});
        console.log(fetchedUser);
        if (!fetchedUser) {
            return res.status(401).json({
                message: 'Invalid credentials or user is blocked.!'
            });
        }

        if (!fetchedUser.isVerified) {
            return res.status(401).send({
                message: 'Your account has not been verified.'
            });
        }

        let result = await bcrypt.compare(pwd, fetchedUser.password);
        if (!result) {
            return res.status(401).json({
                message: 'Invalid credentials!'
            });
        }
        const token = jwt.sign(
            {email: fetchedUser.email, userId: fetchedUser._id},
            process.env.JWT_KEY,
            {expiresIn: Constants.expiresInHrs}
        );

        res.status(200).json({
            message: 'Successful',
            token: token,
            expiresIn: Constants.expiresInMins,
            userId: fetchedUser._id,
            roles: fetchedUser.roles,
            fullname: fetchedUser.name,
            email: fetchedUser.email,
            image: fetchedUser.image
        });
    } catch (err) {
        Logger.LOG.error(err);
        return res.status(401).json({
            message: 'Invalid credentials!'
        });
    }
}

exports.fetchUsers = (req, res, next) => {

}

/*
 * Fetch All News Items  based on  the current page and page size requested
 * If  page details are not provided, it will send all the news items
 * Every query will fetch only ones that are  active and  not blocked
 * It will also return total item count to maintain  pagination on client side
 */

exports.fetchUserNews = (req, res, next) => {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const newsQuery = News.find({
        'active': true,
        'blocked': false,
        'creator': req.userData.userId
    }, '-active -blocked -__v');
    if (pageSize && currentPage) {
        newsQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
    }
    newsQuery
        .then(documents => {
            res.status(200).json({
                message: 'News fetched successfully!',
                news: documents,
                maxNews: documents.length
            });
        })
        .catch(error => {
            res.status(500).json({
                message: 'Fetching news failed!'
            });
        });
};

/*
 * Fetch News Items in a category based on  the current page and page size requested
 * If  page details are not provided, it will send all the news items
 * Every query will fetch only ones that are  active and  not blocked
 * It will also return total item count to maintain  pagination on client side
 */

exports.fetchUserNewsInCategory = (req, res, next) => {
    const pageSize = +req.query.pagesize;
    const currentPage = +req.query.page;
    const categoryName = req.params.category;
    const newsQuery = News.find({
        'active': true,
        'blocked': false,
        'category': categoryName,
        'creator': req.userData.userId
    }, '-active -blocked -__v');
    if (pageSize && currentPage) {
        newsQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
    }
    newsQuery
        .then(documents => {
            res.status(200).json({
                message: 'News in category ' + categoryName + ' fetched successfully!',
                news: documents,
                maxNews: documents.length
            });
        })
        .catch(error => {
            res.status(500).json({
                message: 'Fetching news failed!'
            });
        });
};

exports.confirmActivation = async (req, res, next) => {
    let receivedToken = req.params.token;

    if (!receivedToken || receivedToken.length < 32) {
        return res.status(500).json({
            message: 'Invalid details sent in confirming your email. Contact Administrator.'
        });
    }

    try {
        Token.findOne({token: receivedToken})
            .then(token => {
                if (!token) {
                    return res.status(400).send({message: 'We were unable to find a valid token. Your token may have expired.'});
                }

                // If we found a token, find a matching user
                User.findOne({_id: token.userId, active: true, blocked: false}, function (err, user) {
                    if (!user) {
                        return res.status(400).send({message: 'We were unable to find a user for this token.'});
                    }

                    if (user.isVerified) {
                        return res.status(400).send({message: 'This user has already been verified.'});
                    }

                    // Verify and save the user
                    user.isVerified = true;
                    user.save(function (err) {
                        if (err) {
                            return res.status(500).send({message: err.message});
                        }

                        Token.deleteOne({token: receivedToken})
                            .then(result => {
                                res.status(200).send({message: 'The account has been verified. Please log in.'});
                            });
                    });
                });
            })
    } catch (error) {
        Logger.LOG.error('Failed to update details');
        res.status(500).json({
            message: 'Failed to confirm token!'
        });
    }
}

exports.updateDetails = async (req, res, next) => {
    try {
        let uploadFile = await uploadImage(req);
        let name = req.body.name;
        let email = req.body.email;
        let image = uploadFile.fileLink;

        if (!name || name.length < 2 || !email || !Util.validateEmail(email)) {
            return res.status(500).json({
                message: 'Email, Password & Name must be valid'
            });
        }
        User.findOne({_id: req.userData.userId, active: true, blocked: false})
            .then(user => {
                if (!user) {
                    return res.status(400).send({message: 'We were unable to find a user who is updating the details'});
                }

                user.name = name;
                user.email = email;
                user.image = image;

                if (user.email != email) {
                    user.isVerified = false;
                    saveUser(user, res);
                } else {
                    user.save();
                    res.status(200).json({message: 'Update successful!'});
                }
            });
    } catch (error) {
        Logger.LOG.error('Failed to update details');
        res.status(500).json({
            message: 'Failed to update details!'
        });
    }
}

exports.updatePwd = async (req, res, next) => {
    try {
        let currentPassword = req.body.current_password;
        let newPassword = req.body.new_password;

        if (!currentPassword || !newPassword || !Util.validatePassword(newPassword)) {
            return res.status(500).json({
                message: 'Some details are invalid'
            });
        }

        let newPwdHash = await bcrypt.hash(newPassword, 10);
        let user = await User.findOne({_id: req.userData.userId, active: true, blocked: false}).exec();
        if (!user) {
            res.status(400).json({message: 'The user doesn\'t exist'});
        }

        let result = await bcrypt.compare(currentPassword, user.password);
        if (result) {
            user.password = newPwdHash
            let saved = await user.save();
            res.status(200).json({message: 'Update successful!'});
        } else {
            res.status(500).json({
                message: 'Failed to update password!'
            });
        }
    } catch (error) {
        Logger.LOG.error('Failed to update password');
        res.status(500).json({
            message: 'Failed to update password!'
        });
    }
}

exports.resendActivationToken = (req, res, next) => {
    let email = req.body.email;

    if (!name || name.length < 2 || !pwd || !Util.validatePassword(pwd) || !email || !Util.validateEmail(email)) {
        return res.status(500).json({
            message: 'Email is not valid'
        });
    }

    User.findOne({email: req.body.email, active: true, blocked: false}, function (err, user) {
        if (!user) {
            return res.status(400).send({message: 'We were unable to find a user with that email or your account is inactive'});
        }

        if (user.isVerified) {
            return res.status(400).send({message: 'This account has already been verified. Please log in.'});
        }

        // Create a verification token, save it, and send email
        var token = new Token({userId: user._id, token: crypto.randomBytes(16).toString('hex')});

        // Save the token
        token.save(function (err) {
            if (err) {
                return res.status(500).send({message: err.message});
            }

            // Send the email
            var msg = {
                from: 'no-reply@nottheheadlines.com',
                to: user.email,
                subject: 'Not The Headlines - Account Verification - Reg',
                dynamic_template_data: {
                    fullname: user.name,
                    activation_link: process.env.FRONTEND_URL + '\/auth\/account-activation\/' + token.token
                },
                template_id: "d-712819aa5639482599d993c576f9ba5f"
            };
            Util.sendEmail(res, msg, 'A verification email has been sent to ' + user.email, 'Failed to resend token');
        });
    });
}

exports.resetPassword = async (req, res, next) => {
    let pwd = req.body.newPassword
    if (!pwd || !Util.validatePassword(pwd)) {
        return res.status(500).json({
            message: 'Some details are invalid'
        });
    }
    let hash = await bcrypt.hash(pwd, 10);

    try {
        ResetToken.findOne({
            token: req.body.token
        })
            .then(token => {
                if (!token) {
                    return res.status(400).send({
                        message: 'Password reset token is invalid or has expired.'
                    });
                }

                User.findOne({_id: token.userId, isVerified: true, active: true, blocked: false})
                    .then(user => {
                        if (!user) {
                            return res.status(400).send({
                                message: 'Your account is not verified or blocked.'
                            });
                        }
                        user.password = hash;
                        user.save();

                        var mailMessage = {
                            from: 'no-reply@nottheheadlines.com',
                            to: user.email,
                            subject: 'Password Reset Confirmation',
                            text: 'Hello,\n\n' + 'Your password has been successful reset, you can now login with your new password.'
                        };
                        Util.sendEmail(res, mailMessage, 'A confirmation email has been sent to ' + user.email, 'Failed to reset password');
                    });
            });
    } catch (error) {
        Logger.LOG.error('Password Resetting error: ' + error);
        return res.status(400).send({
            message: 'Problem in resetting password. Try again.'
        });
    }
}

exports.forgotPassword = async (req, res, next) => {
    try {
        User.findOne({email: req.body.email, isVerified: true, active: true, blocked: false})
            .then(user => {
                if (!user) {
                    return res.status(200).send({message: 'If email id you sent is in our records, verified and active, we\'ll send an email to you to reset your password'});
                }

                ResetToken.deleteMany({userId: user._id}).exec();

                let randomHexToken = crypto.randomBytes(20).toString('hex');
                const resetToken = new ResetToken({
                    userId: user._id,
                    token: randomHexToken
                });
                resetToken.save();

                var msg = {
                    from: 'no-reply@nottheheadlines.com',
                    to: user.email,
                    subject: 'Password help has arrived! - Reg',
                    dynamic_template_data: {
                        fullname: user.name,
                        forgot_password_link: process.env.FRONTEND_URL + '\/auth\/forgot-password\/' + randomHexToken
                    },
                    template_id: "d-365c43db017f4587a41f055e14f4ff48"
                };

                Util.sendEmail(res, msg, 'A verification email has been sent to ' + user.email, 'Failed to resend token');
            })
    } catch (error) {
        Logger.LOG.error('Forgot password: User not found');
        return res.status(401).send({message: 'User associated with email not found'});
    }
}

exports.authenticateFB = async (req, res, next) => {
    // try {
    passport.authenticate('facebook-token', {session: false}), function (req, res, next) {
        if (!req.user) {
            return res.send(401, 'User Not Authenticated');
        }
        // prepare token for API
        req.auth = {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name
        };
        next();
    }
}

var createToken = function (auth) {
    return jwt.sign(
        {email: auth.email, userId: auth.id},
        process.env.JWT_KEY,
        {expiresIn: Constants.expiresInHrs}
    );
};

exports.generateToken = async (req, res, next) => {
    req.token = createToken(req.auth);
    next();
};

exports.sendToken = async (req, res) => {
    // res.setHeader('x-auth-token', req.token);
    // res.status(200).send(req.auth);
    res.status(200).json({
        message: 'Successful',
        token: req.token,
        expiresIn: Constants.expiresInMins,
        userId: req.auth.id,
        fullname: req.auth.name
    });
};


exports.socialLogout = (req, res) => {
    req.logout();
    res.status(200).json({msg: 'OK'})
};

async function uploadImage (req) {

    return new Promise((resolve, reject) => {
      try {
          const file = req.file;
          const s3FileURL = process.env.AWS_Uploaded_File_URL_LINK;
          let s3bucket = new AWS.S3({
            accessKeyId: process.env.A_ACCESS_KEY,
            secretAccessKey: process.env.A_SECRET,
            region: process.env.A_REGION
          });
                
          var params = {
            Bucket: process.env.S3_BUCKET,
            Key: Date.now().toString() + file.originalname,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read"
          };
                
          s3bucket.upload(params, function(error, data) {
            if (error) {
                reject(error);
            } else {
                var newFileUploaded = {
                  description: req.body.description,
                  fileLink: s3FileURL + params.Key,
                  s3_key: params.Key
                };
              resolve(newFileUploaded);
            }
          });
        } catch(error) {
          reject(error);
            // Logger.LOG.error('Error in uploading image: ' + error);
            // res.status(400).json({ message: 'failed upload image' });
        }
    })
}

const saveUser = async (user, res) => {
    try {
        let result = await user.save();
        const token = new Token({userId: result._id, token: crypto.randomBytes(16).toString('hex')});
        token.save();
        const link = `${process.env.FRONTEND_URL}/verify-email/${token.token}`;
        const msgBody = EmailTemplate(user.name, link);

        const params = {
            Destination: {
                CcAddresses: [
                    user.email
                    ],
                ToAddresses: [
                    user.email
                ],
            },
            Message: {
            Body: {
                Html: {
                Charset: "UTF-8",
                Data: msgBody,
                },
                Text: {
                Charset: "UTF-8",
                Data: "TEXT_FORMAT_BODY",
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Activate Your Account",
            },
            },
            Source: `${process.env.MAIL_FROM_ADDRESS}`, // SENDER_ADDRESS
            ReplyToAddresses: [
                `${process.env.MAIL_FROM_ADDRESS}`
            ],
        };

        Util.sendAWSEmail(res, params, 'A verification email has been sent to ' + user.email, 'Failed to send activation email.!!' )
    } catch (err) {
        Logger.LOG.error(err);
        res.status(500).json({
            message: 'Cant create the account with credentials provided!'
        });
    }
}