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
        this.cookie = undefined;
    }

    apiRefresh(callback, refreshToken, userId) {
        const PATH = '/api/auth/v3/token/refresh';
        console.log('#############################')
        console.log('refresh-Token: ' + refreshToken);
        console.log('#############################');

        let header =  { 
            'User-Agent': USER_AGENT, 
            'Content-Type': CONTENT_TYPE 
        };

        // add cookie for request
        if (this.cookie !== undefined) {
            header = { 
                'User-Agent': USER_AGENT, 
                'Content-Type': CONTENT_TYPE,
                'Cookie':this.cookie
            };
        }
        
        this.postRequest(callback, PATH, header, {
            refresh_token: refreshToken,
            user_id: userId
        });
    }

    getItem(callback, itemId, accessToken, userId) {
        const PATH = `/api/item/v7/${itemId}`;
        this.postRequest(callback, PATH, {
            'User-Agent': USER_AGENT,
            'Content-Type': CONTENT_TYPE,
            'Accept-Language': 'en-UK',
            Authorization: `Bearer ${accessToken}`
        }, {
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
            page_size: 20,
            page: 1
        };

        this.postRequest(callback, PATH, {
            'user-agent': USER_AGENT,
            'Cookie':this.cookie,
            Authorization: `Bearer ${accessToken}`
        }, body);
    }

    createOrder(callback, itemId, itemCount, accessToken) {
        const PATH = `/api/order/v7/create/${itemId}`;
        this.postRequest(callback, PATH, {
            'User-Agent': USER_AGENT,
            'Content-Type': CONTENT_TYPE,
            'Accept-Language': 'en-UK',
            Authorization: `Bearer ${accessToken}`
        }, {
            item_count: itemCount
        });
    }

    statusOrder(callback, orderId, accessToken) {
        const PATH = `/api/order/v7/${orderId}/status`;
        this.postRequest(callback, PATH, {
            'User-Agent': USER_AGENT,
            'Content-Type': CONTENT_TYPE,
            'Accept-Language': 'en-UK',
            Authorization: `Bearer ${accessToken}`
        }, {
        });
    }

    cancelOrder(callback, orderId, accessToken) {
        const PATH = `/api/order/v7/${orderId}/abort`;
        this.postRequest(callback, PATH, {
            'User-Agent': USER_AGENT,
            'Content-Type': CONTENT_TYPE,
            'Accept-Language': 'en-UK',
            Authorization: `Bearer ${accessToken}`
        }, {
            cancel_reason_id: 1
        });
    }

    activeOrder(callback, userId, accessToken) {
        const PATH = `/api/order/v6/active`;
        this.postRequest(callback, PATH, {
            'User-Agent': USER_AGENT,
            'Content-Type': CONTENT_TYPE,
            'Accept-Language': 'en-UK',
            Authorization: `Bearer ${accessToken}`
        }, {
            user_id: userId
        });
    }

    postRequest(callback, path, headers, body) {

        const options = {
            method: 'POST',
            url: `${this.url}${path}`,
            headers: headers,
            body: body,
            json: true
        };

        const api = this;

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            //console.log(JSON.stringify(response))

            // look for cookie, and store it
            if(Object.prototype.hasOwnProperty.call(response.headers, 'set-cookie')) {
                if (response.headers['set-cookie'].length > 0) {
                    api.cookie = response.headers['set-cookie'][0];
                }
            }

            callback(body, error);
        });
    }
};

module.exports = TgtgApiService;
