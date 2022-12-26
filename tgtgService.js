// tgtgService.js
// tgtg Service for handling requests
// ==================

const ApiService = require('./tgtgApiService');

// 8 seconds
const DELAY = 8000;

class TgtgService {
    /**
     * Constructor for initializing Service
     * @constructor
     * @param {string} accessToken - TGTG access token
     * @param {string} refreshToken - TGTG refresh token
     * @param {string} userId - TGTG user id
     */
    constructor(accessToken, refreshToken, userId) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;

        // init service
        this.apiService = new ApiService();
    }

    checkItem(itemId, callback) {
        const service = this;
        const apiCallback = function (resp, err) {
            if (err == null) {
                const accessToken = resp.access_token;
                const refreshToken = resp.refresh_token;
                service.requestItem(itemId, accessToken, refreshToken, callback);
            } else {
                console.log('checkItem#apiRefresh: Failed');
            }
        };
        this.apiService.apiRefresh(apiCallback, this.accessToken, this.refreshToken, this.userId);
    }

    checkfavorites (callback) {
        const service = this;
        const apiCallback = function (resp, err) {
            if (err == null) {
                const accessToken = resp.access_token;
                const refreshToken = resp.refresh_token;
                service.apiService.favorites(callback, accessToken, service.userId);
            } else {
                console.log('favorites#apiRefresh: Failed');
            }
        };
        this.apiService.apiRefresh(apiCallback, this.accessToken, this.refreshToken, this.userId);
    }

    checkItems(itemIds, callback) {
        const service = this;
        const apiCallback = function (resp, err) {
            if (err == null) {
                const accessToken = resp.access_token;
                const refreshToken = resp.refresh_token;
                // request every item
                service.requestWithDelay(itemIds, accessToken, refreshToken, callback);
            } else {
                console.log('checkItem#apiRefresh: Failed');
            }
        };
        this.apiService.apiRefresh(apiCallback, this.accessToken, this.refreshToken, this.userId);
    }

    requestItem (itemId, accessToken, refreshToken, callback) {
        const favCallback = function (itemResp, itemErr) {
            callback(itemResp, itemErr);
        };
    
        this.apiService.getItem(favCallback, itemId, accessToken, refreshToken, this.userId);
    }

    async requestWithDelay (itemIds, accessToken, refreshToken, callback) {
        for (const itemId of itemIds) {
            this.requestItem(itemId, accessToken, refreshToken, callback);

            // x sec delay
            await new Promise(resolve => setTimeout(resolve, DELAY));
        }
    }
    
}


module.exports = TgtgService;