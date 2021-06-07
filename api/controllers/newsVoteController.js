const NewsVote = require('../models/newsVoteModel');
const Constants = require('../util/constants');

exports.validateVoteAndInsert = async (req, res, next) => {

    let newsid = req.body.id;
    let userid = req.body.creator;
    let subject = req.body.subject;
    let object = req.body.object;
    let skip = req.body.skip;

    var query = { creator: userid, newsId: newsid };
    const update = { subject: subject, object: object, skip: skip };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true };

    NewsVote.findOneAndUpdate(query, update, options)
        .then(result => {
            next()
        })
        .catch(error => {
            res.status(400).json({ message: 'Invalid details sent!!' });
        })
}

//Below method is just for reference, but not used anywhere in this project
exports.addVote = async (req, res, next) => {
    let newsid = req.params.newsId
    if (req.validNews.valid) {
        const newsVote = new NewsVote({
            newsId: newsid,
            creator: req.userData.userId,
            voteCategory: req.body.voteCategory
        });
        let savedNewsVote = await newsVote.save()
            .then(result => {
                res.status(201).json({
                    message: 'Vote added successfully to the news'
                });
            }).catch(error => {
                res.status(500).json({ message: 'Failed to add vote! ' + error });
            });
    } else {
        res.status(400).json({ message: 'Invalid details sent!!' });
    }
}

exports.fetchVotesForNews = (req, res, next) => {
    let userId = req.userData.userId;
    if (userId) {
        NewsVote.find({ 'creator': userId })
            .then(result => {
                console.log(result);
                req.votesData = result;
                next();
                // res.status(200).json({
                //     message: 'Successfully fetched votes',
                //     votes: result
                // });
            }).catch(error => {
                res.status(500).json({ message: 'Failed to fetch votes for news! ' + error });
            });
    } else {
        res.status(400).json({ message: 'Invalid details sent!!' });
    }
}
