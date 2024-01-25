const _moduleVisual = require('core/visual/visual._module');
const NeedsGame = require('core/interface/model.needsGame');
const VisualUiBox = require('core/visual/visual.ui.box')
const BotRole = require('core/enum/BotRole')
const utils = require('utils/utils')

// const DEFAULT_ROOM = 'E22S34'
// const DEPOSIT_STYLE = {
//     radius: 0.2,
//     fill: 'blue',
//     opacity: 0.7,
// }
// const WITHDRAW_STYLE = {
//     radius: 0.2,
//     fill: 'green',
//     opacity: 0.7,
// }
// const WITHDRAW_STYLE_PRINCIPALS = {
//     radius: 0.2,
//     fill: 'green',
//     opacity: 0.7,
// }
// const WITHDRAW_STYLE_CARRY = {
//     radius: 0.2,
//     fill: 'yellow',
//     opacity: 0.7,
// }

class VisualFeatSysTransporter extends _moduleVisual {

    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('VisualFeatSysTransporter', NeedsGame.ALL, gameAccess);
        this.roomData = roomData;
        this.room = roomData.room;
        this.roomVisual = roomData.getRoomGame().visual;
    }

    banner() {
    }

    run() {
        const flag = Game.flags[this.room + 'T']
        if (flag) {
            // this.drawSysWroker(flag);
        }
    }


    drawSysWroker(flag) {
        const sysTransporter = this.roomData.getSysTransporter();
        const roomVisual = Game.rooms[flag.pos.roomName].visual;

        const box = new VisualUiBox(
            roomVisual,
            flag.pos,
        );

        const creepWorkers = this.gameAccess.getAllCreepsArray()
            .filter(c => c.role === BotRole.TRANSPORTER || c.roleTmp === BotRole.TRANSPORTER)
            .filter(c => c.baseRoom === this.roomData.room)
            .map(c => this.gameAccess.Game.getObjectById(c.id));

        // const creepWorkers = this.gameAccess.getCreepsByRoom(this.room)
        //     .filter(c => c.role === BotRole.TRANSPORTER || c.roleTmp === BotRole.TRANSPORTER)
        //     .map(c => this.gameAccess.Game.getObjectById(c.id));

        box.setTitle(`sysTransporter [${creepWorkers.length}]`);
        const totalBody = creepWorkers.map(c => {
            return {
                work: utils.countBody(c.body, WORK),
                carry: utils.countBody(c.body, CARRY),
                move: utils.countBody(c.body, MOVE),
            }
        })
            .reduce((total, value) => {
                total[WORK] += value.work;
                total[CARRY] += value.carry;
                total[MOVE] += value.move;
                total.count += value.work + value.carry + value.move
                return total;
            }, {
                work: 0,
                carry: 0,
                move: 0,
                count: 0,
            })

        const totalCharge = creepWorkers
            .filter(c => c != null)
            .map(c => c.ticksToLive)
            .reduce((total, value) => total + value, 0)
        const averageCharge = (totalCharge / creepWorkers.length) / CREEP_LIFE_TIME;
        const showAverageCharge = `${Math.round((averageCharge * 100) * 10) / 10}`
        const metricWorker = sysTransporter.getMetricWorker()
        box.addLine(`Usage -> average: ${sysTransporter.getAverageUsage()} ⚡${showAverageCharge} 🏭${metricWorker}`)

        const orderMinimal = sysTransporter.getWorkerOrder().getOrder()
            .map(o => o.type)
            .reduce((total, value) => total + `[${value}]`, '')
        box.addLine(`Order ${sysTransporter.getWorkerOrder().getOrder().length}: ${orderMinimal}`)
        sysTransporter.getWorkerOrder().getOrder().forEach(order => {
            roomVisual.circle(order.pos, {
                radius: 0.2,
                fill: '#ff0000',
            });
        })
        box.addLine(`Running ${sysTransporter.getWorkerRunning().getAllRunning().length}`)
        sysTransporter.getWorkerRunning().getAllRunning().forEach(order => {
            roomVisual.circle(order.pos, {
                radius: 0.2,
                fill: '#0012ff',
            });
        })
        // sysTransporter.getOrder().forEach(order => {
        //     roomVisual.circle(order.pos, {radius: 0.5, fill: '#6b09ff'});
        // })
        box.addLine(`Action ${sysTransporter.getWorkerAction().getActions().length}`)
        // sysTransporter.getOrder().forEach(order => {
        //     roomVisual.circle(order.pos, {radius: 0.5, fill: '#6b09ff'});
        // })

        const localWorker = creepWorkers
            .filter(c => c != null)
            .filter(c => c.pos.roomName === this.room)
            .sort((a, b) => b.memory.bodyCost - a.memory.bodyCost);

        const extWorker = creepWorkers
            .filter(c => c != null)
            .filter(c => c.pos.roomName !== this.room)
            .sort((a, b) => b.memory.bodyCost - a.memory.bodyCost);

        localWorker.forEach(c => {
            // c = new Creep()';
            const name = `${c.name.slice(-3)}`
            const worker = c.memory.worker;
            const ledWorker = worker === undefined ? '🟢' : '🟡';
            const carry = c.store[RESOURCE_ENERGY] === 0 ?
                '🟢' :
                c.store.getFreeCapacity(RESOURCE_ENERGY) === 0 ?
                    'Ⓜ️' :
                    '🟡';
            const strLive = c.memory.needEvolve ?
                c.ticksToLive > 200 ?
                    '🟣' :
                    '🟡' :
                c.memory.role !== BotRole.RECYCLER ?
                    '🟢' :
                    '🔴'
            const charge = Math.round(((c.ticksToLive / CREEP_LIFE_TIME) * 100) * 10) / 10;


            const isRunning = worker !== undefined && worker.runningId !== undefined;
            let strRunning = ''
            if (isRunning) {
                const running = sysTransporter.getWorkerRunning().getRunning(worker.runningId)
                strRunning = running !== undefined ? running.type : ''
            }


            const isAction = worker !== undefined && worker.actionId !== undefined;
            let strActionRec = '';
            if (isAction && c.memory.role === BotRole.TRANSPORTER) {
                strActionRec = this.actionStringRecursiveAction(sysTransporter, sysTransporter.getWorkerAction().getAction(worker.actionId), '')
            }

            const runningWork = sysTransporter.getWorkerRunning().getRunning()
            box.addLine(`[${name}][${c.memory.bodyCost}]` +
                ` ${ledWorker}${strLive}${carry} [${strRunning}] ${strActionRec} ${'⚡' + charge}`)
        })

        box.addLine(' === EXT ===')

        extWorker.forEach(c => {
            // c = new Creep()';
            const name = `${c.pos.roomName}|${c.name.slice(-3)}`
            const worker = c.memory.worker;
            const ledWorker = worker === undefined ? '🟢' : '🟡';
            const carry = c.store[RESOURCE_ENERGY] === 0 ?
                '🟢' :
                c.store.getFreeCapacity(RESOURCE_ENERGY) === 0 ?
                    'Ⓜ️' :
                    '🟡';
            const strLive = c.memory.needEvolve ?
                c.ticksToLive > 200 ?
                    '🟣' :
                    '🟡' :
                c.memory.role !== BotRole.RECYCLER ?
                    '🟢' :
                    '🔴'
            const charge = Math.round(((c.ticksToLive / CREEP_LIFE_TIME) * 100) * 10) / 10;


            const isRunning = worker !== undefined && worker.runningId !== undefined;
            let strRunning = ''
            if (isRunning) {
                const running = sysTransporter.getWorkerRunning().getRunning(worker.runningId)
                strRunning = running !== undefined ? running.type : ''
            }


            const isAction = worker !== undefined && worker.actionId !== undefined;
            let strActionRec = '';
            if (isAction && c.memory.role === BotRole.TRANSPORTER) {
                strActionRec = this.actionStringRecursiveAction(sysTransporter, sysTransporter.getWorkerAction().getAction(worker.actionId), '')
            }

            const runningWork = sysTransporter.getWorkerRunning().getRunning()
            box.addLine(`[${name}][${c.memory.bodyCost}]` +
                ` ${ledWorker}${strLive}${carry} [${strRunning}] ${strActionRec} ${'⚡' + charge}`)
        })

        box.draw();

    }

    actionStringRecursiveAction(sysTransporter, action, out) {
        out += `->[${action != null ? action.type : 'null'}]`;
        if (action !== undefined && action.treeChild !== undefined) {
            return this.actionStringRecursiveAction(sysTransporter, sysTransporter.getWorkerAction().getAction(action.treeChild), out);
        } else {
            return out;
        }
    }

}

module.exports = VisualFeatSysTransporter;