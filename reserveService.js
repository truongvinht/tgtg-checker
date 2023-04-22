// reserveService.js
// item reserve service
// ==================

// maximal number of reserving items
const MAX_ITEMS = 5;

class ReserveService {
    /**
     * Constructor for initializing Service
     * @constructor
     * @param {array} itemIds - list of item ids
     */
    constructor(itemIds) {
        console.log('Reserving: ' + itemIds);
        this.itemIds = itemIds;
        this.usedList = [];
        this.orderList = [];
    }

    reset() {
        this.usedList = [];
        this.orderList = [];
    }

    readAllOrders() {
        return this.orderList;
    }

    pushOrder(order) {
        this.orderList.push(order);
    }

    checkReserve(item) {

        if (!this.itemIds.includes(`${item.item.item_id}`)) {
            // ignore this item
            console.log('Ignore: ' + item.item.item_id);
            return -1;
        }

        // check whether item was already reserved
        if (!this.usedList.includes(`${item.item.item_id}`)) {
            console.log(`${new Date().toLocaleString("de-DE")}| ${item.item.item_id}: Reserving ${item.display_name}.`);
            this.usedList.push(`${item.item.item_id}`);

            if (item.items_available > MAX_ITEMS) {
                return MAX_ITEMS;
            } else {
                return item.items_available;
            }
        } else {
            // already reserved
            console.log(`${new Date().toLocaleString("de-DE")}| ${item.item.item_id}: Already reserved today.`);
            
            return -1;
        }
    }
}

module.exports = ReserveService;