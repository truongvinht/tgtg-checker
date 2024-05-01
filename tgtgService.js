// tgtgService.js
// tgtg Service for handling requests
// ==================

const ApiService = require("./tgtgApiService");
const request = require("request");
const ExternalService = require("./externalService");

// 8 seconds
const DELAY = 8000;
const RESERVE_DELAY = process.env.RESERVE_DURATION || 30 * 1000; // default 30 secs

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
    this.externalService = new ExternalService();

    // marker for error retrying
    this.errorOccured = false;
  }

  updateTokenOnDemand(callback) {
    const service = this;
    const apiCallback = function (resp, err) {
      if (err == null) {
        callback(resp, err);
      } else {
        console.log("updateTokenOnDemand#apiRefresh: Failed");
      }
    };
    this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
  }

  checkItem(itemId, callback) {
    const service = this;
    const apiCallback = function (resp, err) {
      if (err == null) {
        const accessToken = resp.access_token;
        service.refreshToken = resp.refresh_token;
        service.requestItem(itemId, accessToken, callback);
      } else {
        console.log("checkItem#apiRefresh: Failed");
      }
    };
    this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
  }

  checkfavorites(callback) {
    const service = this;
    const apiCallback = function (resp, err) {
      if (err == null) {
        const favCallback = (favResp, favErr) => {
          if (favErr == null) {
            if (Object.prototype.hasOwnProperty.call(favResp, "items")) {
              const mycall = function (body, response, err) {
                if (
                  body === undefined &&
                  response === undefined &&
                  err === undefined
                ) {
                  // ignore it
                } else {
                  if (err) {
                    console.log(
                      "favorites#checkFavorites:  Error transfering to external service"
                    );
                  }
                }
              };

              service.externalService.postTgtgData(mycall, favResp.items);

              for (const item of favResp.items) {
                callback(item, null);
              }
            } else {
              console.log(
                "favorites#checkFavorites: Bad Result " +
                  JSON.stringify(favResp)
              );
            }
          } else {
            callback(null, favErr);
          }
        };

        service.apiService.favorites(
          favCallback,
          resp.access_token,
          service.userId
        );
      } else {
        console.log("favorites#apiRefresh: Failed");
      }
    };
    this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
  }

  orderItem(itemId, count, callback) {
    const service = this;
    const apiCallback = function (resp, err) {
      if (err == null) {
        const orderCallback = (orderResp, orderErr) => {
          if (orderErr == null) {
            if (Object.prototype.hasOwnProperty.call(orderResp, "order")) {
              callback(orderResp.order, null);
            } else {
              console.log(
                "orderItem#createOrder: Bad Result " + JSON.stringify(orderResp)
              );
            }
          } else {
            callback(null, orderErr);
          }
        };

        service.apiService.createOrder(
          orderCallback,
          itemId,
          count,
          resp.access_token
        );
      } else {
        console.log("orderItem#apiRefresh: Failed");
      }
    };
    this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
  }
  orderStatusItem(orderId, callback) {
    const service = this;
    const apiCallback = function (resp, err) {
      if (err == null) {
        const orderCallback = (orderResp, orderErr) => {
          if (orderErr == null) {
            if (Object.prototype.hasOwnProperty.call(orderResp, "items")) {
              for (const item of orderResp.items) {
                callback(item, null);
              }
            } else {
              console.log(
                "orderStatusItem#statusOrder: Bad Result " +
                  JSON.stringify(orderResp)
              );
            }
          } else {
            callback(null, orderErr);
          }
        };

        service.apiService.statusOrder(
          orderCallback,
          orderId,
          resp.access_token
        );
      } else {
        console.log("orderStatusItem#apiRefresh: Failed");
      }
    };
    this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
  }

  cancelItem(orderId) {
    const service = this;
    const apiCallback = function (resp, err) {
      if (err == null) {
        service.cancelWithDelay(service.apiService, orderId, resp.access_token);
      } else {
        console.log("cancelItem#apiRefresh: Failed");
      }
    };
    this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
  }

  /**
   * General post request wrapper
   * @param {*} callback
   * @param {*} url
   * @param {*} path
   * @param {*} headers
   * @param {*} body
   */
  postRequest(callback, url, path, headers, body) {
    const options = {
      method: "POST",
      url: `${url}${path}`,
      headers: headers,
      body: body,
      json: true,
    };

    const api = this;

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      callback(body, response, error);
    });
  }

  activeOrder(callback) {
    const service = this;
    const apiCallback = function (resp, err) {
      if (err == null) {
        const orderCallback = (orderResp, orderErr) => {
          if (orderErr == null) {
            if (Object.prototype.hasOwnProperty.call(orderResp, "orders")) {
              callback(orderResp.orders, null);
            } else {
              console.log(
                "activeOrder#activeOrder: Bad Result " +
                  JSON.stringify(orderResp)
              );
            }
          } else {
            callback(null, orderErr);
          }
        };

        service.apiService.activeOrder(
          orderCallback,
          service.userId,
          resp.access_token
        );
      } else {
        console.log("activeOrder#apiRefresh: Failed");
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
        console.log("checkItem#apiRefresh: Failed ");
      }
    };
    this.updateTokenOnDemand(apiCallback, this.refreshToken, this.userId);
  }

  requestItem(itemId, accessToken, callback) {
    const itemCallback = function (itemResp, itemErr) {
      callback(itemResp, itemErr);
    };

    this.apiService.getItem(itemCallback, itemId, accessToken, this.userId);
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
      // forward error
      if (!Object.prototype.hasOwnProperty.call(resp, "access_token")) {
        err = `${JSON.stringify(resp)}`;

        if (service.errorOccured) {
          // repeated error: wait for dev fix
        } else {
          service.errorOccured = true;
          service.updateTokenOnDemand(callback, refreshToken, userId);
        }
      }

      if (err == null) {
        // estimate expire date (1 days buffer)
        service.errorOccured = false;
        service.tokenExpireDate =
          Math.floor(Date.now() / 1000) +
          resp.access_token_ttl_seconds -
          60 * 60 * 24;
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
          access_token: this.cachedAccessToken,
        };
        callback(resp, null);
      } else {
        // refresh token
        this.apiService.apiRefresh(apiCallback, refreshToken, userId);
      }
    }
  }

  async requestWithDelay(itemIds, accessToken, callback) {
    for (const itemId of itemIds) {
      this.requestItem(itemId, accessToken, callback);

      // x sec delay
      await new Promise((resolve) => setTimeout(resolve, DELAY));
    }
  }

  async cancelWithDelay(service, orderId, access_token) {
    await new Promise((resolve) => setTimeout(resolve, RESERVE_DELAY));
    service.cancelOrder(orderId, access_token);
  }
}

module.exports = TgtgService;
