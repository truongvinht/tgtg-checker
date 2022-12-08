// load env
const dotenv = require('dotenv');
dotenv.config();

// scheduler for checking content
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');
const scheduler = new ToadScheduler();

// init service
const TgtgService = require('./tgtgService');
const tgtg = new TgtgService(process.env.TGTG_ACCESS_TOKEN,process.env.TGTG_REFRESH_TOKEN,process.env.TGTG_User);

const PushService = require('./pushService');


let reqMap = {};
let pushService = null;

function getPushService () {
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
    let pickupTime = '';

    if (Object.prototype.hasOwnProperty.call(item, 'pickup_interval')) {
        if (Object.prototype.hasOwnProperty.call(item.pickup_interval, 'start')&&
        Object.prototype.hasOwnProperty.call(item.pickup_interval, 'end')) {
            let startTime = item.pickup_interval.start;
            let startDate =  new Date(startTime);
            let endTime = item.pickup_interval.end;
            let endDate =  new Date(endTime);
            pickupTime = `[${startDate.toLocaleString("de-DE")} - ${endDate.toLocaleString("de-DE")}]`;
        }
    }

    let rating = '';
    if (Object.prototype.hasOwnProperty.call(item, 'average_overall_rating')) {
        if (Object.prototype.hasOwnProperty.call(item.average_overall_rating, 'average_overall_rating')) {
            pickupTime = `[Rating ${item.average_overall_rating.average_overall_rating}]`;
        }
    }

    getPushService().pushNotification(item.display_name, `Anzahl Verfügbar: ${item.items_available} ${pickupTime} ${rating}`, pushCallback);
}

function checkItemForPush (itemResp) {

    if (!Object.prototype.hasOwnProperty.call(itemResp.item, 'item_id')) {
        getPushService().pushNotification('Error', ''+itemResp.item);
        return;
    }

    if (Object.prototype.hasOwnProperty.call(reqMap, itemResp.item.item_id)) {
        if (itemResp.items_available > 0 && reqMap[itemResp.item.item_id] < itemResp.items_available) {
            pushItem(itemResp);
        } else {
            console.log(`${itemResp.display_name} - Count ${itemResp.items_available}`);
        }
    } else {
        if (itemResp.items_available > 0) {
            // first call and item is available
            pushItem(itemResp);
        } else {
            // first call and not available
            console.log(`${itemResp.display_name} not available`);
        }
    }
    // save counter
    reqMap[itemResp.item.item_id] = itemResp.items_available;
    console.log(reqMap);
}

const task = new Task('simple task', () => {

    // only check bwetween 6-22
    const date = new Date();

    // GMT+2
    const hour = date.getHours() + 2;

    if (hour > 6 && hour < 22) {
    
        const callback = function (item, err) {
            if (err == null) {
                checkItemForPush(item);
            } else {
                console.log('bad request ' + err)
            }
        };
    
        // check item
        const LIST = JSON.parse(process.env.ITEMS);
        tgtg.checkItems(LIST,callback);
    }
});



const job1 = new SimpleIntervalJob(
    { seconds: process.env.REQ_TIMER, runImmediately: true },
    task,
    'id_1'
);

// create and start jobs
scheduler.addSimpleIntervalJob(job1);