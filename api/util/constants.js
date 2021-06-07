module.exports.expiresInMins = 14400
module.exports.expiresInHrs = '4h'

/////////////////////////////////////////////////////////////////////////////////////////
//Status of the feedback - If some one reports about a news item, its used.
const feedbackStatus = new Array(
    'Open',
    'InProgress',
    'Resolved'
);
module.exports.feedbackStatus = feedbackStatus;

/////////////////////////////////////////////////////////////////////////////////////////
//Roles used by user registration & authentication
const roles = {
    admin: 'Admin',
    user: 'User'
}
module.exports.roles = roles;

/////////////////////////////////////////////////////////////////////////////////////////
//Type of comment
const commentType = new Array(
    'Comment',
    'Question'
);
module.exports.commentType = commentType;

const shareMedia = new Array(
    'Facebook',
    'Twitter'
);
module.exports.shareMedia = shareMedia;

/////////////////////////////////////////////////////////////////////////////////////////
//Report telated
const reportTypes = new Array(
    'Spam',
    'Porn',
    'HateSpeech',
    'Bully',
    'Harmful',
    'WrongCategory'
);
module.exports.reportTypes = reportTypes;

const reportStatus = new Array(
    'None',
    'Accepted',
    'Rejected'
);
module.exports.reportStatus = reportStatus;

const categories = new Array(
    'Influence',
    'StyleAndSweat',
    'HumanStories',
    'JumpStartups',
    'Hobbyist',
    'LoveDesigns',
    'Science',
    'Environment',
    'Public'
);
module.exports.categories = categories;

const votes = {
    'Influence': ['Important', 'Interesting', 'Investigate', 'Protest'],
    'StyleAndSweat': ['Love', 'TopClass', 'Magic'],
    'HumanStories': ['LoveTheHuman', 'Inspiring'],
    'JumpStartups': ['ProblemSolver', 'Promising'],
    'Hobbyist': ['Informative', 'Interesting'],
    'LoveDesigns': ['LoveTheColor', 'Grand', 'Creative'],
    'Science': ['Informative', 'Interesting'],
    'Environment': ['Protect', 'Protest', 'Interesting'],
    'Public': ['Interesting', 'Important', 'Investigate', 'Protest']
};
module.exports.votes = votes;

const scoreField = {
    $addFields: {
        score:
            { $add: [ '$shares', '$totalVotes', '$views', '$comments', { $multiply: [2, '$questions'] }] }
    }
};
module.exports.scoreField = scoreField;

const newsResponse = {
    '$project': {
        video: 1,
        previewAvailable: 1,
        views: 1,
        extractedImage: 1,
        extractedDescription: 1,
        extractedTitle: 1,
        _id: 1,
        link: 1,
        //description: 1,
        category: 1,
        creator: 1,
        createdAt: 1,
        updatedAt: 1,
        comments: 1,
        questions: 1,
        totalVotes: 1,
        score: 1,
        votes: 1,
        shares: 1
    }
};
module.exports.newsResponse = newsResponse;

