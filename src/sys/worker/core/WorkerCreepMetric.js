class WorkerCreepMetric {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;

        this.bodyUsage = {}
        this.totalBodyCount = {};
        this.historyWorker = [];
        this.hotHistory = false;

        this.askSpawn = new Map();

        this.metricWorker = 1;
    }

    clean() {
        if (this.askSpawn.size > 0) {
            this.askSpawn.clear();
        }
    }

    /**
     * @return {number}
     */
    getMetricWorker() {
        return this.metricWorker;
    }

    /**
     * @param nbUsage {number}
     */
    pushWorkerUsage(nbUsage) {
        if (this.hotHistory === false && this.historyWorker.length >= 30) {
            this.historyWorker = [];
            this.hotHistory = true;
        }
        // console.log(`pushWorkerUsage ${nbUsage}`)
        this.historyWorker.push({
            count: nbUsage,
        })
        if (this.historyWorker.length > 100) {
            this.historyWorker.shift();
        }
    }

    /**
     * @return {number}
     */
    getAverageUsage() {
        const total = this.historyWorker.reduce((total, value) => total + value.count, 0);
        return Math.round((total / this.historyWorker.length) * 10) / 10
    }

    setMetricWorker(metric) {
        this.metricWorker = metric;
    }
    /**
     * @param type {string}
     */
    pushAskSpawn(type) {
        if (!this.askSpawn.has(type)) {
            this.askSpawn.set(type, 0)
        }
        this.askSpawn.set(type, this.askSpawn.get(type) + 1);
    }

    /**
     * @return {{count: number, type: string}[]}
     */
    getAskSpawn() {
        return Array.from(this.askSpawn)
            .filter(value => value[1] > 0)
            .map(value => {
                return {
                    type: value[0],
                    count: value[1],
                }
            })
    }

}

module.exports = WorkerCreepMetric;