const Logs = require('utils/Logs');
const FlowType = require('core/flow/FlowType');
const {RECYCLER} = require('core/enum/BotRole');

const flowChart = [
    FlowType.COLONIES,
    FlowType.SPAWNER,
    FlowType.MINING,
    FlowType.UPGRADE,
    FlowType.CONSTRUCT,
]

class InjectRemote {

    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        this.gameAccess = gameAccess;
        this.roomDataFactory = roomDataFactory;

        this.overrideOutput = false;

        Logs.logData('InjectRemote Initialed !')
    }

    updateStart() {
        if (this.overrideOutput === true) {
            const originalConsoleLog = console.log;
            console.log = function() {
                const args = Array.prototype.slice.call(arguments);
                Logs.log_override(args, originalConsoleLog)
            };
        }

        if (Game.time % 20 === 0) {
            this.run();
        }
    }
    export() {
        Logs.log('Export ...')
        this.roomDataFactory.getAllRoomData()
            // .map(value => )
            .forEach(value => Logs.logData(`roomData[${value.room}]`, JSON.stringify(value)))
    }

    run() {
        // const startTime = Game.cpu.getUsed();

        // Logs.log('Injected agent')
        // this.export();
        this.roomDataFactory.getAllRoomData().forEach(rd => {
            // const sysMarket = rd.getSysMarket();
            // const sysColon = rd.getSysColon();
            const mainStorage = rd.getSysStorage().getMainStorage();

            if (mainStorage != null) {
                // Logs.logChart('mineral', sysMarket.mineralRoom, mainStorage.getStore().getUsedCapacity(sysMarket.mineralRoom))
                // const terminal = rd.getRoomGame().terminal;
                // if (terminal != null && sysMarket.mineralRoom != null) {
                //     Logs.logChart('mineral', sysMarket.mineralRoom + '-term', terminal.store.getUsedCapacity(sysMarket.mineralRoom))
                //
                // }
                Logs.logChart('energy', rd.room, mainStorage.getEnergy())
            }

            if (rd.room === 'W32S39') {
                const flowSys = rd.getSysCity().getSysFlow();
                flowChart.map(f => flowSys.getFlowUnit(f))
                    .filter(f => f != null)
                    .forEach(f => Logs.logChart(
                        'flow', f.typeResource + '-' + rd.room, f.getTotalFlow()))
            }


            // const ms = rd.getSysCity().getSysFlow().getFlowUnit(FlowType.MAIN_STORAGE)
            // Logs.logChart('flow', ms.typeResource + '-' + rd.room, ms.getTotalFlow());

            const controller = Game.rooms[rd.room].controller;
            this.level = controller.level;
            const levelP = (controller.progress / controller.progressTotal) * 100
            const progressLevel = Math.round(levelP * 100) / 100;
            Logs.logChart('level', rd.room, progressLevel);
            // Logs.logChart('energy', rd.room + '-Nexus', this.gameAccess.getRoom(rd.room).energyAvailable)

            const creeps = rd.getCreepsForSpawn();
            const creepsRecycler = creeps.filter(r => r.memory.role === RECYCLER)
            Logs.logChart('creep', 'REC-' + rd.room, creepsRecycler.length);
            // Logs.logChart('creep', 'COL-' + rd.room, creepColonies.length);
            Logs.logChart('creep', rd.room, creeps.length);

            // Logs.logChart('market', `${rd.room}-Gain`, sysMarket.totalGain)


            // sysColon.getAllColon().forEach(c => {
            //     rd.getSysStorage().getAllStorageByRoom(c.roomName)
            //         .forEach((value, index) => {
            //             Logs.logChart('colonie', `${c.roomName}-${index}`, value.getEnergy())
            //         })
            // });

            // Worker
            // /** @type {WorkerCreepAbstract[]} */
            // const sysWorkers = [rd.getSysColoniesWorker(), rd.getSysWorker(), rd.getSysTransporter()];
            // sysWorkers
            //     .forEach(e => {
            //         Logs.logChart('worker', `${e.roomName}-${e.workerName}`, e.getMetricWorker() * 100)
            //     })
        })
        // Logs.log(`command run in ${Game.cpu.getUsed() - startTime}`)


    }

    /**
     * @param value {boolean}
     */
    setOverrideOutput(value) {
        this.overrideOutput = value;
    }
}

module.exports = InjectRemote;