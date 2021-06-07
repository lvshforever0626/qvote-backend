const mongoose = require('mongoose');
const Constants = require('../util/constants');

mongoose.set('debug', process.env.ENABLE_MONGOOSE_DEBUG);
mongoose.set('useFindAndModify', false);

/* Create News Schema */
var newsSchema = mongoose.Schema({
  // link: { type: String, index: { dropDups: true }, required: 'Kindly enter the link of the news' },
  //description: { type: String, required: 'Kindly enter the description of the news' },
  // category: { type: String, enum: Constants.categories, required: 'Kindly select the category to which the news belongs' },
  // video: { type: Boolean, default: false },
  // previewAvailable: { type: Boolean, default: false },
  image: {type: String, require: 'Kindly upload image'},
  description: {type: String, rquired: 'Kindly enter the description'},
  tags: {type: String, required: 'Kindly add tags'},
  active: { type: Boolean, default: false },
  reported: {type: Boolean, default: false},
  reportText: {type: String, default: null},
  blocked: { type: Boolean, default: false },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  questions: { type: Number, default: 0 },
  totalVotes: {type: Object, default: null},
  extractedImage: { type: String, default: 'https://s3.eu-west-2.amazonaws.com/com.nih.defaultimages/placeholder.png' },
  extractedDescription: { type: String, default: 'No description available' },
  extractedTitle: { type: String, default: 'No title available' },
  votes: mongoose.Schema.Types.Mixed,
  shares: { type: Number, default: 0 },
  voted: {type: Boolean, default: false}
}, {
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    },
    collection: 'news',
    timestamps: true
  });

// newsSchema.virtual('score').get(function () {
//   return this.shares + this.views + this.totalVotes + this.comments + (2 * this.questions)
// });

module.exports = mongoose.model('News', newsSchema);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////