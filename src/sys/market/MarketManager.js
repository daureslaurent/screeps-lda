const USE_MEMORY = true;
const VisualUiBox = require('core/visual/visual.ui.box');
const MarketTrackData = require('sys/market/model/MarketTrackData');
const MarketRef = require('sys/market/MarketRef');
const Logs = require('utils/Logs');

const BOOST_ENERGY_MIN = 10 * 1000;

const MOVE_TIME = 200;
const AUTO_BOOST_MOVE_TIME = 50;
const AUTO_SELL_AMOUNT = 1000;
const AUTO_BOOST_AMOUNT = 1000;

const STORED_ENERGY = 3000
class MarketManager {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;
        /** @type {SpawnerData[]} */

        this.mineralRoom = undefined;
        this.terminalId = undefined;
        this.needMainMineral = undefined;
        /** @type {MarketTrackData[]} */
        this.tracked = undefined;
        this.lastMove = Game.time;
        this.totalGain = -1;

        this.constructMemory();
        if (USE_MEMORY === true) {
            this.loadMemory();
        }

        this.marketRef = new MarketRef(roomName);
        this.ready = false
        this.needEnergy = 0;
        this.storage = undefined
        /** @type {Order} */
        this.targetOrder = undefined
        this.energyBoost = false;
        this.wantEnergy = STORED_ENERGY;

    }

    constructMemory() {
        if (USE_MEMORY === false) {
            Memory.market = undefined
            delete Memory.market
            return
        }
        if (!Memory.market) {
            Memory.market = {}
        }
        if (!Memory.market[this.roomName]) {
            Memory.market[this.roomName] = {}
        }
    }
    saveMemory() {
        if (USE_MEMORY === true) {
            Memory.market[this.roomName].mineralRoom = this.mineralRoom;
            Memory.market[this.roomName].terminalId = this.terminalId;
            Memory.market[this.roomName].needMainMineral = this.needMainMineral;
            Memory.market[this.roomName].tracked = this.tracked;
            Memory.market[this.roomName].lastMove = this.lastMove;
            Memory.market[this.roomName].totalGain = this.totalGain;
        }
    }
    loadMemory() {
        const memory = Memory.market[this.roomName]
        if (memory) {
            this.mineralRoom = memory.mineralRoom || undefined;
            this.terminalId = memory.terminalId || undefined;
            this.needMainMineral = memory.needMainMineral || undefined;
            this.tracked = memory.tracked || [];
            this.lastMove = memory.lastMove || Game.time;
            this.totalGain = memory.totalGain || -1;
        }
    }

    setRoomMineral(mineral) {
        if (mineral != null && this.mineralRoom !== mineral) {
            this.mineralRoom = mineral;
        }
    }

    setTerminalId(terminalId) {
        if (terminalId != null && this.terminalId !== terminalId) {
            this.terminalId = terminalId;
        }
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    update(gameAccess, roomData) {
        this.marketRef.updatePrice();
        /** @type {StructureTerminal} */
        const terminal = gameAccess.Game.getObjectById(this.terminalId);
        if (terminal != null) {
            this.needEnergy = this.wantEnergy - terminal.store[RESOURCE_ENERGY];
            if (this.mineralRoom != null) {
                this.needMainMineral = 5000 - terminal.store[this.mineralRoom];
                this.targetOrder = this.marketRef.findOrderReady(this.mineralRoom, ORDER_BUY, AUTO_SELL_AMOUNT)
            }
            this.ready = this.needEnergy <= 0;
        }
        if (this.mineralRoom != null && (!this.tracked || this.tracked.length < 1)) {
            this.tracked.push(new MarketTrackData(this.mineralRoom, ORDER_BUY, AUTO_SELL_AMOUNT))
        }

        if (this.tracked != null) {
            this.tracked.forEach(t => {
                const order = this.marketRef.findOrderReady(t.resourceType, ORDER_BUY, 100);
                if (!t.bestPrice) {
                    t.bestPrice = -1;
                }
                if (t.bestPrice < order.price) {
                    t.bestPrice = order.price;
                    t.bestPriceTrx = Game.market.calcTransactionCost(100, this.roomName, order.roomName)/100;
                }

                if (t.minPrice > order.price || t.minPrice === undefined) {
                    t.minPrice = order.price;
                    t.minPriceTrx = Game.market.calcTransactionCost(100, this.roomName, order.roomName)/100;
                }
            })
        }
        if (Game.time - this.lastMove >= MOVE_TIME && this.getStorage() != null) {
            this.lastMove = Game.time;
            if (this.getStorage().getStore().getUsedCapacity(this.mineralRoom) > 3000) {
                this.doTrx(this.targetOrder, AUTO_SELL_AMOUNT);
            }
        }

        if (Game.time - this.lastMove >= AUTO_BOOST_MOVE_TIME && this.getStorage() != null && this.energyBoost) {
            this.lastMove = Game.time;
            this.doTrx(this.marketRef.findOrderReady(RESOURCE_ENERGY, ORDER_SELL, AUTO_BOOST_AMOUNT), AUTO_BOOST_AMOUNT);
        }

        const mainStorage = roomData.getSysStorage().getMainStorage();
        if (mainStorage != null) {
            this.energyBoost = mainStorage.getEnergy() < BOOST_ENERGY_MIN
                && this.totalGain > 300 * 1000
                && this.marketRef.getPrice(RESOURCE_ENERGY) < 80;
        }

        this.saveMemory();
    }

    doTrx(order, amount) {
        Logs.logA(`TRX Pre -- ${JSON.stringify(order)}`)
        if (order) {
            const fixedAmount = Math.min(amount, order.amount)
            const ret = Game.market.deal(order.id, fixedAmount, this.roomName)
            Logs.logA(`TRX Post -- ret: ${ret}`)
            if (ret === OK) {
                this.totalGain += order.type === ORDER_SELL
                    ? - Number(order.price * amount)
                    : Number(order.price * amount)
            }
        }

    }

    externalDebugVisual(gameAccess) {
        const terminal = gameAccess.Game.getObjectById(this.terminalId);
        if (terminal != null) {
            const visual = Game.rooms[this.roomName].visual;
            // const pos = flag.pos;
            const pos = terminal.pos;

            const box = new VisualUiBox(visual, pos);
            box.setTitle(`SysMarket`)
            box.addLine(`Need: ⚡${this.getNeedEnergy()} 🏢${this.mineralRoom}: ${this.getNeedMainMineral()}`)
            box.addLine(`Gain: ${this.totalGain}`)
            box.addLine(`energy boost: ${this.energyBoost}`)
            box.addLine(`Move: ${Game.time - this.lastMove}`)

            if (this.getStorage() != null) {
                const store = this.getStorage().getStore();
                box.addLine(`Storage: ⚡${store.getUsedCapacity(RESOURCE_ENERGY)} 🏢${this.mineralRoom}: ${store.getUsedCapacity(this.mineralRoom)}`)
            }

            // box.addLine(`Credits: 💰${Game.market.credits}`)
            const resEnergy = this.marketRef.getMapData(RESOURCE_ENERGY);
            if (resEnergy != null) {
                box.addLine(`📈⚡: ${resEnergy.price}.Cr (${resEnergy.liquid}) [${resEnergy.reelPrice}][${resEnergy.trxFees}] RG[${resEnergy.reelGain}]`)
            }

            const resBattery = this.marketRef.getMapData(RESOURCE_BATTERY);
            if (resBattery != null) {
                box.addLine(`📈B ${resBattery.price}.Cr (${resBattery.liquid}) [${resBattery.reelPrice}][${resBattery.trxFees}] RG[${resBattery.reelGain}]`)
            }

            if (this.tracked != null) {
                this.tracked.forEach(t => {
                    box.addLine(`📊 ${t.resourceType} max: ${t.bestPrice}⚡(${t.bestPriceTrx}) min: ${t.minPrice}⚡(${t.minPriceTrx})`)
                })
            }

            // box.addLine(`Orders: ${Game.market.orders.length}`)
            // box.addLine(`In  trx: ${Game.market.incomingTransactions}`)
            // box.addLine(`Out trx: ${Game.market.outgoingTransactions}`)


            if (this.targetOrder != null && this.getStorage() != null) {
                const tgt = this.targetOrder;
                const amount = Math.min(this.getStorage().getStore().getUsedCapacity(tgt.resourceType), tgt.amount)
                const trxCost = Game.market.calcTransactionCost(amount, this.roomName, tgt.roomName);
                const trxCostPrct = Game.market.calcTransactionCost(amount, this.roomName, tgt.roomName) / amount;
                const tgtLog = `= ${tgt.amount}/${tgt.remainingAmount} | 💴${tgt.price} || 💰${Math.round(tgt.price * amount)}⚡(${trxCost})(${trxCostPrct})`
                box.addLine(`Tgt order: ${tgtLog}`)
            }

            if (this.mineralRoom !== undefined) {
                this.debugResourceToSell(box, this.mineralRoom, 1000)
            }
            this.debugResourceToBuy(box, RESOURCE_ENERGY, 1000)
            // this.debugResource(box, RESOURCE_BATTERY, 10)
            // this.debugResource(box, RESOURCE_POWER, 10)

            box.draw()
        }

    }

    // /**
    //  * @param resource
    //  * @return {Order}
    //  */
    // findOrderReady(resource) {
    //     const typeOrder = ORDER_BUY;
    //     /** @type {Order[]} */
    //     return  Game.market.getAllOrders({type: typeOrder, resourceType: resource})
    //         .sort((a, b) => b.price - a.price)
    //         .slice(0, 1)[0]
    // }

    debugResourceToSell(box, resource, amount) {
        const typeOrder = ORDER_BUY;
        /** @type {Order[]} */
        const sell = Game.market.getAllOrders({type: typeOrder, resourceType: resource});
        box.addLine(`[${resource}] ${amount} ${typeOrder} nb: ${sell.length}`)
        sell.forEach(v => {
            const postAmount = Math.min(v.amount, amount)
            const amountCost = postAmount * v.price;
            const trxCost = Game.market.calcTransactionCost(postAmount, this.roomName, v.roomName);
            v.cost = amountCost
            v.costTrx = trxCost
            v.costTrxRatio = Math.round( (trxCost / postAmount) * 100)/100
            v.sortCost = v.cost - (this.marketRef.getPrice(RESOURCE_ENERGY) * trxCost)
            v.endRes = resource === RESOURCE_ENERGY ? postAmount - trxCost : postAmount
            v.ratio = v.endRes / v.cost;
            v.postAmount = postAmount;
        })
        sell
            .sort((a, b) => b.sortCost - a.sortCost)
            // .sort((a, b) => b.price - a.price)
            .slice(0, 3)
            .forEach(v => {
                box.addLine(`= ${v.amount}(${v.postAmount}) | 💴${v.price} || 💰${Math.round(v.sortCost)}⚡${v.costTrxRatio} ${v.roomName}`)
            })


    }

    debugResourceToBuy(box, resource, amount) {
        const typeOrder = ORDER_SELL;
        /** @type {Order[]} */
        const sell = Game.market.getAllOrders({type: typeOrder, resourceType: resource});
        box.addLine(`[${resource}] ${amount} ${typeOrder} nb: ${sell.length}`)
        sell.forEach(v => {
            const amountCost = amount * v.price;
            const trxCost = Game.market.calcTransactionCost(amount, this.roomName, v.roomName);
            v.cost = amountCost
            v.costTrx = trxCost
            v.costTrxRatio = Math.round( (trxCost / amount) * 100)/100

            v.endRes = resource === RESOURCE_ENERGY ? amount - trxCost : amount
            v.ratio = v.endRes / v.cost;
        })
        sell.sort((a, b) => b.ratio - a.ratio)
            .slice(0, 3)
            .forEach(v => {
                box.addLine(`= ${v.amount} | 💴${v.price} || 💰${v.cost}⚡(${v.costTrx})(${v.costTrxRatio}) ${resource===RESOURCE_ENERGY ? `[${v.endRes}]`:""}`)
            })
    }

    /**
     * @return {number}
     */
    getNeedEnergy() {
        return Number(this.needEnergy);
    }
    getNeedMainMineral() {
        return Number(this.needMainMineral);
    }
    getOverEnergy() {
        return 0
    }

    /**
     * @param storage {SysStorageUnit}
     */
    updateStorage(storage) {
        if (storage != null) {
            this.storage = storage
        }
    }

    /**
     * @return {SysStorageUnit}
     */
    getStorage() {
        return this.storage
    }
}

module.exports = MarketManager;