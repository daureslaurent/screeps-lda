const _moduleMonitoring = require('core/interface/_moduleMonitoring');

class MonitoringMemory extends _moduleMonitoring {
    constructor() {
        super('MonitoringMemory');
    }

    logFromCpu(cpu) {
        this.logMemorySummary(this.calculate(cpu))
    }

    toMb(bytes) {
        return (Math.round((bytes / 1048576) * 100) / 100) + 'Mb';
    }

    calculate(cpu) {
        const multi = this.getMultiplicateDigits() - 1;
        const heap = cpu.getHeapStatistics();
        const used = heap.total_heap_size;
        const max = heap.heap_size_limit;
        const prct = (Math.round(((used / max) * 100) * multi) / multi)
            .toFixed(this.getNumberDigits() - 1);

        return {
            prct,
            used,
            max,
        };
    }

    logMemorySummary(memorySummary) {
        const {
            prct,
            used,
            max,
        } = memorySummary;
        console.log(`MEMORY == [${prct}%] [${this.toMb(used)}] [${this.toMb(max)}]`);
        // if (Game.time % 20 === 0) {
        //     Logs.logChart('cpu', `mem`, (used/max)*100)
        // }

    }
}

module.exports = MonitoringMemory;