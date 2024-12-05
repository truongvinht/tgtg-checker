// load env
const dotenv = require("dotenv");
dotenv.config();

// scheduler for checking content
const { ToadScheduler, SimpleIntervalJob, Task } = require("toad-scheduler");
const scheduler = new ToadScheduler();

// init service
const TgtgService = require("./tgtgService");
const tgtg = new TgtgService(
  process.env.TGTG_REFRESH_TOKEN,
  process.env.TGTG_User
);

const PushService = require("./pushService");
const ReserveService = require("./reserveService");

const RESERVE_ITEMS = process.env.RESERVE_ITEMS || [];
const reserver = new ReserveService(RESERVE_ITEMS);

const ExternalService = require("./externalService");
const exService = new ExternalService();

let reqMap = {};
let didNotifyError = false;
let pushService = null;

// launch notification
const ENABLE_NOTIFICATION_ANNOUNCEMENT = process.env.PO_ANNOUNCE || "0";
let notificationOnAnnounced = false;
let notificationOffAnnounced = false;
let notificatonLastStatusIsEnabled = false;

// default request cycle
const REQUEST_TIMER = process.env.REQ_TIMER || 60;

console.log(REQUEST_TIMER);

function getPushService() {
  if (pushService == null) {
    pushService = new PushService(process.env.PO_USER, process.env.PO_TOKEN);
  }
  return pushService;
}

function pushItem(item) {
  const pushCallback = function (err, result) {
    if (err) {
      throw err;
    }
    console.log(result);
  };
  let pickupTime = "";

  if (Object.prototype.hasOwnProperty.call(item, "pickup_interval")) {
    if (
      Object.prototype.hasOwnProperty.call(item.pickup_interval, "start") &&
      Object.prototype.hasOwnProperty.call(item.pickup_interval, "end")
    ) {
      let startTime = item.pickup_interval.start;
      let startDate = new Date(startTime);
      let endTime = item.pickup_interval.end;
      let endDate = new Date(endTime);

      const pickDate = startDate.toLocaleDateString("de-DE");

      const options = {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Berlin",
      };

      const pickStart = startDate.toLocaleTimeString("de-DE", options);
      const pickEnd = endDate.toLocaleTimeString("de-DE", options);

      pickupTime = `${pickDate}\n${pickStart} - ${pickEnd}`;
    }
  }

  let rating = "";
  if (Object.prototype.hasOwnProperty.call(item, "item")) {
    if (
      Object.prototype.hasOwnProperty.call(item.item, "average_overall_rating")
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          item.item.average_overall_rating,
          "average_overall_rating"
        )
      ) {
        const avg = item.item.average_overall_rating.average_overall_rating;
        if (avg != null && avg !== undefined) {
          rating = `(⭐️${avg.toFixed(2)})`;
        }
      }
    }
  }

  // fetch number of reserving items & prevent double ordering
  const count = reserver.checkReserve(item);

  if (count > 0) {
    // notify user about reserving
    getPushService().pushNotification(
      item.display_name,
      `Reservierte Anzahl: ${count} [${item.items_available}] \n${pickupTime}`,
      pushCallback
    );

    const reserveCallback = function (order, err) {
      if (err == null) {
        tgtg.cancelItem(order.id);
      } else {
        console.log(JSON.stringify(err));
      }
    };

    // reserve
    tgtg.orderItem(`${item.item.item_id}`, count, reserveCallback);
    return;
  }

  getPushService().pushNotification(
    item.display_name,
    `Anzahl: ${item.items_available} ${rating} \n${pickupTime}\n${parseFloat(
      item.item.item_price.minor_units / 100.0
    ).toFixed(item.item.item_price.decimals)} ${item.item.item_price.code}`,
    pushCallback
  );
}

