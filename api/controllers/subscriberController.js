const mongoose = require('mongoose');
const Subscriber = require('../models/subscriberModel');
const Logger = require('../../logger/logger');

exports.push = async (req, res, next) => {
    try {
        const payload = {
            title: req.body.title,
            message: req.body.message,
            url: req.body.url,
            ttl: req.body.ttl,
            icon: req.body.icon,
            image: req.body.image,
            badge: req.body.badge,
            tag: req.body.tag
        };
        Subscription.find({}, (err, subscriptions) => {
            if (err) {
                console.error(`Error occurred while getting subscriptions`);
                res.status(500).json({
                    message: 'Technical error occurred'
                });
            } else {
                let parallelSubscriptionCalls = subscriptions.map((subscription) => {
                    return new Promise((resolve, reject) => {
                        const pushSubscription = {
                            endpoint: subscription.endpoint,
                            keys: {
                                p256dh: subscription.keys.p256dh,
                                auth: subscription.keys.auth
                            }
                        };

                        const pushPayload = JSON.stringify(payload);
                        const pushOptions = {
                            vapidDetails: {
                                subject: 'http://example.com',
                                privateKey: keys.privateKey,
                                publicKey: keys.publicKey
                            },
                            TTL: payload.ttl,
                            headers: {}
                        };
                        webPush.sendNotification(
                            pushSubscription,
                            pushPayload,
                            pushOptions
                        ).then((value) => {
                            resolve({
                                status: true,
                                endpoint: subscription.endpoint,
                                data: value
                            });
                        }).catch((err) => {
                            reject({
                                status: false,
                                endpoint: subscription.endpoint,
                                data: err
                            });
                        });
                    });
                });
                q.allSettled(parallelSubscriptionCalls).then((pushResults) => {
                    console.info(pushResults);
                });
                res.json({
                    message: 'Push triggered'
                });
            }
        });
    } catch (error) {
        Logger.LOG.error('Error in adding subscription' + error);
        res.status(500).json({
            message: 'Failed to add subscription!'
        });
    }
}

exports.addSubscription = async (req, res, next) => {
    try {
        const subscriptionModel = new Subscriber(req.body);
        subscriptionModel.save((err, Subscriber) => {
            if (err) {
                console.error('Error occurred while saving subscription. Err: ${err}');
                res.status(500).json({
                    message: 'Technical error occurred'
                });
            } else {
                res.status(200).json({
                    message: 'Subscription saved.'
                });
            }
        });
    } catch (error) {
        Logger.LOG.error('Error in adding subscription' + error);
        res.status(500).json({
            message: 'Failed to add subscription!'
        });
    }
};