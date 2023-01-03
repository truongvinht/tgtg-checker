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
     * @param {string} refreshToken - TGTG refresh token
     * @param {string} userId - TGTG user id
     */
    constructor(refreshToken, userId) {
        this.refreshToken = refreshToken;
        this.userId = userId;

        // access token expire date
        this.tokenExpireDate = undefined;
        this.cachedAccessToken = undefined;

        // init service
        this.apiService = new ApiService();
    }

    checkItem(itemId, callback) {
        const service = this;
        const apiCallback = function (resp, err) {
            if (err == null) {
                const accessToken = resp.access_token;
                service.refreshToken = resp.refresh_token;
                service.requestItem(itemId, accessToken, callback);
            } else {
                console.log('checkItem#apiRefresh: Failed');
            }
        };
        this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
    }

    checkfavorites (callback) {
        const service = this;
        const apiCallback = function (resp, err) {
            if (err == null) {
                const favCallback = (favResp, favErr) => {
                    if (favErr == null) {
                        if (Object.prototype.hasOwnProperty.call(favResp, 'items')) {
                            for (const item of favResp.items) {
                                callback(item, null);
                            }
                        } else {
                            console.log('favorites#checkFavorites: Bad Result ' + JSON.stringify(favResp));
                        }
                    } else {
                        callback(null, favErr);
                    }
                };

                service.apiService.favorites(favCallback, resp.access_token, service.userId);
            } else {
                console.log('favorites#apiRefresh: Failed');
            }
        };
        this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
    }

    checkItems(itemIds, callback) {
        const service = this;
        const apiCallback = function (resp, err) {
            if (err == null) {
                // request every item
                service.requestWithDelay(itemIds, resp.access_token, callback);
            } else {
                console.log('checkItem#apiRefresh: Failed');
            }
        };
        this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
    }

    requestItem (itemId, accessToken, callback) {
        const itemCallback = function (itemResp, itemErr) {
            callback(itemResp, itemErr);
        };
    
        this.apiService.getItem(itemCallback, itemId, accessToken,  this.userId);
    }

    /**
     * Only request new api token if old one already expired
     * @param {*} callback 
     * @param {*} refreshToken 
     * @param {*} userId 
     */
    updateTokenOnDemand(callback, refreshToken, userId) {

        const service = this;

        const apiCallback = function (resp, err) {

            if (err==null) {
                // estimate expire date (1 days buffer)
                service.tokenExpireDate = Math.floor(Date.now() / 1000) + resp.access_token_ttl_seconds - (60*60*24);
                service.cachedAccessToken = resp.access_token;
                callback(resp, err);
            } else {
                // req failed
                callback(null, err);
            }
        };
        if (this.tokenExpireDate === undefined) {
            // first fetch
            this.apiService.apiRefresh(apiCallback, refreshToken, userId);
        } else {
            // check whether expire date already occured
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime < this.tokenExpireDate) {
                // did not expired, build a resp map
                const resp = {
                    'access_token':this.cachedAccessToken
                };
                callback(resp, null);
            } else {
                // refresh token
                this.apiService.apiRefresh(apiCallback, refreshToken, userId);
            }
        }
        
    }

    async requestWithDelay (itemIds, accessToken, callback) {
        for (const itemId of itemIds) {
            this.requestItem(itemId, accessToken, callback);

            // x sec delay
            await new Promise(resolve => setTimeout(resolve, DELAY));
        }
    }
    
}


module.exports = TgtgService;