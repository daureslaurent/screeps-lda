const _moduleVisual = require('core/visual/visual._module');
const AccessStorage = require('sys/storage/sys.storage.unit.access.model');
const NeedsGame = require('core/interface/model.needsGame');
const VisualUiBox = require('core/visual/visual.ui.box')
const VisualUiSelector = require('core/visual/visual.ui.selector')

class VisualFeatSysStorage extends _moduleVisual {

    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('VisualFeatSysStorage', NeedsGame.ALL, gameAccess);
        this.roomData = roomData;
        this.room = roomData.room;
        this.roomVisual = roomData.getRoomGame().visual;
    }

    banner() {
    }

    run() {
        const sysStorage = this.roomData.getSysStorage();
        sysStorage.getAllStorage()
            .filter(s => s.typeStorage !== STRUCTURE_TOWER)
            .forEach(value => {
                // this.drawSysStorageUnit(value.getStorage(), value, this.roomVisual);
            })

        const mainStorageId = sysStorage.getMainStorageId();
        const mainStorage = this.gameAccess.Game.getObjectById(mainStorageId);
        if (mainStorage) {
            const accesStyle = {
                radius: 0.2,
                // fill: storageUnit.access === AccessStorage.DEPOSIT ? "#c57b08"
                //     : storageUnit.access === AccessStorage.WITHDRAW ? "#1827d5"
                //         : "#47c01b",

                fill: '#c01b1b',
                opacity: 0.7,
            }
            this.roomVisual.circle(mainStorage.pos.x, mainStorage.pos.y + .3, accesStyle)

        }

        const flag = Game.flags[this.room + 'ST'];
        if (flag) {
            this.drawSysStorage(flag);
        }
    }


    /**
     *
     * @param storage
     * @param storageUnit {SysStorageUnit}
     * @param roomVisual {RoomVisual}
     */
    drawSysStorageUnit(storage, storageUnit, roomVisualMain) {
        if (!storage) {
            return;
        }
        const roomVisual = Game.rooms[storage.pos.roomName].visual;
        const box = new VisualUiBox(
            roomVisual,
            storage.pos,
        );

        const font = 0.4;
        const energy = storageUnit.getEnergy();
        const afterQueue = storageUnit.storageAfterPlay(RESOURCE_ENERGY);

        box.addLed(storageUnit.useInTick ? 'yellow' : 'green')
        box.addLed(storageUnit.access === AccessStorage.DEPOSIT ? '#c57b08' :
            storageUnit.access === AccessStorage.WITHDRAW ? '#1827d5' :
                '#47c01b')

        const store = storageUnit.getStore()
        const percentFilled = store.getUsedCapacity() / store.getCapacity()

        // Calculate the color based on the percentFilled value (black to green gradient)
        const red = Math.round(255 * (1 - percentFilled));
        const green = Math.round(255 * percentFilled);
        const blue = 0;

        // Set the color based on the calculation
        box.addLed(`rgb(${red}, ${green}, ${blue}`);

        const styleTxt = {
            color: '#ffffff',
            font: font,
            align: 'left',
            opacity: 0.6,
            stroke: '#000000FF',
        }
        const cityName = this.roomData.cityName;
        box.setTitle(`${energy} (${afterQueue}) .${cityName}`, styleTxt);

        const styleTxtQueue = {
            color: '#000000',
            font: font,
            align: 'left',
            opacity: 0.7,
            /*stroke: '#000000FF'*/
        }
        storageUnit.queue
            .sort((a, b) => b.time - a.timeout)
            .forEach(su => {
                const creepQueue = this.gameAccess.Game.getObjectById(su.creepId)
                const time = this.gameAccess.getTime()
                const timeout = su.timeout ? su.timeout - time : 'NTO'
                // const role = creepQueue ? creepQueue.memory.role || 'NOROLE' : 'NOCREEP'
                const name = creepQueue ? creepQueue.name || 'NO_NAME' : 'NO_CREEP'
                const retry = su.getRetry();
                // const remain = creepQueue.memory._move.path.length;

                box.addLine(
                    `${timeout}> ${su.amount < 0 ? '' : '+'}${su.amount}` +
                    ` ${name}${retry !== 0 ? '[' + retry + ']' : ''}`,
                    styleTxtQueue,
                );
                // box.addLineChunk(`${JSON.stringify(su)}`)
            })

        let menu = 0;

        if (Game.flags.UI_STORAGE) {
            const selector = new VisualUiSelector(
                roomVisual,
                Game.flags.UI_STORAGE.pos,
                'SET',
            )
            const styleSelect = {
                fill: '#232323',
            }

            selector.addSelector(0, styleSelect);
            selector.addSelector(1, styleSelect);
            selector.addSelector(2, styleSelect);
            selector.draw();
            menu = selector.getValue();
        }

        if (menu === 0) {
            const styleTxtHistory = {
                color: '#930000',
                font: font,
                align: 'left',
                opacity: 0.7,
                /*stroke: '#000000FF'*/
            }
            Array.from(storageUnit.getHistory())
                .sort((a, b) => b.finishAt - a.finishAt)
                .forEach(su => {
                    const creepQueue = this.gameAccess.Game.getObjectById(su.creepId)
                    const time = this.gameAccess.getTime()
                    const timing = su.finishIn !== undefined ? su.finishIn : 'NTO'
                    const state = su.state || 'ERR';
                    const name = creepQueue ? creepQueue.name || 'NO_NAME' : 'NO_CREEP'
                    const retry = su.getRetry();
                    const finishAt = su.finishAt;

                    box.addLine(`[${finishAt}][${state}][${timing}]` +
                        `[${su.amount < 0 ? '' : '+'}${su.amount}]` +
                        ` ${name}${retry !== 0 ? '[' + retry + ']' : ''}`,
                        styleTxtHistory,
                    )
                });
        } else if (menu === 1) {
            const styleTxtHistory = {
                color: '#930000',
                font: font,
                align: 'left',
                opacity: 0.7,
                /*stroke: '#000000FF'*/
            }
            if (storageUnit.stat.count > 0) {
                box.addLine(`c[${storageUnit.stat.count}](${storageUnit.history.length}) I[${storageUnit.stat.input}] O[${storageUnit.stat.output}]`, styleTxtHistory);
            } else {
                box.addLine(`Old data (${storageUnit.history.length})`, styleTxtHistory);
            }

        }


        box.draw();

    }


    drawSysStorage(flag) {
        const sysStorage = this.roomData.getSysStorage();

        const sysWorker = this.roomData.getSysWorker();
        const roomVisual = Game.rooms[flag.pos.roomName].visual;

        const box = new VisualUiBox(roomVisual, flag.pos);


        const storages = sysStorage.getAllStorage();

        const consumeEnergy = sysStorage.isConsumeEnergyFlag()
            && !this.roomData.getSysCity().needRefill();
        const consumeEnergyFlag = consumeEnergy ? '🔥' : '🐌';

        box.setTitle(`SysStorage [${storages.length}]`);
        const mainStorage = sysStorage.getMainStorageId();

        // const sysStorage = this.roomData.getSysStorage();
        const totalCount = sysStorage.getAllStorageByRoom(this.room)
            .map(s => s.getFuture(RESOURCE_ENERGY))
            .reduce((total, value) => total + value, 0);
        const totalMax = sysStorage.getAllStorageByRoom(this.room)
            .map(s => s.getStore().getCapacity())
            .reduce((total, value) => total + value, 0);
        box.addLine(`Total ${consumeEnergyFlag} -> ${totalCount}/${totalMax} ${Math.round((totalCount / totalMax) * 100)}`)

        roomVisual.circle(this.roomData.getSysCity().getWaitingPos(), {
            radius: 0.2,
            fill: '#2fff00',
            opacity: 0.7,
        })

        storages.forEach(storage => {
            const isMain = storage.id === mainStorage ? '🚀' : '⭕'
            const name = storage.id;
            const store = storage.getStore();

            const totalSpace = store.getCapacity();
            const usedSpace = store.getUsedCapacity();
            const storeLog = `${usedSpace} / ${totalSpace} (${storage.getFuture(RESOURCE_ENERGY)})`
            const home = storage.pos.roomName === this.room ? '🌆' : '🛬'
            const type = storage.typeStorage;
            const flux = '💱' + storage.queue.length
            const access = `a:${storage.access}`

            box.addLine(`[${storage.getPos().roomName}]${home}${isMain}💰${storeLog} 🏭${type} ${flux} ${access}`)
        })

        // const creepWorkers = this.roomData.getCreeps()
        //     .filter(c => c.role === BotRole.STARTER || c.roleTmp === BotRole.STARTER)
        //     .map(c => this.gameAccess.Game.getObjectById(c.id));
        //
        // box.setTitle(`SysWorker [${creepWorkers.length}]`);
        // const totalBody = creepWorkers.map(c => {return {
        //     work: utils.countBody(c.body, WORK),
        //     carry: utils.countBody(c.body, CARRY),
        //     move: utils.countBody(c.body, MOVE),
        // }})
        //     .reduce((total, value) => {
        //         total[WORK] += value.work;
        //         total[CARRY] += value.carry;
        //         total[MOVE] += value.move;
        //         return total;
        //     }, {work: 0, carry: 0, move: 0})
        //
        // const bodyUsage = sysWorker.getBodyUsage();
        // box.addLine(`Total body \tWORK[${totalBody.work}] \tCARRY[${totalBody.carry}] \tMOVE[${totalBody.move}]`)
        // box.addLine(`Usage body \tWORK[${bodyUsage.work}] \tCARRY[${bodyUsage.carry}] \tMOVE[${bodyUsage.move}]`)
        //
        // creepWorkers
        //     .filter(c => c != null)
        //     .sort((a, b) => b.memory.bodyCost - a.memory.bodyCost)
        //     .forEach(c => {
        //         // c = new Creep()';
        //         const name = c.name.slice(-5)
        //         const worker = c.memory.worker;
        //         const ledWorker = worker === undefined ? '🟢' : '🟡';
        //         const strLive = c.memory.needEvolve
        //             ? c.ticksToLive > 200
        //                 ? '🟣'
        //                 : '🟡'
        //             : c.memory.role !== BotRole.RECYCLER
        //                 ? '🟢'
        //                 : '🔴'
        //
        //
        //         const isRunning = worker !== undefined && worker.runningId !== undefined;
        //         let strRunning = ''
        //         if (isRunning) {
        //             const running = sysWorker.getRunning(worker.runningId)
        //             strRunning = running !== undefined ? running.type : ''
        //         }
        //
        //
        //         const isAction = worker !== undefined && worker.actionId !== undefined;
        //         let strActionRec = '';
        //         if (isAction && c.memory.role === BotRole.STARTER){
        //             strActionRec = this.actionStringRecursiveAction(sysWorker, sysWorker.getAction(worker.actionId), '')
        //         }
        //
        //         const runningWork = sysWorker.getRunning()
        //         box.addLine(`[${name}][${c.memory.bodyCost}]`
        //             +` ${ledWorker}${strLive} [${strRunning}] ${strActionRec}`)
        //     })

        box.draw();

    }

    actionStringRecursiveAction(sysWorker, action, out) {
        out += `->[${action != null ? action.type : 'null'}]`;
        if (action !== undefined && action.treeChild !== undefined) {
            return this.actionStringRecursiveAction(sysWorker, sysWorker.getAction(action.treeChild), out);
        } else {
            return out;
        }
    }

}

module.exports = VisualFeatSysStorage;