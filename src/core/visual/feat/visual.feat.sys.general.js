const _moduleVisual = require('core/visual/visual._module');
const RoomData = require('core/game/RoomData');
const NeedsGame = require('core/interface/model.needsGame');
const VisualUiBox = require('core/visual/visual.ui.box')
const VisualUiSelector = require('core/visual/visual.ui.selector')
const BotRole = require('core/enum/BotRole');
const FlowType = require('core/flow/FlowType')

class VisualFeatSysGeneral extends _moduleVisual {

    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('VisualFeatSysGeneral', NeedsGame.ALL, gameAccess);
        this.roomData = roomData;
        this.room = roomData.room;
        this.roomVisual = roomData.getRoomGame().visual;

    }

    banner() {
    }

    logSpawner(summary) {
        if (summary == null) {
            return 'Null summary !';
        }
        let log = ''
        Object.entries(summary).forEach(([key, value]) => {
            if (key !== 'count') {
                log += `${key.substring(0, 3)}[${value}] `
            }
        });
        return log;
    }

    run() {
        const room = this.roomData.getRoomGame();
        const flag = Game.flags[room.name + 'G'];
        const final = flag != null ? flag : room.controller;
        this.drawGeneral(room.visual, final.pos);
    }


    /**
     *
     * @param pos {RoomPosition}
     * @param roomVisual {RoomVisual}
     */
    drawGeneral(roomVisual, pos) {
        const sysCity = this.roomData.getSysCity();
        const sysStorage = this.roomData.getSysStorage();
        const sysColon = this.roomData.getSysColon();
        const box = new VisualUiBox(
            roomVisual,
            pos,
        );
        const spawnerSummary = sysCity.getSpawnSummary();
        const spawnerLog = this.logSpawner(spawnerSummary);

        const storagesCity = sysStorage.getAllStorage();
        const mainStorage = sysStorage.getMainStorage();
        const outsideStorage = sysStorage.getAllStorageNotInRoom();
        box.setTitle('General City')


        box.addLine(` == Alarm ${JSON.stringify(sysCity.getCityAlarm(this.gameAccess.getTime()))} ==`)
        box.addLine(' == Summary: ' + spawnerLog)
        box.addLineChunk(`Future: ${sysCity.getSpawnFuture()}`)
        box.addLineChunk(`Future: ${sysCity.getLastSpawnError()}`)
        // box.addLine("👷 " + (sysCity.getNeedBuilder() ? '++' : '✅'))
        box.addLine(` == Energy [${sysCity.energyHistory.length}] ==`)
        box.addLine(` fill[${sysCity.needRefill()}] S[${sysCity.spawnFill}] E[${sysCity.extensionFill}] T[${sysCity.towerFill}]`)
        box.addLine(` [${sysCity.getAverageEnergy()}]` +
            ` c[${sysCity.getCurrentEnergy()}] TM[${sysCity.getEnergyTopMax()}]`)
        // box.addLine(` City[${sysCity.getStoredMainEnergy()}] Main[${sysCity.getStoredMainEnergy()}] Colon[${sysCity.getStoredColonEnergy()}] ==`)
        box.addLine(` == Storage [${storagesCity.length}] ==`)
        if (mainStorage) {
            box.addLine(`🪙 ${mainStorage.getEnergy()} (${mainStorage.getFuture(RESOURCE_ENERGY)})`)
        } else {
            box.addLine(`no MainStorage ! ==`)
        }

        // FLOW
        const sysFlow = sysCity.getSysFlow();
        const controller = this.roomData.getRoomGame().controller;
        const levelETA = (controller.progressTotal - controller.progress) / sysFlow.getFlowUnit(FlowType.UPGRADE).getFastFlow()
        box.addLine(`LevelETA: ${Math.round(levelETA)} ticks`)
        const colonies = sysColon.getColons();
        box.addLine(` == Colonies [${colonies.length}] ==`)
        const totalGain = sysColon.getColons()
            .map(c => c.getEnergyExchange().reduce((total, value) => total + value.amount, 0))
            .reduce((total, value) => total + value, 0)

        box.addLine(`[TOTAL]  \t💰 ${totalGain}`)
        colonies.forEach((colon, index) => {
            const storage = sysStorage.getAllStorageByRoom(colon.roomName);
            const storagePresent = storage.length > 0 && colon.containStorage
            const totalEnergyMultiples = storage.map(s => s.getEnergy())
                .reduce((total, value) => total + value, 0)
            const totalEnergyFutureMultiples = storage.map(s => s.getFuture(RESOURCE_ENERGY))
                .reduce((total, value) => total + value, 0)
            const logStorage = storagePresent ?
                `🪙 ${totalEnergyMultiples}(${totalEnergyFutureMultiples})` :
                '⭕'
            const gainData = colon
                .getEnergyExchange()
                .map(v => v.amount)
                .reduce((total, value) => total + (value >= 0 ? value : 0), 0);
            const costData = colon
                .getEnergyExchange()
                .map(v => v.amount)
                .reduce((total, value) => total + (value < 0 ? value : 0), 0);


            const gain = '💸' + colon.getTotalGain() +
                `(${gainData}/${costData})`
            const constructed = colon.constructed ? '🧱' : '🛠️'
            const hostileLog = colon.hostile ? '👾' : '✅'
            const explored = colon.explored ? '🔎' : '🙈'
            const sources = colon.getCountSource();
            const active = colon.active ? '🟢' : '🟠'
            const tagged = colon.getTag() ? '🟢' : '🟠'

            const creepsPresent = colon.getCountCreeps();
            const creeps = creepsPresent > 0 ? '👽' + colon.getCountCreeps() : ''

            const creepsCarryPresent = colon.getCountByRole(BotRole.CARRY_COLON);
            const creepsCarry = creepsCarryPresent > 0 ? '🚡' + creepsCarryPresent : ''

            const creepsBuilderPresent = colon.getCountByRole(BotRole.RODRIGO);
            const creepsBuilder = creepsBuilderPresent > 0 ? '👷‍♂️' + creepsBuilderPresent : ''

            const hostileOwner = colon.hostile ? '🤬' + colon.getHostileOwner() : ''
            const workAmount = colon.getAmountWork() > 0 ? '👷' + colon.getAmountWork() : ''
            const distance = '⌚' + colon.getDistance()
            const olderTime = colon.getEnergyExchange().length > 0 ?
                this.gameAccess.getTime() - colon.getEnergyExchange().slice(0, 1)[0].time : 0
            const dataSize = '💾' + colon.getEnergyExchange().length + `(${olderTime})`
            box.addLine(`[${index}][${colon.roomName}]\t` +
                `${constructed}` +
                `${hostileLog}` +
                `${explored}` +
                `${sources}` +
                `${active}` +
                `${tagged}` +
                `${logStorage}\t` +
                `${creeps}\t` +
                `${creepsCarry}\t` +
                `${creepsBuilder}\t` +
                `${distance}\t` +
                `${workAmount}\t`
                // + `${rendementEnd}\t`
                +
                `${hostileOwner}\t` +
                `${gain}\t` +
                `${dataSize}\t`,
                // + `🪙 ${s.getEnergy()}(${s.getFuture(RESOURCE_ENERGY)}) `

            )
            // colon.getEnergyExchange()
            //     .slice(-3)
            //     .reverse()
            //     .forEach(r => {
            //         box.addLine(`[${colon.roomName}] R[${r.amount}][${this.gameAccess.getTime() - r.time}][${r.type}]`);
            //     })

        })


        box.draw();

    }


}

module.exports = VisualFeatSysGeneral;