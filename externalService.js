// externalService.js
// service for handling external requests

const request = require("request");

// external api service
const externalServiceBaseUrl = process.env.EXTERNAL_SERVICE_BASE_URL || "";
const externalServiceApiPathItem =
  process.env.EXTERNAL_SERVICE_API_PATH_ITEM || "/api/v1/items";
const externalServiceToken = process.env.EXETERNAL_SERVICE_TOKEN || "";
const externalServiceApiPathNotification =
  process.env.EXTERNAL_SERVICE_API_PATH_NOTIFICATION || "/api/v1/notifications";
class ExternalService {
  constructor() {
    // not required
  }

  /**
   * Post requested data to own endpoint
   * @param {*} callback
   * @param {*} items
   */
  postTgtgData(callback, items) {
    if (externalServiceBaseUrl.length > 0) {
      this.postRequest(
        callback,
        externalServiceBaseUrl,
        externalServiceApiPathItem,
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${externalServiceToken}`,
        },
        items
      );
    } else {
      console.log("ExternalService#Not Configured");
      callback(undefined, undefined, undefined);
    }
  }

  getTgNotification(callback) {
    if (externalServiceBaseUrl.length > 0) {
      this.getRequest(
        callback,
        externalServiceBaseUrl,
        externalServiceApiPathNotification,
        {
          "Content-Type": "application/json",
        }
      );
    } else {
      console.log("ExternalService#Not Configured");
      callback(undefined, undefined, undefined);
    }
  }

  /**
   * General get request wrapper
   * @param {*} callback
   * @param {*} url
   * @param {*} path
   * @param {*} headers
   */
  getRequest(callback, url, path, headers) {
    const options = {
      method: "GET",
      url: `${url}${path}`,
      headers: headers,
      json: true,
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      callback(body, response, error);
    });
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

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      callback(body, response, error);
    });
  }
}

module.exports = ExternalService;
