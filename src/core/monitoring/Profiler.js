const _moduleTech = require('core/interface/_moduleTech');
const DELIM_MODULE = '@'
const DELIM_NAME = '->'
const ENABLE_PROFILER = false;
const ENABLE_PROFILER_TIMING = false
const MAX_PROFILER_TIMING = 100;

class Profiler extends _moduleTech {
    constructor() {
        super('Profiler');
        this.profiler = [];
        this.profilerCreep = [];
        this.profilerCreepMap = new Map();
        this.timing = [];
        this.timingMap = new Map();

        this.sizeBuffTiming = 0;
    }


    run() {
        if (ENABLE_PROFILER_TIMING === true) {
            if (this.sizeBuffTiming < MAX_PROFILER_TIMING) {
                this.sizeBuffTiming++;
            }
            this.logTiming();
            this.logCreepTiming();
            this.timing = [];
            this.profilerCreep = [];
        }
        if (ENABLE_PROFILER) {
            this.logProfiler();
            this.profiler = [];
        }
    }

    logProfiler() {
        const result = {};
        for (let i = 0; i < this.profiler.length; i++) {
            const value = this.profiler[i];

            if (result[value]) {
                result[value]++;
            } else {
                result[value] = 1;
            }
        }
        console.log(`[${this.profiler.length}]#TOTAL`)
        Object.entries(result)
            .filter(value => value[1] > 10)
            .sort((a, b) => b[1] - a[1])
            .forEach(value => console.log(`[${value[1]}]${value[0]}`));
    }

    logTiming() {
        const maxTime = this.timing.reduce((total, v) => total + v.time, 0)
        const result = {};
        for (let i = 0; i < this.timing.length; i++) {
            const {
                name,
                time,
            } = this.timing[i];
            if (!result[name]) {
                result[name] = {
                    count: 0,
                    time: 0,
                }
            }
            result[name].count++;
            result[name].time += time;
        }

        Object.entries(result)
            .sort((a, b) => b[1].time - a[1].time)
            .forEach(v => {
                if (!this.timingMap.has(v[0])) {
                    this.timingMap.set(v[0], [])
                }
                const mapData = this.timingMap.get(v[0])
                mapData.push(v[1].time)
                if (mapData.length > MAX_PROFILER_TIMING) {
                    mapData.shift()
                }
            })


        this.timingMap.forEach((value, key) => {
            if (!result[key]) {
                value.push(0);
                if (value.length > MAX_PROFILER_TIMING) {
                    value.shift();
                }
            }
        })


        const resultAvg = {};
        this.timingMap.forEach((value, key) => {
            const arr = value.slice(1)
            resultAvg[key] = {
                time: value.reduce((total, v) => total + v, 0) / this.sizeBuffTiming,
                max: Math.max(...arr),
                last: value.slice(-1),
                count: value.length,
            }
        })
        console.log(`=== Profiling modules === bufferSize[${this.sizeBuffTiming}]`)
        Object.entries(resultAvg)
            .sort((a, b) => b[1].time - a[1].time)
            .forEach(v => {
                console.log(`[${v[1].time.toFixed(3)}][${Math.round(v[1].last * 100) / 100}] --> [${v[0]}]`)
            })
    }

    logCreepTiming() {
        const maxTime = this.profilerCreep.reduce((total, v) => total + v.time, 0)
        const result = {};
        for (let i = 0; i < this.profilerCreep.length; i++) {
            const {
                name,
                time,
            } = this.profilerCreep[i];
            if (!result[name]) {
                result[name] = {
                    count: 0,
                    time: 0,
                }
            }
            result[name].count++;
            result[name].time += time;
        }

        Object.entries(result)
            .sort((a, b) => b[1].time - a[1].time)
            .forEach(v => {
                if (!this.profilerCreepMap.has(v[0])) {
                    this.profilerCreepMap.set(v[0], [])
                }
                const mapData = this.profilerCreepMap.get(v[0])
                mapData.push(v[1].time / v[1].count)
                if (mapData.length > MAX_PROFILER_TIMING) {
                    mapData.shift()
                }
            })

        this.profilerCreepMap.forEach((value, key) => {
            if (!result[key]) {
                value.push(0);
                if (value.length > MAX_PROFILER_TIMING) {
                    value.shift();
                }
            }
        })

        const resultAvg = {};
        this.profilerCreepMap.forEach((value, key) => {
            const arr = value.slice(1)
            resultAvg[key] = {
                time: value.reduce((total, v) => total + v, 0) / this.sizeBuffTiming,
                max: Math.max(...arr),
                last: value.slice(-1),
                count: value.length,
            }
        })
        console.log(`=== Profiling creep === bufferSize[${this.sizeBuffTiming}]`)
        Object.entries(resultAvg)
            .sort((a, b) => b[1].time - a[1].time)
            .forEach(v => {
                console.log(`[${v[1].time.toFixed(3)}][${Math.round(v[1].last * 100) / 100}] --> [${v[0]}]`)
            })
    }

    traceName(name) {
        if (ENABLE_PROFILER === true) {
            this.profiler.push(name);
        }
    }

    trace(module, name) {
        if (ENABLE_PROFILER === true) {
            if (!name) {
                return this.traceName(module);
            }
            this.profiler.push(DELIM_MODULE + '[' + module + ']' + DELIM_NAME + name);
        }
    }


    /**
     * @param name {string}
     * @param time {Number}
     */
    traceTime(name, time) {
        this.timing.push({
            name: name,
            time: time,
        });
    }

    traceCreepTime(name, time) {
        this.profilerCreep.push({
            name: name,
            time: time,
        });
    }

    isTimingEnable() {
        return ENABLE_PROFILER_TIMING;
    }

}

module.exports = Profiler;