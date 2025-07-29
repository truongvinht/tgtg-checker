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
const externalServiceApiPathPriceReminders =
  process.env.EXTERNAL_SERVICE_API_PATH_PRICE_REMINDERS ||
  "/api/v1/price-reminders";
const externalServiceApiPathProducts =
  process.env.EXTERNAL_SERVICE_API_PATH_PRODUCTS || "/api/v1/products";
const zipCode = process.env.ZIP_CODE || "80000";
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
   * Get price reminders from external service
   * @param {*} callback
   */
  getPriceReminders(callback) {
    if (externalServiceBaseUrl.length > 0) {
      this.getRequest(
        callback,
        externalServiceBaseUrl,
        externalServiceApiPathPriceReminders,
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${externalServiceToken}`,
        }
      );
    } else {
      console.log("ExternalService#Not Configured");
      callback(undefined, undefined, undefined);
    }
  }

  /**
   * Put price reminder data to external service
   * @param {*} callback
   * @param {*} id - price reminder ID
   * @param {*} data - price reminder data to put
   */
  putPriceReminder(callback, id, data) {
    if (externalServiceBaseUrl.length > 0) {
      this.putRequest(
        callback,
        externalServiceBaseUrl,
        `${externalServiceApiPathPriceReminders}/${id}`,
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${externalServiceToken}`,
        },
        data
      );
    } else {
      console.log("ExternalService#Not Configured");
      callback(undefined, undefined, undefined);
    }
  }

  /**
   * Get product datas from external service
   * @param {*} callback
   * @param {*} key - product key
   */
  getProducts(callback, key) {
    if (externalServiceBaseUrl.length > 0) {
      this.getRequest(
        callback,
        externalServiceBaseUrl,
        `${externalServiceApiPathProducts}/${zipCode}/${key}`,
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${externalServiceToken}`,
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
      callback(body, response, error);
    });
  }

  /**
   * General put request wrapper
   * @param {*} callback
   * @param {*} url
   * @param {*} path
   * @param {*} headers
   * @param {*} body
   */
  putRequest(callback, url, path, headers, body) {
    const options = {
      method: "PUT",
      url: `${url}${path}`,
      headers: headers,
      body: body,
      json: true,
    };

    request(options, function (error, response, body) {
      callback(body, response, error);
    });
  }
}

module.exports = ExternalService;
