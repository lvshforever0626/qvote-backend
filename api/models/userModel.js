const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Constants = require('../util/constants');
const Logger = require('../../logger/logger');

const userSchema = mongoose.Schema({
  name: { type: String, trim: true, required: true },
  email: { type: String, trim: true, required: true, unique: true, lowercase: true },
  password: { type: String },
  provider: { type: String, required: true },
  providerId: { type: String },
  roles: { type: Array, default: 'User' },
  isVerified: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  blocked: { type: Boolean, default: false },
  image: {type: String, default: null},
  facebookProvider: {
    type: {
      id: String,
      token: String
    },
    select: false
  }
}, {
    collection: 'user',
    timestamps: true
  });

// userSchema.plugin(uniqueValidator);

// userSchema.statics.upsertFbUser = function (accessToken, refreshToken, profile, cb) {
//   var that = this;
//   return this.findOne({
//     'facebookProvider.id': profile.id
//   }, function (err, user) {
//     // no user was found, lets create a new one
//     if (!user) {
//       var newUser = new that({
//         fullName: profile.displayName,
//         email: profile.emails[0].value,
//         facebookProvider: {
//           id: profile.id,
//           token: accessToken
//         }
//       });

//       newUser.save(function (error, savedUser) {
//         if (error) {
//           Logger.LOG.error(error);
//         }
//         return cb(error, savedUser);
//       });
//     } else {
//       return cb(err, user);
//     }
//   });
// };

module.exports = mongoose.model('User', userSchema);