const mongoose = require('mongoose');
const News = require('../models/newsModel');
const NewsVote = require('../models/newsVoteModel');
const NewsView = require('../models/newsViewModel')
const NewsShare = require('../models/newsShareModel');
let grabity = require('grabity');
const Constants = require('../util/constants');
var ObjectId = require('mongoose').Types.ObjectId;
const Logger = require('../../logger/logger');

const multer = require("multer");
const AWS = require('aws-sdk');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/* 
 * Fetch All News Items  based on  the current page and page size requested
 * If  page details are not provided, it will send all the news items
 * Every query will fetch only ones that are  active and  not blocked
 * It will also return total item count to maintain  pagination on client side
 */

exports.createNews = async (req, res, next) => {
  try {
    let uploadFile = await uploadImage(req, res);
    let voteArray = new Array(24).fill(0);
    const news = new News({
      image: uploadFile.fileLink,
      createDate: new Date(),
      creator: req.body.creator,
      description: req.body.description,
      tags: req.body.tags,
      totalVotes: {
        object: voteArray,
        subject: voteArray
      }
    });

    await news.save();
    res.status(201).json({
      message: 'News added successfully'
    });
    // fetchPreview(link, savedNews._id)
    
  } catch (err) {
    Logger.LOG.error('Error in  creating news' + err);
    if (err.code === 11000) {
      res.status(403).json({
        message: 'This link already exists!!'
      })
    } else {
      res.status(500).json({
        message: 'Creating a news failed! ' + err
      });
    }
  }
};

async function uploadImage (req, res) {

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
              console.log(error);
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

exports.fetchAllNews = async (req, res, next) => {
  const pageSize = req.query.pagesize;
  const currentPage = req.query.page;
  const matchQuery = {'active': true, 'blocked': false, 'reported': false, };

  sortQuery = { '$sort': { createdAt: -1 } };
  var query;
  if (pageSize && currentPage) {
    const pg = parseInt(pageSize);
    const cpg = parseInt(currentPage);
    query = [
      { '$match': matchQuery },
      sortQuery,
      { '$skip': (pg * (cpg - 1)) },
      { '$limit': pg },
    ];
  } else {
    query = [
      { '$match': matchQuery },
      Constants.scoreField,
      sortQuery,
      Constants.newsResponse
    ];
  }

  executeFetchNewsQuery(req, res, next, matchQuery, query)
}

exports.fetchAllUserNews = async (req, res, next) => {
  const pageSize = req.query.pagesize;
  const currentPage = req.query.page;
  const userId = req.userData.userId;
  const type = req.params.type;

  let matchQuery;
  if(type !== 'myposts') {
    matchQuery = {'creator': {$ne: new mongoose.Types.ObjectId(userId)}, 'active': true, 'blocked': false, 'reported': false, };
  } else {
    matchQuery = {'creator': new mongoose.Types.ObjectId(userId), 'active': true, 'blocked': false, 'reported': false,  };
  }
  sortQuery = { '$sort': { createdAt: -1 } };
  var query;
  if (pageSize && currentPage) {
    const pg = parseInt(pageSize);
    const cpg = parseInt(currentPage);
    query = [
      { '$match': matchQuery },
      sortQuery,
      { '$skip': (pg * (cpg - 1)) },
      { '$limit': pg },
    ];
  } else {
    query = [
      { '$match': matchQuery },
      Constants.scoreField,
      sortQuery,
      Constants.newsResponse
    ];
  }

  executeFetchNewsQuery(req, res, next, matchQuery, query, type)
}

exports.updateVotes = async (req, res, next) => {

  let newsid = req.body.id;
  let userid = req.body.creator;
  let subjectIndex = req.body.subject;
  let objectIndex = req.body.object;
  let skip = req.body.skip;

  const result = await News.find({_id: newsid}).exec();
  const object = result[0].totalVotes.object.map((i, index) => index === objectIndex ? i +1 : i );
  const subject = result[0].totalVotes.subject.map((i,index) => index === subjectIndex ? i +1 : i );
  const newTotalVotes = {
    object: object,
    subject: subject
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true };

  News.findOneAndUpdate({_id: newsid}, {totalVotes: newTotalVotes, skip: skip, voted: true}, options)
  .then(result => {
    res.status(200).json({ message: 'Voted Successfully!' });
  })
  .catch(error => {
    res.status(400).json({ message: 'Invalid details sent!!' });
  });
}

exports.updateReport = async (req, res, next) => {
  let newsid = req.params.newsId
  let reportData = req.body.report;

  const options = { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true };

  News.findOneAndUpdate({_id: newsid}, {reported: true, reportText: reportData}, options)
  .then(result => {
    console.log(result);
    res.status(200).json({ message: 'Reported Successfully!' });
  })
  .catch(error => {
    res.status(400).json({ message: 'Invalid details sent!!' });
  });
}

exports.fetchBlockedNews = async (req, res, next) => {
  const status = req.params.status;
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  let newsQuery;
  if(status === 'blocked') {
    newsQuery = News.find({ 'blocked': true });
  } else if(status === 'inactive') {
    newsQuery = News.find({ 'active': false });
  } else if (status === 'reported') {
    newsQuery = News.find({ 'reported': true });
  }
  if (pageSize && currentPage) {
    newsQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
  }

  newsQuery
    .sort({ createdAt: -1 })
    .then(documents => {
      News.populate(documents, { path: 'creator', select: 'name email image' })
        .then(populatedDocuments => {
              res.status(200).json({
                message: 'Blocked News fetched successfully!',
                news: populatedDocuments,
              });
        });
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching blocked news failed!'
      });
    });
}

