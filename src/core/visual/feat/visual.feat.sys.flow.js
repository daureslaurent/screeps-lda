const _moduleVisual = require('core/visual/visual._module');
const NeedsGame = require('core/interface/model.needsGame');
const VisualUiBox = require('core/visual/visual.ui.box')
const BotRole = require('core/enum/BotRole')
const FlowType = require('core/flow/FlowType');

class VisualFeatSysFlow extends _moduleVisual {

    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(gameAccess, roomData) {
        super('VisualFeatSysFlow', NeedsGame.ALL, gameAccess);
        this.roomData = roomData;
        this.room = roomData.room;
        this.roomVisual = roomData.getRoomGame().visual;
    }

    banner() {
    }

    run() {
        const flag = Game.flags[this.room + 'F']
        if (flag) {
            this.drawSysFlow(flag);
        }
    }


    drawSysFlow(flag) {
        const roomVisual = Game.rooms[flag.pos.roomName].visual;

        const box = new VisualUiBox(
            roomVisual,
            flag.pos,
        );

        const creepWorkers = this.gameAccess.getCreepsByRoom(this.room)
            .filter(c => c.role === BotRole.STARTER || c.roleTmp === BotRole.STARTER)
            .map(c => this.gameAccess.Game.getObjectById(c.id));

        box.setTitle(`SysFlow`);

        const sysFlow = this.roomData.getSysCity().getSysFlow();
        box.addLine(`== FLOW == [${sysFlow.getFlowUnits().length}]`)
        sysFlow.getFlowUnits()
            .sort((a, b) => Math.abs(b.getTotalFlow()) - Math.abs(a.getTotalFlow()))
            .forEach(fu => {
                const name = fu.typeResource.substring(0, 3);
                const maxTime = Game.time - fu.getOldestTime()
                const diff = fu.getDiff() === 1 ? '↗️' : fu.getDiff() === -1 ? '⏬' : '🟰'

                box.addLine(`[${name}]${diff}\t ${fu.getTotalFlow()}/tick | ${fu.getLastFlow()} || ${fu.getTotalResource()} 🚩${fu.flowData.size} | ${maxTime}`)
            })
        box.addLine(' === FIXED ===')
        sysFlow.getFlowUnitsFixed()
            .sort((a, b) => Math.abs(b.getTotalFlow()) - Math.abs(a.getTotalFlow()))
            .forEach(fu => {
                const name = fu.typeResource.substring(0, 3);
                const maxTime = Game.time - fu.getOldestTime()
                const diff = fu.getDiff() === 1 ? '↗️' : fu.getDiff() === -1 ? '⏬' : '🟰'

                box.addLine(`[${name}]${diff}\t ${fu.getTotalFlow()}/tick | ${fu.getLastFlow()} || ${fu.getTotalResource()} 🚩${fu.flowData.size} | ${maxTime}`)
            })
        box.addLine(' === TOTAL ===')

        const totalFlow = sysFlow.getFlowUnits()
            .map(fu => fu.getTotalFlow())
            .reduce((total, value) => total + value, 0);
        const totalFlowInstant = sysFlow.getFlowUnits()
            .map(fu => fu.getLastFlow())
            .reduce((total, value) => total + value, 0);

        const totalFastFlow = sysFlow.getFlowUnits()
            .map(fu => fu.getFastFlow())
            .reduce((total, value) => total + value, 0);

        const totalTotalFlow = sysFlow.getFlowUnits()
            .map(fu => fu.getTotalResource())
            .reduce((total, value) => total + value, 0);

        const totalFlowReport = `${Math.round(totalFlow * 10) / 10}/tick | inst ${Math.round(totalFlowInstant * 10) / 10} | fast: ${Math.round(totalFastFlow * 10) / 10} || ${totalTotalFlow}`
        box.addLine(totalFlowReport);
        box.addLine(`💰[${this.roomData.getSysStorage().getMainStorage().getEnergy()}] (${sysFlow.getFlowUnit(FlowType.MAIN_STORAGE).getTotalFlow()}/tick)`)
        box.addLine(`- las[${sysFlow.getFlowUnit(FlowType.MAIN_STORAGE).getLastFlow()}] [${sysFlow.getFlowUnit(FlowType.MAIN_STORAGE).getTotalResource()}]`)
        box.draw();

    }

}

module.exports = VisualFeatSysFlow;