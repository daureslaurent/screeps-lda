const BotRole = require('core/enum/BotRole')
const VisualUiBox = require('core/visual/visual.ui.box')
const TYPE_MODEL = {
    CARRY: {
        want: [{
            type: BotRole.CARRY,
        },
            {
                type: BotRole.CARRY,
            },
            {
                type: BotRole.ATACKER,
            },
        ],
    },
    ATTACK: {
        want: [
            // {type: BotRole.ATACKER},
            // {type: BotRole.ATACKER},
            // {type: BotRole.ATACKER},
            {
                type: BotRole.ATACKER,
            },
            // {type: BotRole.HEALER},
            {
                type: BotRole.HEALER,
            },
            {
                type: BotRole.BAG,
            },
            {
                type: BotRole.BAG,
            },
            {
                type: BotRole.BAG,
            },
            {
                type: BotRole.BAG,
            },
            {
                type: BotRole.BAG,
            },
        ],
    },
    ATTACK_HEAVY: {
        want: [
            // {type: BotRole.ATACKER},
            // {type: BotRole.ATACKER},
            // {type: BotRole.ATACKER},
            {
                type: BotRole.ATACKER,
            },
            {
                type: BotRole.ATACKER,
            },
            {
                type: BotRole.ATACKER,
            },
            {
                type: BotRole.HEALER,
            },
            {
                type: BotRole.HEALER,
            },
            {
                type: BotRole.BAG,
            },
        ],
    },
    BAG: {
        want: [{
            type: BotRole.BAG,
        },
            {
                type: BotRole.BAG,
            },
            {
                type: BotRole.BAG,
            },
            {
                type: BotRole.BAG,
            },
            {
                type: BotRole.BAG,
            },
            // {type: BotRole.BAG},
            // {type: BotRole.BAG},
            // {type: BotRole.BAG},
            // {type: BotRole.HEALER},
        ],
    },
}

class SysWarriorUnit {
    /**
     *
     * @param roomName {string}
     * @param flagName {string}
     * @param type {WarriorType}
     */
    constructor(roomName, flagName, type) {
        this.roomName = roomName;
        this.flagName = flagName;
        this.type = type;

        this.want = TYPE_MODEL[type].want;
        this.creepMap = new Map();
        // this.creepIds = [];

    }

    pushCreep(type, id) {
        if (!this.creepMap.has(type)) {
            this.creepMap.set(type, [])
        }
        this.creepMap.get(type).push(id);
    }

    /**
     * @return {{}}
     */
    getSummary() {
        const wantSummary = {};
        this.want.forEach(w => {
            if (wantSummary[w.type] !== undefined) {
                wantSummary[w.type] += 1
            } else {
                wantSummary[w.type] = 1;
            }
        })

        const finalSummary = {}
        Object.entries(wantSummary)
            .forEach(v => {
                if (this.creepMap.has(v[0])) {
                    const nbPresent = this.creepMap.get(v[0]).length;
                    const finalWant = v[1] - nbPresent;
                    if (finalWant > 0) {
                        finalSummary[v[0]] = finalWant;
                    }
                } else {
                    finalSummary[v[0]] = v[1]
                }

            })
        return finalSummary;
    }

    /**
     * @param gameAccess {GameAccess}
     */
    // checkCreep(gameAccess) {
    //     const mapCreep = new Map();
    //     const creeps = this.creepIds
    //         .map(id => gameAccess.Game.getObjectById(id))
    //         .filter(c => c != null);
    //
    //     creeps.forEach(c => {
    //
    //         mapCreep.set(c.memory.warrior.type, c)
    //
    //     });
    //
    //     // this.want.forEach(w => )
    //
    // }

    /**
     * @return {string[]}
     */
    getCreepsId() {
        return Array.from(this.creepMap.values())
            .filter(s => s != null)
            .reduce((result, value) => {
                return result.concat(value);
            }, [])
    }

    /**
     * @return {RoomPosition}
     */
    getFlagPos() {
        return Game.flags[this.flagName].pos;
    }

    getGroup() {
        return this.flagName + '-' + this.roomName;
    }

    debugExternal(visual) {
        const box = new VisualUiBox(
            visual,
            this.getFlagPos(),
        );

        // const totalBodyFlow = this.getTotalBodyFlow();
        // const rawFlow = this.energy / this.ticksToRegeneration;
        // const flow = `Flow:  ${Math.round(rawFlow *10)/10}(${this.getNeedBodyFlow()}) Current: ${this.getTotalBodyFlow()}`
        box.setTitle(`Warrior Sys`)
        box.addLine(`TYpe: ${this.type}`)
        box.addLine(`flagName: ${this.flagName}`)

        this.getCreepsId()
            .map(id => Game.getObjectById(id))
            .filter(c => c != null && c.memory.warrior.type !== undefined)
            .forEach(c => {
                const charge = Math
                    .round(((c.ticksToLive / CREEP_LIFE_TIME) * 100) * 10) / 10;
                const life = Math.round((c.hits / c.hitsMax) * 100)
                box.addLine(`👽 ${c.memory.warrior.type} ⚡${charge} 🛟${life}`)
            })

        // box.addLine(`Energy ${this.energy} / ${this.energyCapacity}`);
        // box.addLine(`Regen  ${this.ticksToRegeneration}`);
        // box.addLine(`${flow}`);
        // box.addLine(`Distance  ${this.distanceToMain}`);
        // box.addLine(`WorkBench ${this.getFreeWorkBench()} / ${this.workBench.length}`);
        // const sysStorage = this.sysStorage;
        // if (sysStorage) {
        //     box.addLine(`Storage ${sysStorage.getEnergy()} (${sysStorage.getFuture(RESOURCE_ENERGY)})`);
        // }
        // this.workBench.forEach(wb => {
        //     box.addLine(`Wb [${wb.id}] - ${wb.getRegister() ? 'LOCKED' : 'FREE'}`);
        // })

        box.draw()
    }

}

module.exports = SysWarriorUnit;