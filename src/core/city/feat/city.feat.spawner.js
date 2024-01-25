const _moduleCityFeat = require('core/interface/_moduleCityFeat');
const BotRole = require('core/enum/BotRole')
const utilsSpawn = require('src/utils/utils.spawn')
const FlowType = require('core/flow/FlowType');
const SpawnerType = require('sys/spawner/model/SpawnerType');

const SPAWN_BY_LEVEL = {
    1: {
        atacker: 1,
        // carry: 2,
        // claimer: 0,
        // miner: 0,
        // builder: 0,
        eden: 0,
        // extractor: 0,
        starter: 4,
    },
    2: {
        atacker: 1,
        // carry: 1,
        // claimer: 0,
        // miner: 0,
        // builder: 0,
        eden: 0,
        // extractor: 0,
        // starter: 0,
    },
    3: {
        atacker: 1,
        // carry: 1,
        // claimer: 0,
        // miner: 0,
        // builder: 0,
        eden: 0,
        starter: 1,
        breaker: 0,
        // starter: 0,
    },
    4: {
        atacker: 1,
        // carry: 1,
        // claimer: 0,
        // miner: 0,
        // builder: 0,
        eden: 0,
        breaker: 0,
        starter: 1,
    },
    5: {
        atacker: 1,
        // carry: 1,
        // claimer: 0,
        // miner: 0,
        // builder: 0,
        eden: 0,
        breaker: 0,
        starter: 1,

        // extractor: 0,
    },
    6: {
        atacker: 1,
        // carry: 2,
        // claimer: 0,
        // miner: 0,
        // builder: 0,
        eden: 0,
        // extractor: 0,
        starter: 1,
        breaker: 0,
    },
}

const ROLE_ORDER = [
    BotRole.STARTER,
    BotRole.CARRY,
    BotRole.MINER,
    BotRole.CLAIMER,
    BotRole.BUILDER,
    BotRole.ATACKER,
    BotRole.EXTRACTOR,
    BotRole.BREAKER,
]

class CityFeatSpawner extends _moduleCityFeat {

    /**
     *
     * @param room
     * @param gameAccess
     * @param roomData {RoomData}
     */
    constructor(room, gameAccess, roomData) {
        super('CityFeatSpawner', room, gameAccess, roomData, 30);
        this.creepInProcess = [];
        this.summaryTmp = {};

    }

    slowRun() {
        const spawner = this.roomData.getSysSpawner();

        spawner.doSpawn(this.gameAccess, this.roomData);
        spawner.externalDebugVisual(this.gameAccess)
    }

    run() {
        this.slowRun();
        const sysCity = this.roomData.getSysCity();
        const summary = this.summaryCreep();
        sysCity.updateSpawnSummary(summary);
        // this.summaryTmp = summary;

        const creeps = this.roomData.getCreeps();
        this.checkEvolveCreep(creeps, summary);

        this.creepInProcess = this.creepInProcess
            .filter(creepWaiting => !creeps.includes(creepWaiting))

        const room = this.roomData.getRoomGame();
        const controllerLevel = room.controller.level;
        const levelRoom = controllerLevel >= 5 ? 5 : controllerLevel
        const currentEnergy = room.energyAvailable;

        if (summary.count < 1 && levelRoom >= 2) {
            this.spawn(BotRole.CARRY, 2)
        }
        let result;

        if (sysCity.getCityAlarm(this.gameAccess.getTime()).lowCity) {
            return this.spawnSystem(1, summary, sysCity);
        }
        if (currentEnergy >= 300) {
            result = this.spawnSystem(controllerLevel, summary, sysCity);
        }
        if (result !== OK) {
            this.roomData.getSysCity()
                .updateSpawnFuture(`spawnColonSystem`)
            this.spawnColonSystem();
        }
        if (sysCity.getNextCheckWorkerSpawner() < this.gameAccess.getTime()) {
            sysCity.setNextCheckWorkerSpawner(this.gameAccess.getTime() + 50);
        }
    }

