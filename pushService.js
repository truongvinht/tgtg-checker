// pushService.js
// Service to for pushing notifications
// ==================

// import
const PushOver = require('pushover-notifications');

/**
 * Service to push notifications.
 * {@link ApiAccessService}
 */
class ApiPushService {
    /**
     * Constructor for init Push Service
     * @param {*} user user id for push service
     * @param {*} token token for push service
     */
    constructor (user, token) {

        this.user = user;
        this.token = token;

        const parameter = {
            user: user,
            token: token,
            onerror: function (error) {
                console.log(error);
            }
        };

        this.push = new PushOver(parameter);
    }

    /**
     * Push given message and title
     * @param {string} title notification title
     * @param {string} message input message
     * @param {requestCallback} callback callback to handle result/error
     */
    pushNotification (title, message, callback) {
        // default 0: normal notification
        this.pushNotificationWithPriority(title, message, 0, callback);
    }

    /**
     * Push given message and title
     * @param {string} title notification title
     * @param {string} message input message
     * @param {number} priority notification priority (-2,-1,0,1,2)
     * @param {requestCallback} callback callback to handle result/error
     */
    pushNotificationWithPriority (title, message, priority, callback) {

        if (this.user == undefined || this.token == undefined) {
            console.log(`# # # # #\n${title} - ${message}\n# # # # #`);
            return;
        }

        const msg = {
            message: message,
            title: title,
            sound: 'magic',
            priority: priority
        };

        this.push.send(msg, callback);
    }
};

module.exports = ApiPushService;
