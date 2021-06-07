const mongoose = require('mongoose');

const newsViewSchema = new mongoose.Schema({
    uniqueId: { type: String, required: true, ref: 'User' },
    newsId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'News' },
}, {
        collection: 'view',
        timestamps: true
    });

module.exports = mongoose.model('NewsView', newsViewSchema);