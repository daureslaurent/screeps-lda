const _moduleMonitoring = require('core/interface/_moduleMonitoring');
const Logs = require('utils/Logs');
const MAX_CPU_HISTORY = 50

class MonitoringCpu extends _moduleMonitoring {
    constructor() {
        super('MonitoringCpu');
        this.lastBucket = 0;
        this.tickHistory = [];
    }

    logFromCpu(cpu) {
        this.logCpuSummary(this.calculate(cpu))
    }

    calculate(cpu) {
        const multi = this.getMultiplicateDigits();
        const cpuUsed = (Math.round(cpu.getUsed() * multi) / multi)
            .toFixed(this.getNumberDigits());
        const diff = cpu.bucket - this.lastBucket;

        // const tickToPixel = Math.round((10000 - cpu.bucket) / diff);

        // Update tick history
        this.tickHistory.push(cpuUsed);
        if (this.tickHistory.length > MAX_CPU_HISTORY) {
            this.tickHistory.shift();
        }

        this.lastBucket = cpu.bucket;

        // Calculate average CPU usage for 5 and 20 ticks
        const avg5Ticks = this.calculateAverage(this.tickHistory.slice(-5));
        const avg20Ticks = this.calculateAverage(this.tickHistory.slice(-20));
        const avgMaxTicks = this.calculateAverage(this.tickHistory);

        return {
            used: cpuUsed,
            bucket: cpu.bucket,
            diff: diff,
            // tickToPixel: tickToPixel,
            avg5Ticks: avg5Ticks,
            avg20Ticks: avg20Ticks,
            avgMaxTicks: avgMaxTicks,
        };
    }


    calculateAverage(tickArray) {
        const sum = tickArray.reduce((total, tick) => total + parseFloat(tick), 0);
        return (sum / tickArray.length).toFixed(this.getNumberDigits());
    }

    logCpuSummary(cpuSummary) {
        const {
            used,
            bucket,
            /*tickToPixel,*/
            avg5Ticks,
            avg20Ticks,
            avgMaxTicks,
            diff,
        } = cpuSummary;
        console.log(`CPU    == [${used}] 5[${avg5Ticks}] 20[${avg20Ticks}] ${MAX_CPU_HISTORY}[${avgMaxTicks}] b[${bucket}][${diff}] t[${this.tickHistory.length}]`);
        if (Game.time % 5 === 0) {
            Logs.logChart('cpu', `cpu-${MAX_CPU_HISTORY}`, avgMaxTicks)
            Logs.logChart('cpu', `cpu-5`, avg5Ticks)
            Logs.logChart('cpu', `bucket`, bucket / 100)
        }

    }
}

module.exports = MonitoringCpu;