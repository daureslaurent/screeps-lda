const USE_MEMORY = true;

class MarketRef {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;

        this.resourcesTracked = []
        /** @type {Map<string, {
         *  trxFees: any,
         *  reelGain: number,
         *  reelPrice: number,
         *  liquid: number,
         *  price: number }>} */
        this.resourcesData = undefined;

        this.constructMemory();
        if (USE_MEMORY === true) {
            this.loadMemory();
        }
    }

    constructMemory() {
        // if (USE_MEMORY === false) {
        //     Memory.market = undefined
        //     delete Memory.market
        //     return
        // }
        if (!Memory.market) {
            Memory.market = {}
        }
        if (!Memory.market[this.roomName]) {
            Memory.market[this.roomName] = {}
        }
        if (!Memory.market[this.roomName].ref) {
            Memory.market[this.roomName].ref = {}
        }
    }
    saveMemory() {
        if (USE_MEMORY === true) {
            Memory.market[this.roomName].ref.resourcesData = this.resourcesData.values();
            Memory.market[this.roomName].ref.resourcesTracked = this.resourcesTracked;
        }
    }
    loadMemory() {
        const memory = Memory.market[this.roomName].ref
        if (memory) {
            this.resourcesData = new Map();
            console.log(JSON.stringify(memory.resourcesData))
            // if (memory.resourcesData.length !== undefined) {
            //     memory.resourcesData.forEach(a => this.resourcesData.set(a[0], a[1]))
            // }
            this.resourcesTracked = memory.resourcesTracked || [];
        }
    }

    /**
     * @param resource
     * @param typeOrder ORDER_SELL => Buy res | ORDER_BUY => Sell res
     * @param amount
     * @return {Order}
     */
    findOrderReady(resource, typeOrder, amount = 5000) {
        /** @type {Order[]} */
        return  Game.market.getAllOrders({type: typeOrder, resourceType: resource})
            .filter(o =>  o.amount >= amount)
            .map(v => {
                const postAmount = Math.min(v.amount, amount)
                const amountCost = postAmount * v.price;
                const trxCost = Game.market.calcTransactionCost(postAmount, this.roomName, v.roomName);
                v.cost = amountCost
                v.costTrx = trxCost
                // v.costTrxRatio = Math.round( (trxCost / postAmount) * 100)/100
                if (resource === RESOURCE_ENERGY) {
                    v.sortCost = v.cost / (postAmount - trxCost)
                }
                else {
                    const process = this.getPrice(RESOURCE_ENERGY) * trxCost
                    v.sortCost = v.cost + (typeOrder === ORDER_SELL ? process : -process)
                }
                return v;
            })
            .sort((a, b) => typeOrder === ORDER_SELL
                ? a.sortCost - b.sortCost
                : b.sortCost - a.sortCost)
            .slice(0, 1)[0]
    }

    updatePrice() {
        if (this.resourcesTracked.length < 1) {
            this.resourcesTracked.push(RESOURCE_ENERGY);
        }

        this.resourcesTracked.forEach(resource => {
            const amount = 1000;
            const order = this.findOrderReady(resource, ORDER_SELL, amount);
            if (order != null) {
                const trxCost = Game.market.calcTransactionCost(amount, this.roomName, order.roomName);
                const postCostCredit = amount * order.price;
                const gainEnergy = (postCostCredit) / (amount - trxCost)
                this.resourcesData.set(resource, {
                    price: Math.round(gainEnergy * 1000) / 1000,
                    liquid: order.amount,
                    trxFees: trxCost,
                    reelPrice: order.price,
                    reelGain: amount - trxCost,
                })
            }
        })

        this.saveMemory();
    }

    getPrice(resource) {
        if (this.resourcesData.has(resource)) {
            return this.resourcesData.get(resource).price
        }
        return undefined;
    }
    getLiquid(resource) {
        if (this.resourcesData.has(resource)) {
            return this.resourcesData.get(resource).liquid
        }
        return undefined;
    }

    getMapData(resource) {
        if (this.resourcesData.has(resource)) {
            return this.resourcesData.get(resource)
        }
        const contain = this.resourcesTracked
            .filter(r => r === resource)
            .length > 0;
        if (!contain) {
            this.resourcesTracked.push(resource);
        }
        return undefined;
    }

}

module.exports = MarketRef;