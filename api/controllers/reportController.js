const NewsReport = require('../models/newsReportModel');
const Logger = require('../../logger/logger');
const News = require('../models/newsModel');

exports.createReport = async (req, res, next) => {
    try {
        let newsId = req.body.newsId;
        let type = req.body.type;

        let report = new NewsReport({
            newsId: newsId,
            type: type,
            creator: req.userData.userId
        });
        report.save();
        res.status(200).send({
            message: 'Thank you. Your report is successfully saved. Someone from our team will verify the news and take action.'
        });
    } catch (error) {
        logger.LOG.error('Report Error: ' + error);
        return res.status(401).send({
            message: 'Failed to log your report'
        });
    }
}

exports.fetchReports = async (req, res, next) => {
    let statusCheck = req.query.status
    if (statusCheck == null) {
        statusCheck = 'None'
    }

    try {
        NewsReport.find({ 'status': statusCheck }, '-__v')
            .populate('creator', 'name id')
            .populate('newsId')

            .then(result => {
                res.status(200).json({
                    message: 'Successfully fetched reports',
                    reports: result
                });
            }).catch(error => {
                res.status(500).json({ message: 'Failed to fetch reports for news! ' + error });
            });
    } catch (error) {
        Logger.LOG.error('Reports Fetching Error: ' + error);
        return res.status(401).send({
            message: 'Failed to fetch reports'
        });
    }
}

exports.updateReport = async (req, res, next) => {
    let statusReceived = req.body.status;
    if (statusReceived == 'None') {
        res.status(400).json({ message: 'Invalid status sent!!' });
    }

    try {
        NewsReport.findOneAndUpdate({ _id: req.params.reportId }, { $set: { 'status': statusReceived } })
            .populate('newsId')
            .then(result => {
                let block = statusReceived == 'Rejected' ? true : false;
                if (block) {
                    News.findOneAndUpdate({ _id: result.newsId.id }, { $set: { 'blocked': block } })
                        .then(updatedNews => {
                            res.status(200).json({
                                message: 'Successfully updated report'
                            });
                        });
                } else {
                    res.status(200).json({
                        message: 'Successfully updated report'
                    });
                }
            })
            .catch(error => {
                Logger.LOG.error('Error in updating report - ' + error);
                res.status(400).json({ message: 'Invalid details sent!!' });
            });
    } catch (error) {
        Logger.LOG.error('Reports Updating Error: ' + error);
        return res.status(401).send({
            message: 'Failed to update reports'
        });
    }
}