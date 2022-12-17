// tgtgApiService.js
// Service to access TooGoodToGo Restful API Services.
// ==================

// import
const request = require('request');

const USER_AGENT = 'TGTG/{} Dalvik/2.1.0 (Linux; U; Android 10; SM-G935F Build/NRD90M)';
const CONTENT_TYPE = 'application/json';

/**
 * Service to acccess Restful API for TooGoodToGo.
 */
class TgtgApiService {
    /**
     * Constructor for initializing
     * @constructor
     */
    constructor() {
        this.url = 'https://apptoogoodtogo.com';
    }

    apiRefresh(callback, accessToken, refreshToken, userId) {
        const PATH = '/api/auth/v3/token/refresh';
        console.log('#############################')
        console.log('access-Token: ' + accessToken);
        console.log('refresh-Token: ' + refreshToken);
        console.log('#############################')
        this.postRequest(callback, PATH, { 'User-Agent': USER_AGENT, 'Content-Type': CONTENT_TYPE }, {
            access_token: accessToken,
            refresh_token: refreshToken,
            user_id: userId
        });
    }

    getItem(callback, itemId, accessToken, refreshToken, userId) {
        const PATH = '/api/item/v7/' + itemId;
        this.postRequest(callback, PATH, {
            'User-Agent': USER_AGENT,
            'Content-Type': CONTENT_TYPE,
            'Accept-Language': 'en-UK',
            Authorization: `Bearer ${accessToken}`
        }, {
            access_token: accessToken,
            refresh_token: refreshToken,
            user_id: userId,
            origin: null
        });
    }

    // not working yet
    favorites(callback, accessToken, userId) {
        const PATH = '/api/item/v7/';

        const body = {
            favorites_only: true,
            user_id: userId,
            origin: {
              latitude: 0,
              longitude: 0,
            },
            radius: 200,
        };

        this.postRequest(callback, PATH, {
            'user-agent': USER_AGENT,
            "Content-Type": "application/json",
            Accept: "",
            "Accept-Language": "en-US",
            "Accept-Encoding": "gzip",
            Authorization: `Bearer ${accessToken}`
        }, body);
    }

    postRequest(callback, path, headers, body) {
        //console.log(this.url + path);

        const options = {
            method: 'POST',
            url: this.url + path,
            headers: headers,
            body: body,
            json: true
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            callback(body, error);
        });
    }
};

module.exports = TgtgApiService;
