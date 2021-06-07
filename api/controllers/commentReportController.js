const CommentReport = require('../models/commentReportModel');
const Comment = require('../models/commentModel');

exports.createReport = async (req, res, next) => {
    try {
        let commentId = req.body.commentId;
        let type = req.body.type;

        let report = new CommentReport({
            commentId: commentId,
            type: type,
            creator: req.userData.userId
        });
        report.save();
        res.status(200).send({
            message: 'Thank you. Your report is successfully saved. Someone from our team will verify the news and take action.'
        });
    } catch (error) {
        logger.LOG.error('Comment Report Error: ' + error);
        return res.status(401).send({
            message: 'Failed to log your comment report'
        });
    }
}



exports.fetchReports = async (req, res, next) => {
    let statusCheck = req.query.status
    if (statusCheck == null) {
        statusCheck = 'None'
    }

    try {
        CommentReport.find({ 'status': statusCheck }, '-__v')
            .populate('creator', 'name id')
            .populate('commentId')

            .then(result => {
                res.status(200).json({
                    message: 'Successfully fetched comment reports',
                    reports: result
                });
            }).catch(error => {
                res.status(500).json({ message: 'Failed to fetch comment reports for news! ' + error });
            });
    } catch (error) {
        Logger.LOG.error('Comments Reports Fetching Error: ' + error);
        return res.status(401).send({
            message: 'Failed to fetch comment reports'
        });
    }
}

exports.updateReport = async (req, res, next) => {
    let statusReceived = req.body.status;
    if (statusReceived == 'None') {
        res.status(400).json({ message: 'Invalid status sent!!' });
    }

    try {
        CommentReport.findOneAndUpdate({ _id: req.params.reportId }, { $set: { 'status': statusReceived } })
            .populate('commentId')
            .then(result => {
                let block = statusReceived == 'Rejected' ? true : false;
                if (block) {
                    Comment.findOneAndUpdate({ _id: result.commentId.id }, { $set: { 'blocked': block } })
                        .then(updatedComment => {
                            res.status(200).json({
                                message: 'Successfully updated comment report'
                            });
                        });
                } else {
                    res.status(200).json({
                        message: 'Successfully updated comment report'
                    });
                }
            })
            .catch(error => {
                Logger.LOG.error('Error in updating comment report - ' + error);
                res.status(400).json({ message: 'Invalid details sent!!' });
            });
    } catch (error) {
        Logger.LOG.error('Comment Reports Updating Error: ' + error);
        return res.status(401).send({
            message: 'Failed to update comment reports'
        });
    }
}