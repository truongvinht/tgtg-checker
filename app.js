// load env
const dotenv = require('dotenv');
dotenv.config();

// scheduler for checking content
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');
//const controller = require('./service/tgtg/tgtgController');
const scheduler = new ToadScheduler();

const task = new Task('simple task', () => {
    console.log('Trigger TGTG ' + process.env.REQ_TIMER);
    console.log(new Date());
    //controller.checkTgtg();
});

const job1 = new SimpleIntervalJob(
    { seconds: process.env.REQ_TIMER, runImmediately: true },
    task,
    'id_1'
);

// create and start jobs
scheduler.addSimpleIntervalJob(job1);