/* 
 * Fetch News Items in a category based on  the current page and page size requested
 * If  page details are not provided, it will send all the news items
 * Every query will fetch only ones that are  active and  not blocked
 * It will also return total item count to maintain  pagination on client side
 */

exports.fetchNewsInCategory = async (req, res, next) => {
  const pageSize = req.query.pagesize;
  const currentPage = req.query.page;
  const categoryName = req.params.category;
  const filter = req.query.filter;
  const matchQuery = { 'active': true, 'blocked': false, 'category': categoryName };

  let sortQuery;

  if (filter != null && filter == 'Score') {
    sortQuery = { '$sort': { score: -1, createdAt: -1 } };
  } else {
    sortQuery = { '$sort': { createdAt: -1 } };
  }

  var query;
  if (pageSize && currentPage) {
    const pg = parseInt(pageSize);
    const cpg = parseInt(currentPage);
    query = [
      { '$match': matchQuery },
      Constants.scoreField,
      sortQuery,
      { '$skip': (pg * (cpg - 1)) },
      { '$limit': pg },
      //{ '$lookup': { from: 'newsvote', localField: '_id', foreignField: 'newsId', as: 'votes' } },
      Constants.newsResponse
    ];
  } else {
    query = [
      { '$match': matchQuery },
      Constants.scoreField,
      sortQuery,
      //{ '$lookup': { from: 'newsvote', localField: '_id', foreignField: 'newsId', as: 'votes' } },
      Constants.newsResponse
    ];
  }
  executeFetchNewsQuery(req, res, next, matchQuery, query);
};


exports.fetchNewsInCategoryAndFilterVotes = async (req, res, next) => {
  const pageSize = req.query.pagesize;
  const currentPage = req.query.page;
  const filter = req.query.filter;
  const categoryName = req.params.category ? req.params.category : 'Influence';
  const voteFilter = req.params.vote;

  const matchQuery = { 'active': true, 'blocked': false, 'category': categoryName };
  let sortQuery;

  if (filter != null && filter == 'Score') {
    sortQuery = { '$sort': { score: -1, createdAt: -1  } };
  } else {
    sortQuery = { '$sort': { createdAt: -1 } };
  }

  var query;
  if (pageSize && currentPage) {
    const pg = parseInt(pageSize);
    const cpg = parseInt(currentPage);
    query = [
      { '$match': matchQuery },
      Constants.scoreField,
      sortQuery,
      { '$skip': pg * (cpg - 1) },
      { '$limit': pg },
      { '$lookup': { from: 'newsvote', localField: '_id', foreignField: 'newsId', as: 'votestofilter' } },
      { '$match': { 'votestofilter.voteCategory': voteFilter } },
      Constants.newsResponse
    ];
  } else {
    query = [
      { '$match': matchQuery },
      Constants.scoreField,
      sortQuery,
      { '$lookup': { from: 'newsvote', localField: '_id', foreignField: 'newsId', as: 'votestofilter' } },
      { '$match': { 'votestofilter.voteCategory': voteFilter } },
      Constants.newsResponse
    ];
  }
  executeFetchNewsQuery(req, res, next, matchQuery, query);
}

