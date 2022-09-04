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

function getPushService () {
    if (pushService == null) {
        pushService = new PushService(process.env.PO_USER, process.env.PO_TOKEN);
    }
    return pushService;
}

function checkItemForPush (itemResp) {
    const pushCallback = function (err, result) {
        if (err) {
            throw err;
        }
        console.log(result);
    };

    if (Object.prototype.hasOwnProperty.call(reqMap, itemResp.item_id)) {
        if (itemResp.items_available > 0 && reqMap[`${itemResp.item_id}`] < itemResp.items_available) {
            getPushService().pushNotification(itemResp.display_name, `Anzahl Verfügbar: ${itemResp.items_available}`, pushCallback);
        } else {
            console.log(`${itemResp.display_name} - Count ${itemResp.items_available}`);
        }
    } else {
        if (itemResp.items_available > 0) {
            // first call and item is available
            getPushService().pushNotification(itemResp.display_name, `Anzahl Verfügbar: ${itemResp.items_available}`, pushCallback);
        } else {
            // first call and not available
            console.log(`${itemResp.display_name} not available`);
        }
    }
    // save counter
    reqMap[`${itemResp.item_id}`] = itemResp.items_available;
}

const task = new Task('simple task', () => {
    console.log('Trigger TGTG ' + process.env.REQ_TIMER);
    console.log(new Date());

    const callback = function (item, err) {
        if (err == null) {
            checkItemForPush(item);
        } else {
            console.log('bad request ' + err)
        }
    };

    // check item
    tgtg.checkItem('',callback);
});

const job1 = new SimpleIntervalJob(
    { seconds: process.env.REQ_TIMER, runImmediately: true },
    task,
    'id_1'
);

// create and start jobs
scheduler.addSimpleIntervalJob(job1);