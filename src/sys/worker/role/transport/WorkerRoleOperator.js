const _moduleCityWorker = require('core/interface/_moduleCityWorker');
const WorkerType = require('sys/worker/core/model/WorkerType')
const actionHelper = require('sys/worker/core/sys/SysActionHelper');
const utils = require('utils/utils');
const BotRole = require('core/enum/BotRole');
const Logs = require('utils/Logs');
const AccessStorage = require('sys/storage/sys.storage.unit.access.model');

class WorkerRoleOperator extends _moduleCityWorker {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('WorkerRoleOperator', roomData.room, gameAccess, roomData, 1, WorkerType.OPERATOR);
    }

    /**
     *
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param order {WorkerOrder}
     */
    preWork(sysCity, sysWorker, sysStorage, order, creep) {
        return true;
        // return false;
    }

    /**
     * @param creep {Creep}
     * @param running {WorkerRunning}
     * @param sysCity {SysCity}
     * @param sysWorker {SysCityWorker}
     * @param sysStorage {SysStorageManager}
     */
    run(creep, running, sysCity, sysWorker, sysStorage) {
        if (creep.memory.role === BotRole.RECYCLER) {
            return true;
        }

        if (!creep.pos.isEqualTo(running.pos)) {
            return actionHelper.getFactory().actionMove(running.pos, creep.id, 0);
        }
        const sysMarket = sysCity.getSysMarket();
        const mainStorage = sysStorage.getMainStorage();
        const mainMineral = sysCity.getSysCityMineral().typeMineral;
        const link = sysStorage.getAllStorageAccess(AccessStorage.LINK_WITHDRAW)[0]

        if (sysMarket.getStorage() == null || sysMarket.mineralRoom == null) {
            return false;
        }

        return this.checkOperator(running, sysMarket, mainStorage, mainMineral, creep, link);
    }

    checkOperator(running, sysMarket, mainStorage, mainMineral, creep, link) {
        const needLinkWithdraw = link.getEnergy() > 0;

        const needEnergyTerminal = sysMarket.getNeedEnergy() > 0;
        const overEnergyTerminal = sysMarket.getNeedEnergy() < 0;

        // const currentMineralTerminal = sysMarket.getStorage().getStore().getUsedCapacity(mainMineral);
        const needTransfertMineral = sysMarket.getNeedMainMineral() > 0
        // Logs.logA(`Operator running: ${running.state} [${sysMarket.getNeedEnergy()}]- A: ${needEnergyTerminal} B: ${needTransfertMineral} C: ${overEnergyTerminal}`)
        const terminalId = sysMarket.getStorage().idStorage

        if ((!running.state) && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            return this.deposi(RESOURCE_ENERGY, creep.store.getUsedCapacity(RESOURCE_ENERGY),
                creep, mainStorage.idStorage)
        }

        const carry = utils.countBody(creep.body, CARRY) * 50;
        if (needLinkWithdraw) {
            utils.talkAction(creep, 'LINK')
            const linkAmount = link.getFuture(RESOURCE_ENERGY);
            const amount = Math.min(carry, linkAmount);
            return this.withdrawLink(RESOURCE_ENERGY, amount, creep, mainStorage, link.idStorage, running)
        }
        else if (needEnergyTerminal) {
            const needTerminal = sysMarket.getNeedEnergy();
            const amount = Math.min(carry, needTerminal);
            utils.talkAction(creep, `TERM E ${amount} - ${running.state}`)
            return this.fillTerminal(RESOURCE_ENERGY, amount, creep, mainStorage, terminalId, running)
        }
        else if (overEnergyTerminal) {
            utils.talkAction(creep, 'BOOST')
            const needTerminal = -sysMarket.getNeedEnergy();
            const amount = Math.min(carry, needTerminal);
            return this.fillStorage(RESOURCE_ENERGY, amount, creep, mainStorage, terminalId,  running)
        }
        else if (needTransfertMineral) {
            utils.talkAction(creep, 'TERM M')
            const needTerminal = sysMarket.getNeedMainMineral();
            const amount = Math.min(carry, needTerminal);
            if (amount < 0) {
                return false;
            }
            return this.fillTerminal(mainMineral, amount, creep, mainStorage, terminalId, running)
        }
        return false;
        // if (!running.state || running.state === '') {
        //     if (!sysMarket.ready) {
        //         const needTerminal = sysMarket.getNeedEnergy();
        //         const amount = Math.min(carry, needTerminal);
        //         if (mainStorage.getAvailable(RESOURCE_ENERGY, amount)) {
        //             running.state = 'FILL_TERM'
        //             utils.talkAction(creep, '😺');
        //             return actionHelper.getFactory().actionWithdrawHelper(
        //                 mainStorage.idStorage,
        //                 amount,
        //                 RESOURCE_ENERGY,
        //                 creep.id)
        //         }
        //     }
        // }
        // else if (running.state === 'FILL_TERM' && sysMarket.getStorage() != null) {
        //     const amount = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        //     if (amount === 0) {
        //         running.state = '';
        //         return false;
        //     }
        //     utils.talkAction(creep, `⛽[${sysMarket.getStorage().id}]`);
        //     running.state = ''
        //     return this.withdrawStorage(mainStorage.idStorage, amount, RESOURCE_ENERGY, creep)
        // }
    }

    fillTerminal(resource, amount, creep, mainStorage, terminalId, running) {
        if (running.state !== 'FILL_TERM') {
            if (mainStorage.getAvailable(resource, amount)) {
                running.state = 'FILL_TERM'
                utils.talkAction(creep, '😺');
                Logs.logA(`Operator withdrawStorage: ${mainStorage.idStorage} , ${amount}, ${resource}, ${creep}`)

                return this.withdraw(resource, amount, creep, mainStorage.idStorage)
            }
        }
        else if (running.state === 'FILL_TERM') {
            const amount = creep.store.getUsedCapacity(resource);
            if (amount === 0) {
                running.state = '';
                return false;
            }
            running.state = ''
            return this.deposi(resource, amount, creep, terminalId)
        }
    }

    withdrawLink(resource, amount, creep, mainStorage, linkId, running) {
        if (running.state !== 'FILL_LINK') {
            if (mainStorage.getAvailable(resource, amount)) {
                running.state = 'FILL_LINK'
                return this.withdraw(resource, amount, creep, linkId)
            }
        }
        else if (running.state === 'FILL_LINK') {
            const amount = creep.store.getUsedCapacity(resource);
            if (amount === 0) {
                running.state = '';
                return false;
            }
            running.state = ''
            return this.deposi(resource, amount, creep, mainStorage.idStorage)
        }
    }

    fillStorage(resource, amount, creep, mainStorage, terminalId, running) {
        if (running.state !== 'FILL_STORAGE') {
            if (mainStorage.getAvailable(resource, amount)) {
                running.state = 'FILL_STORAGE'
                utils.talkAction(creep, '😺');
                return this.withdraw(resource, amount, creep, terminalId)

            }
        }
        else if (running.state === 'FILL_STORAGE') {
            const amount = creep.store.getUsedCapacity(resource);
            if (amount === 0) {
                running.state = '';
                return false;
            }
            running.state = ''
            return this.deposi(resource, amount, creep, mainStorage.idStorage)

        }
    }

    withdraw(resource, amount, creep, targetId) {
        if (amount === 0) {
            return false
        }
        return actionHelper.getFactory().actionWithdrawHelper(
            targetId,
            amount,
            resource,
            creep.id)
    }
    deposi(resource, amount, creep, targetId) {
        if (amount === 0) {
            return false
        }
        return actionHelper.getFactory().actionDepositHelper(
            targetId,
            amount,
            resource,
            creep.id)
    }
}

module.exports = WorkerRoleOperator;