    /**
     *
     * @param creeps {[]}
     * @param summary
     */
    checkEvolveCreep(creeps, summary) {
        creeps
            .sort((a, b) => a.ticksToLive - b.ticksToLive)
            .forEach(creep => {
                const level = this.roomData.getRoomLevel()
                const role = creep.role === BotRole.RECYCLER ? creep.roleTmp : creep.role

                if (creep.colon !== undefined) {
                    // Colon
                    const colonLevel = level > 5 ? 5 : level;
                    const {
                        body,
                        bodyCost,
                    } = this.processBodyByRoleLevel(role, colonLevel)
                    const isColonNotCarry = role !== BotRole.CARRY_COLON
                        /*&& (colonDistance !== undefined && colonDistance !== 0 && colonDistance > 80)*/
                    ;

                    if (creep.costBody < bodyCost && !creep.needEvolve || isColonNotCarry) {
                        // console.log(`creep [${creep.role}] need to evolve !`)
                        this.gameAccess.Game.getObjectById(creep.id).memory.needEvolve = true;
                    }
                }

            })
    }

    /**
     * @param levelRoom {number}
     * @param summary
     * @param sysCity
     */
    spawnSystem(levelRoom, summary, sysCity) {
        const levelTemplate = SPAWN_BY_LEVEL[levelRoom];
        // const isSpawning = this.roomData.getMainSpawn().spawning;
        // const isNoCreepInProcess = this.creepInProcess.length === 0;

        // if (isSpawning || !isNoCreepInProcess) {
        //     return undefined;
        // }

        const want = [];
        Object.entries(levelTemplate).forEach(([key, value]) => {
            const wantNumber = value || 0;
            const currentNumber = summary[key] || 0;
            if ((currentNumber === undefined && wantNumber > 0) || wantNumber > currentNumber) {
                want.push(key);
            }
        });
        const finalSpawn = want
            .sort((a, b) => {
                const roleAIndex = ROLE_ORDER.indexOf(a.toUpperCase());
                const roleBIndex = ROLE_ORDER.indexOf(b.toUpperCase());
                return roleAIndex - roleBIndex;
            })
            .slice(0, 1)[0]
        // console.log(` ========================================== finalSpawn ${finalSpawn}`)
        if (finalSpawn !== undefined) {
            const spawnRole = finalSpawn.toUpperCase();
            this.roomData.getSysCity()
                .updateSpawnFuture(spawnRole)

            if (finalSpawn) {
                const ret = this.spawn(spawnRole, levelRoom);
                if (ret !== OK) {
                    sysCity.updateLastSpawnError(`Error ${spawnRole} ${levelRoom}`)
                }
                return OK
            }
        }
        return undefined;

    }

    spawnColonSystem() {
        const sysColon = this.roomData.sysColon;
        const summarys = sysColon.getSpawnTaggedSummary()
        const realLevelRoom = this.roomData.getRoomLevel();
        const levelRoom = realLevelRoom > 5 ? 5 : realLevelRoom;
        const highLevelRoom = realLevelRoom > 7 ? 7 : realLevelRoom;
        const minLevelRoom = realLevelRoom > 3 ? 3 : realLevelRoom;

        summarys.forEach(summary => {
            if (summary.rodrigo > 0) {
                this.spawnColon(BotRole.RODRIGO, levelRoom, summary.room, sysColon.getColon(summary.room))
            } if (summary.carry > 0) {
                this.spawnColon(BotRole.CARRY_COLON, highLevelRoom, summary.room, sysColon.getColon(summary.room))
            } if (summary.guard > 0) {
                this.spawnColon(BotRole.GUARD, minLevelRoom, summary.room, sysColon.getColon(summary.room))
            } if (summary.cristobal > 0) {
                this.spawnColon(BotRole.CRISTOBAL, realLevelRoom, summary.room, sysColon.getColon(summary.room))
            }

        })
    }

    /**
     * @param creep {Creep}
     * @return {string}
     */
    getRawCreepRole(creep) {
        return creep.memory.role === BotRole.RECYCLER ?
            creep.memory.roleTmp :
            creep.memory.role
    }

    /**
     * @return {{count: number}}
     */
    summaryCreep() {
        const creeps = this.roomData.getCreepsForSpawn();
        const summary = {
            count: 0,
        };

        creeps
            .forEach(c => {
                const rawRole = this.getRawCreepRole(c);
                const role = rawRole !== undefined ? rawRole.toLowerCase() : rawRole
                if (!summary[role]) {
                    summary[role] = 0;
                }
                summary[role]++;
                summary.count++;
            })
        return summary;
    }


