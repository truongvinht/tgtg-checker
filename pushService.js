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
        const msg = {
            message: message,
            title: title,
            sound: 'magic',
            device: 'iDevice',
            priority: 2
        };

        this.push.send(msg, callback);
    }
};

module.exports = ApiPushService;
