const _module = require('core/interface/_module');
const monitoringModules = [
    new (require('core/monitoring/monitoring.cpu')),
    new (require('core/monitoring/monitoring.memory')),
]

class Monitoring extends _module {
    constructor(gameAccess) {
        super('Monitoring', undefined, gameAccess);
    }

    run() {
        const cpu = Game.cpu;
        monitoringModules.forEach(module => module.logFromCpu(cpu))
    }
}

module.exports = Monitoring;