    processBodyByRoleLevel(role, roomLevel) {
        return utilsSpawn.processBodyByRoleLevel(role, roomLevel, this.roomData.getRoomGame().energyCapacityAvailable)
    }

    // /**
    //  *
    //  * @param role {BotRole}
    //  * @param level {Number}
    //  * @param sorted {boolean}
    //  *//**
    //  *
    //  * @param role {BotRole}
    //  * @param level {Number}
    //  * @param sorted {boolean}
    //  */
    // spawn(role, level, sorted = true) {
    //     this.roomData.getSysSpawner().pushAskSpawn(role, level, SpawnerType.CLASSIC)
    //     const creepName = role === BotRole.STARTER || role === BotRole.TRANSPORTER ?
    //         utils.generateUniqueId() :
    //         role + '_' + this.gameAccess.getTime();
    //     const bodyProcess = this.processBodyByRoleLevel(role, level)
    //     const bodyCost = bodyProcess.bodyCost;
    //     const body = bodyProcess.body;
    //
    //     this.roomData.getSysCity()
    //         .updateSpawnFuture(`${role}:${level}->${bodyCost}:${body}`)
    //
    //     // console.log(`spawn cost[${bodyCost}] [${body}]`)
    //
    //     const finalBody = body.sort((a, b) => {
    //         const roleAIndex = PART_ORDER.indexOf(a);
    //         const roleBIndex = PART_ORDER.indexOf(b);
    //         return roleAIndex - roleBIndex;
    //     })
    //
    //     const retCreate = this.roomData.getMainSpawn()
    //         .spawnCreep(finalBody, creepName, {
    //             memory: {
    //                 role: role,
    //                 level: level,
    //                 bodyCost: bodyCost,
    //                 baseRoom: this.room,
    //                 colon: undefined,
    //             },
    //         });
    //
    //     if (retCreate === OK) {
    //         console.log(`|<<>>|01|Spawning a new ${role} creep: ${creepName}`);
    //
    //         this.roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.SPAWNER).pushOutput(bodyCost)
    //         this.creepInProcess.push()
    //         return OK;
    //     } else {
    //         console.log(`|<<>>|02|Unable to spawn [${role}] err[${retCreate}] body[${finalBody}] name[${creepName}]`);
    //         return retCreate;
    //     }
    // }
    spawn(role, level, sorted = true) {
        this.roomData.getSysSpawner().pushAskSpawn(role, level, SpawnerType.CLASSIC)
    }

    /**
     *
     * @param role {BotRole}
     * @param level {Number}
     * @param targetRoom {string}
     * @param colon {SysColon}
     */
    spawnColon(role, level, targetRoom, colon) {
        // const level = leveColon > 5 ? 5 : leveColon
        const askData = {target: targetRoom, ori: this.room}
        this.roomData.getSysSpawner()
            .pushAskSpawn(role, level, SpawnerType.COLON, askData)
        return ;

        const creepName = this.roomData.getCityName() + role + '_' + this.gameAccess.getTime();
        const bodyProcess = this.processBodyByRoleLevel(role, level)
        const bodyCost = bodyProcess.bodyCost;
        const body = bodyProcess.body;

        this.roomData.getSysCity()
            .updateSpawnFuture(`COLON ${targetRoom} = ${role}:${level}->${bodyCost}:${body}`)
        // console.log(`spawn cost[${bodyCost}] [${body}]`)
        const retCreate = this.roomData.getMainSpawn()
            .spawnCreep(body, creepName, {
                memory: {
                    role: role,
                    level: level,
                    bodyCost: bodyCost,
                    baseRoom: this.room,
                    colon: {
                        target: targetRoom,
                        ori: this.room,
                    },
                },

            });

        if (retCreate === OK) {
            console.log(`Spawning a new ${role} creep: ${creepName}`);
            if (colon !== undefined) {
                console.log(`========================== ADD rendement cost${-bodyCost} colon${colon}`);
                this.roomData.getSysCity().getSysFlow().getFlowUnit(FlowType.COLONIES).pushOutput(bodyCost)
                colon.addEnergyExchange(-bodyCost, this.gameAccess.getTime(), role)
            }
            this.creepInProcess.push()
            return OK;
        } else {
            console.log(`|<<>>|07|Unable to spawn [${role}] err[${retCreate}] body[${body}] name[${creepName}]`);
            return undefined;
        }
    }
}

module.exports = CityFeatSpawner;