function executeFetchNewsQuery(req, res, next, matchQuery, queryToExecute, type) {
  try {
    var newsQuery = News.aggregate(queryToExecute);
    newsQuery
    .then(documents => {
        if (req.userData != null && req.userData.userId != null && documents.length > 0) {
            if(type !== 'myposts') {
                documents.forEach(document => {
                    NewsVote.findOne({ 'newsId': document._id, 'creator': req.userData.userId })
                    .then(found => {
                        if (found) {
                          document['userVoted'] = {
                            skip: found.skip,
                            object: found.object,
                            subject: found.subject
                          };
                        } else {
                          document['userVoted'] = false;
                        }
                        News.populate(documents, { path: 'creator', select: 'name email image' })
                        .then(populatedDocuments => {
                              res.status(200).json({
                                message: 'News fetched successfully!',
                                news: populatedDocuments,
                              });
                        });
                    });
                });
            } else {
                News.populate(documents, { path: 'creator', select: 'name email image' })
                .then(populatedDocuments => {
                      res.status(200).json({
                        message: 'News fetched successfully!',
                        news: populatedDocuments,
                      });
                });
            } 
        } else {     
          News.populate(documents, { path: 'creator', select: 'name email image' })
          .then(populatedDocuments => {
                res.status(200).json({
                  message: 'News fetched successfully!',
                  news: populatedDocuments,
                });
          });
        }
    })
  } catch (err) {
    Logger.LOG.error(err);
    res.status(500).json({
      message: 'Fetching news failed!'
    });
  }
}

/*
 * Create new News Item
 * It expects link, description, category, is it video or not
 * It appends  the user Id to each news item for authorization  purpose
 */


function fetchPreview(link, newsid) {
  (async () => {
    try {
      let it = await grabity.grabIt(link);
      Logger.LOG.info(it);
      let result = await News.findOneAndUpdate(
        { _id: newsid },
        {
          $set: {
            extractedTitle: it.title,
            extractedDescription: it.description,
            extractedImage: it.image,
            previewAvailable: true
          }
        }
      );
    } catch (err) {
      Logger.LOG.error('Error in fetching preview: ' + link + ' error: ' + err)
    }
  })();
}

exports.fetchNewsItemsWithVotes = (req, res, next) => {
  const matchQuery = { _id: ObjectId(req.params.newsId) };
  var query = [
    { $match: matchQuery },
    //{ '$lookup': { from: 'newsvote', localField: '_id', foreignField: 'newsId', as: 'votes' } },
    Constants.scoreField,
    Constants.newsResponse
  ];

  executeFetchNewsQuery(req, res, next, matchQuery, query);
}

exports.fetchNewsItem = (req, res, next) => {
  News.findOne({ _id: req.params.newsId }, '-active -blocked -__v')
    .populate('creator', 'name id')
    .then(news => {
      if (news) {
        res.status(200).json(news);
      } else {
        res.status(404).json({ message: 'News item not found!' });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Fetching news item failed!'
      });
    });
};

exports.updateNews = async (req, res, next) => {
  try {
    News.findOneAndUpdate(
      { _id: req.params.newsId },
      {
        $set: { tags: req.body.tags, description: req.body.description }
      })
      .then(result => {
        if (result) {
          res.status(200).json({ message: 'Update successful!' });
        } else {
          res.status(401).json({ message: 'Failed to update!' });
        }
      })
      .catch(error => {
        res.status(500).json({
          message: 'Couldn\'t udpate news!'
        });
      });
  }
  catch(err) {
    res.status(500).json({
      message: 'Couldn\'t udpate news!'
    });
  }
};

exports.updateActiveNews = (req, res, next) => {
  News.findOneAndUpdate(
    { _id: req.params.newsId },
    {'active': true, 'blocked': false, 'reported': false})
    .then(result => {
      if (result) {
        res.status(200).json({ message: 'Update successful!' });
      } else {
        res.status(401).json({ message: 'Failed to update!' });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: 'Couldn\'t udpate news!'
      });
    });
};

exports.deleteNews = (req, res, next) => {
  News.findOneAndUpdate(
    { _id: req.params.newsId },
    {
      $set: { 'blocked': true }
    })
    .then(result => {
      if (result) {
        res.status(200).json({ message: 'Deletion successful!' });
      } else {
        res.status(401).json({ messag: 'News item is not available to delete' });
      }
    })
    .catch(error => {
      Logger.LOG.error('Error in deleting object ' + error);
      res.status(500).json({ message: 'Deleting news failed!' });
    });
};

exports.removeNews = (req, res, next) => {
  News.findOneAndDelete({ _id: req.params.newsId})
    .then(result => {
      if (result) {
        res.status(200).json({ message: 'Deletion successful!' });
      } else {
        res.status(401).json({ messag: 'News item is not available to delete' });
      }
    })
    .catch(error => {
      Logger.LOG.error('Error in deleting object ' + error);
      res.status(500).json({ message: 'Deleting news failed!' });
    });
};

