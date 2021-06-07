const Feedback = require('../models/feedbackModel');
const Util = require('../util/util');
const Logger = require('../../logger/logger');

exports.createFeedbackEntry = async (req, res, next) => {
    try {
        let name = req.body.name;
        let email = req.body.email;
        let feedback = req.body.feedback;

        if (!name || !email || !Util.validateEmail(email) || !feedback) {
            return res.status(500).json({
                message: 'Please provide all valid details'
            });
        }

        let fb = new Feedback({
            name: name,
            email: email,
            feedback: feedback
        });
        fb.save();

        var msg = {
            from: email,
            to: process.env.FEEDBACK_EMAIL,
            subject: 'Feedback Received - Reg',
            text: name + '<' + email + '>\n\n' + feedback
            //html: ''
        };
        Util.sendEmail(res, msg, 'Successfully saved your feedback', 'Failed to capture your feedback!!');
    } catch (error) {
        Logger.LOG.error('Feedbak Error: ' + error);
    }
}