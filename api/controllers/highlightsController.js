const mongoose = require('mongoose');
const Highlights = require('../models/highlights');
const News = require('../models/newsModel');
const Logger = require('../../logger/logger');
const Constants = require('../util/constants');

exports.prepareHighlights = async (req, res, next) => {
    try {
        const categoryName = req.params.category;

        let startDate = new Date(Date.now());
        let hr = startDate.getHours();
        let dt = startDate.getDate();

        if (hr >= 0 && hr < 4) {
            startDate.setDate(dt - 1);      

            let deleteDt = startDate;
            deleteDt.setDate(dt - 7);
            await Highlights.deleteMany({ 'createdAt': { '$lte': deleteDt } }).exec();
        } 
        
        startDate.setHours(0);
        startDate.setMinutes(0);
        startDate.setSeconds(0);
        
        var highlightIDs = [];
        let tempIDs = await Highlights.find({ 'category': categoryName }, { _id: 0, 'newsId': 1 })
        tempIDs.forEach(doc => {
            highlightIDs.push(doc.newsId)
        });

        const matchQuery = {
            $match: {
                $and: [
                    { '_id': { '$nin': highlightIDs } },
                    { 'createdAt': { '$gte': startDate } },
                    { 'category': categoryName },
                    { 'active': true },
                    { 'blocked': false }
                ]
            }
        };

        var aggregateQuery = News.aggregate([
            matchQuery,
            Constants.scoreField,
            { '$sort': { score: -1 } },
            { '$limit': 5 },
            { '$project': { _id: 1 } }
        ]);


        aggregateQuery
            .then(documents => {
                let ids = documents.map(doc => {
                   return doc._id 
                });
                req.ids = ids;
                req.startDate = startDate;
                next();
            });
    } catch (error) {
        Logger.LOG.error('Error in filtering highlights news' + error);
        res.status(400).json({ message: 'Failed to filter highlights news!' + error });
    }
}

// exports.checkDocumentsLength = async (req, res, next) => {
//     try {
//         const categoryName = req.params.category;
//         let ids = req.ids;

//         if (ids.length < 5) {
//             var highlightIDs = [];
//             let tempIDs = await Highlights.find({ 'category': categoryName }, { _id: 0, 'newsId': 1 })
//             tempIDs.forEach(doc => {
//                 highlightIDs.push(doc.newsId)
//             });
                
//             const matchQuery = {
//                 $match: {
//                     $and: [
//                         { '_id': { '$nin': highlightIDs } },
//                         { 'category': categoryName },
//                         { 'createdAt': { '$lt': req.startDate } },
//                         { 'active': true },
//                         { 'blocked': false }
//                     ]
//                 }
//             };

//             var aggregateQuery = News.aggregate([
//                 matchQuery,
//                 Constants.scoreField,
//                 { '$sort': { score: -1 } },
//                 { '$limit': (5 - ids.length) },
//                 { '$project': { _id: 1 } }
//             ]);

//             aggregateQuery
//                 .then(documents => {
//                     let tids = documents.map(doc => {
//                         return doc._id
//                     });      
//                     req.ids = ids.concat(tids);
//                     next();
//                 });
//         } else {
//             next();
//         }
//     } catch (error) {
//         Logger.LOG.error('Error in checking highlights news' + error);
//         res.status(400).json({ message: 'Failed to checking highlights news!' + error });
//     }
// }

exports.insertHighlights = async (req, res, next) => {
    try {
        let ids = req.ids;
        if (ids.length > 0) {
            ids.forEach(docID => {
                const ht = new Highlights({
                    newsId: docID,
                    category: req.params.category
                });
                ht.save();
            });
        }
        res.status(200).json({ message: 'success' });
    } catch (error) {
        Logger.LOG.error('Error in inserting highlights news' + error);
        res.status(400).json({ message: 'Failed to inserting highlights news!' + error });
    }
}

exports.fetchHighlights = async (req, res, next) => {
    try {
        const categoryName = req.params.category;
        Highlights.find({ 'category': categoryName }, '-__v')
            .sort([['createdAt', -1], ['score', -1]])
            .limit(5)
            .populate('newsId')
            .then(news => {
                let filteredNews = news.map(fNews => {
                    return fNews.newsId
                })
                res.status(200).json({
                    message: 'Highlights fetched successfully!',
                    news: filteredNews
                });
            });
    } catch (error) {
        Logger.LOG.error('Error in fetching highlights news');
        res.status(400).json({ message: 'Failed to fetch highlights news!' });
    }
}