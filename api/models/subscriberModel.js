const mongoose = require('mongoose');

/* Create Subscriber Schema */
var subscriberSchema = mongoose.Schema({
    endpoint: String,
    keys: mongoose.Schema.Types.Mixed,
    active: { type: Boolean, default: true },
    blocked: { type: Boolean, default: false },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
        collection: 'subscriber',
        timestamps: true
    });

module.exports = mongoose.model('Subscriber', subscriberSchema);

// ./node_modules/.bin / web - push generate - vapid - keys

//https://www.codementor.io/saurabharch/web-push-notification-full-stack-application-with-node-js-restful-api-nnonfcilg

// Public Key:
// BJtTDZY32IIFeAPOZ0Ku_CJt41Ch7G6V_ZVlpCGs5G - fQtZFu8qRy3pulCgm5Lbnnuo1fh4vTb6DdMKwKLIxqk4

// Private Key:
// JkZSu7iGiltHfK6V8scKgbmXW3BNBLrR_ahKE4HAKYI