function checkItemForPush(itemResp) {
  const response = itemResp;

  // prevent aborting
  if (response == null || response === undefined) {
    if (!didNotifyError) {
      didNotifyError = true;
      console.log(
        `${new Date().toLocaleString(
          "de-DE"
        )}| Error fetching response: ${response}`
      );
      getPushService().pushNotification(
        "Error fetching response",
        "" + response
      );
    }
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(response, "item")) {
    if (!didNotifyError) {
      didNotifyError = true;
      console.log(
        `${new Date().toLocaleString(
          "de-DE"
        )}| Error fetching response.item: ${JSON.stringify(response)}`
      );
      getPushService().pushNotification(
        "Error fetching response.item",
        JSON.stringify(response)
      );
    }
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(response.item, "item_id")) {
    if (!didNotifyError) {
      didNotifyError = true;
      console.log(
        `${new Date().toLocaleString(
          "de-DE"
        )}| Error fetching item_id: ${JSON.stringify(response)}`
      );
      getPushService().pushNotification(
        "Error fetching item_id",
        "" + JSON.stringify(response.item)
      );
    }
    return;
  }

  // request was valid
  didNotifyError = false;

  if (Object.prototype.hasOwnProperty.call(reqMap, response.item.item_id)) {
    if (
      response.items_available > 0 &&
      reqMap[response.item.item_id].items_available < response.items_available
    ) {
      // new items added
      pushItem(response);
    } else {
      // check dynamic price change
      if (
        reqMap[response.item.item_id].item_card_type === "DYNAMIC_PRICE" &&
        reqMap[response.item.item_id].item_price >
          response.item.item_price.minor_units
      ) {
        pushItem(response);
      } else {
        // no changes
        console.log(
          `${new Date().toLocaleString("de-DE")}| ${response.item.item_id}: ${
            response.display_name
          } - Count ${response.items_available}`
        );
      }
    }
  } else {
    if (response.items_available > 0) {
      // first call and item is available
      pushItem(response);
    } else {
      // first call and not available
      console.log(
        `${new Date().toLocaleString("de-DE")}| ${response.item.item_id}: ${
          response.display_name
        } not available`
      );
    }
  }

  let requestData = {};
  requestData["items_available"] = response.items_available;
  requestData["item_card_type"] = "DEFAULT";

  if (
    Object.prototype.hasOwnProperty.call(response, "item") &&
    Object.prototype.hasOwnProperty.call(response.item, "item_price") &&
    Object.prototype.hasOwnProperty.call(
      response.item.item_price,
      "minor_units"
    )
  ) {
    requestData["item_price"] = response.item.item_price.minor_units;
  }

  if (Object.prototype.hasOwnProperty.call(response, "item_card")) {
    if (
      Object.prototype.hasOwnProperty.call(response.item_card, "item_card_type")
    ) {
      requestData["item_card_type"] = response.item_card.item_card_type;
    }
  }

  // save item data
  reqMap[response.item.item_id] = requestData;
}

const task = new Task("simple task", () => {
  // check whether external source can be accessed
  const exCallback = function (body, resp, err) {
    // external service not configured
    const date = new Date();
    const hour = parseInt(
      date.toLocaleString("en-GB", {
        hour: "2-digit",
        hour12: false,
        timeZone: "Europe/Berlin",
      })
    );
    if (
      (body === undefined && resp === undefined && err === undefined) ||
      (err !== undefined && err !== null)
    ) {
      // only check between 6-22

      if (hour > 6 && hour < 22) {
        triggerCheckItems();
      } else if (hour > 22) {
        // after 10 pm reset checks
        reserver.reset();
      }
    } else {
      // use time settings from external service

      // body data
      // _id: string;
      // enabled: number;
      // start: string;
      // end: string;
      // startHour: number;
      // endHour: number;
      if (Object.prototype.hasOwnProperty.call(body, "enabled")) {
        if (body.enabled === 1) {
          if (
            ENABLE_NOTIFICATION_ANNOUNCEMENT === "1" &&
            !notificationOnAnnounced
          ) {
            if (!notificatonLastStatusIsEnabled) {
              notificationOnAnnounced = true;
              notificationOffAnnounced = false;
              // enabled=false => enabled=true
              getPushService().pushNotificationWithPriority(
                "Information",
                "tgtg-checker ON",
                -1,
                (err, result) => {}
              );
            }
          }

          // only check between start and end

          if (hour > body.startHour && hour < body.endHour) {
            triggerCheckItems();
          } else if (hour > body.endHour) {
            // after 10 pm reset checks
            reserver.reset();
          }
        } else {
          // disabled checking
          if (
            ENABLE_NOTIFICATION_ANNOUNCEMENT === "1" &&
            !notificationOffAnnounced
          ) {
            if (!notificatonLastStatusIsEnabled) {
              notificationOffAnnounced = true;
              notificationOnAnnounced = false;
              // enabled=false => enabled=true
              getPushService().pushNotificationWithPriority(
                "Information",
                "tgtg-checker OFF",
                -1,
                (err, result) => {}
              );
            }
          }
        }

        // update last status
        notificatonLastStatusIsEnabled = body.enabled === 1;
      } else {
        console.log("External data could not processed");
      }
    }
  };
  exService.getTgNotification(exCallback);
});

function triggerCheckItems() {
  const LIST = JSON.parse(process.env.ITEMS);
  if (LIST.length > 0) {
    const callback = function (item, err) {
      if (err == null) {
        checkItemForPush(item);
      } else {
        console.log("bad request " + err);
      }
    };
    // check item
    tgtg.checkItems(LIST, callback);
  } else {
    // req all items from favorites
    const callback = function (favItem, err) {
      if (err == null) {
        checkItemForPush(favItem);
      } else {
        console.log(JSON.stringify(err));
      }
    };

    tgtg.checkfavorites(callback);
  }
}

const job1 = new SimpleIntervalJob(
  { seconds: REQUEST_TIMER, runImmediately: true },
  task,
  "id_1"
);

// create and start jobs
scheduler.addSimpleIntervalJob(job1);