exports.blockNews = async (req, res, next) => {
  News.findOneAndUpdate(
    { _id: req.params.newsId },
    {
      $set: { 'blocked': req.body.blocked }
    })
    .then(result => {
      if (result) {
        res.status(200).json({ message: 'Block/Unblock successful!' });
      } else {
        res.status(401).json({ messag: 'News item is not available to delete' });
      }
    })
    .catch(error => {
      Logger.LOG.error('Error in blocking object ' + error);
      res.status(500).json({ message: 'Blocking/Unblocking news failed!' });
    });
};

exports.updateViewCount = (req, res, next) => {
  let uniqueid = req.body.uniqueId;
  let newsid = req.params.newsId;

  var query = { uniqueId: uniqueid, newsId: newsid };

  const newsview = new NewsView({ uniqueId: uniqueid, newsId: newsid });
  const update = { newsview };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true };

  NewsView.findOneAndUpdate(query, update, options)
    .then(result => {
      if (result) {
        let errObj = result.lastErrorObject;
        if (errObj.updatedExisting != true) {
          News.findOneAndUpdate(
            { _id: newsid, active: true },
            { $inc: { 'views': 1 } }
          ).then(result => {
            if (result) {
              res.status(200).json({ message: 'Updated View count successfully!' });
            } else {
              res.status(401).json({ messag: 'News item is not available to update view count' });
            }
          })
        } else {
          res.status(200).json({ message: 'Updated View count successfully!' });
        }
      } else {
        res.status(401).json({ messag: 'News item is not available to update view count' });
      }
    })
    .catch(error => {
      Logger.LOG.error('Error in updating view count ' + error);
      res.status(500).json({ message: 'Failed to update view count!' });
    });
};

exports.fetchViewCount = (req, res, next) => {
  NewsView.count({ newsId: req.params.newsId })
    .then(count => {
      res.status(200).json({
        message: 'Counted the news successfully',
        count: count
      });
    });
}

exports.findActiveNews = (req, res, next) => {
  let newsid = req.params.newsId
  News.findOne({ 'active': true, 'blocked': false, _id: newsid })
    .then(result => {
      req.validNews = { valid: true, news: result };
      next();
    }).catch(error => {
      Logger.LOG.error('Error in finding active news');
      res.status(400).json({ message: 'Improper News ID!' });
    })
}

exports.updateVotesCountForNews = (req, res, next) => {
  NewsVote.countDocuments({ 'newsId': req.params.newsId })
    .then(cnt => {
      News.findOneAndUpdate({ _id: req.params.newsId }, { $set: { 'totalVotes': cnt } })
        .then(result => {
          next();
        })
        .catch(error => {
          res.status(400).json({ message: 'Invalid details sent!!' });
        });
    });
}

exports.updateVoteCategoriesForNews = async (req, res, next) => {
  try {
    NewsVote.aggregate([
      { $match: { 'newsId': mongoose.Types.ObjectId(req.params.newsId) } },
      { $group: { _id: '$voteCategory', count: { $sum: 1 } } }
    ]).then(documents => {
      News.findOneAndUpdate(
        { _id: req.params.newsId },
        {
          $set: { votes: documents }
        })
        .then(result => {
          res.status(200).json({ message: 'Successful!' });
        })
    });
  } catch (error) {
    Logger.LOG.error('Erroer in updating vote categories  ' + error);
    res.status(400).json({ message: 'Invalid details sent!!' });
  }
}

exports.updateShareForNews = async (req, res, next) => {
  try {
    let share = new NewsShare({
      newsId: req.params.newsId,
      creator: req.userData.userId,
      medium: req.params.medium
    });
    await share.save();
    let shareCount = await NewsShare.countDocuments({ newsId: req.params.newsId }).exec();
    News.findOneAndUpdate(
      { _id: req.params.newsId },
      { $set: { shares: shareCount } })
      .then(product => {
        res.status(200).json({ message: 'Successfully added share!' });
      });
  } catch (error) {
    Logger.LOG.error('Error in updating shares: ' + error);
    res.status(400).json({ message: 'Invalid details sent!!' });
  }
}

exports.fetchSharesForNews = async (req, res, next) => {
  try {
    NewsShare.find({ 'newsId': req.params.newsId }, '-__v')
      .populate('creator', 'name id')
      .then(result => {
        res.status(200).json({
          message: 'Successfully fetched shares',
          votes: result
        });
      });
  } catch (error) {
    Logger.LOG.error('Error in fetching shares: ' + error);
    res.status(400).json({ message: 'Invalid details sent!!' });
  }
}

