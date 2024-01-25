const BotRole = require('core/enum/BotRole')
const _module = require('core/interface/_module');
const roleModules = [
    // require('bot.feat.mining'),
    // require('bot.feat.builder'),
    // require('bot.feat.claimer'),
    require('bot/bot.feat.cristobal'),
    require('bot/bot.feat.rodrigo'),
    require('bot/bot.feat.guard'),
    require('bot/bot.feat.explorer'),
    require('bot/bot.feat.recycler'),
    // require('bot.feat.carry'),
    // require('bot.feat.mining'),
    // require('bot/bot.feat.even'),
    // require('bot/bot.feat.atacker'),
    // require('bot/bot.feat.carry.colon'),
    // require('bot/bot.feat.eden'),
    // require('bot/bot.feat.extractor'),
    // require('bot/bot.feat.breaker'),
    require('bot/bot.feat.starter'),
    require('bot/bot.feat.transporter'),
    require('bot/bot.feat.transporter.colonies'),
]
let towerModule;

class BotScheduler extends _module {
    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('BotScheduler', undefined, gameAccess);
        this.rolesMap = new Map();
        towerModule = new (require('bot/bot.feat.tower'))(gameAccess, roomDataFactory);
        roleModules.forEach(roleModules => {
            const instance = new roleModules(gameAccess, roomDataFactory)
            this.rolesMap.set(instance.getRole(), instance);
        })
    }

    recycleSupport(creep) {
        return creep.charge <= 15 &&
            creep.role !== BotRole.RECYCLER &&
            creep.role !== BotRole.CRISTOBAL &&
            creep.role !== BotRole.ALL &&
            creep.level !== -1 &&
            !creep.needEvolve;
    }

    log() {
        // const creeps = this.gameAccess.getAllCreepsArray();
        // const sizeTop = 3;
        //
        // // Sort creeps by charge in descending order, then slice the top N.
        // const topCreeps = creeps
        //     .sort((a, b) => b.charge - a.charge)
        //     .slice(-sizeTop)
        //     .reverse();
        //
        // // Format the top N creeps for logging.
        // const topCreepInfo = topCreeps.map(creep => `${creep.role}:${creep.ticksToLive}@ ${creep.charge}%`).join('||');
        // console.log(`-Charge ${topCreepInfo}`);
        //
        // const creepChargeByRole = {};
        // // Calculate total charge and count of creeps by role.
        // creeps.forEach(creep => {
        //     const role = creep.role; // Replace 'creep.role' with the actual property that stores the role of your creeps.
        //     if (!creepChargeByRole[role]) {
        //         creepChargeByRole[role] = {
        //             totalCharge: 0,
        //             count: 0,
        //         };
        //     }
        //     creepChargeByRole[role].totalCharge += creep.charge; // Replace 'creep.charge' with the actual property that stores the charge of your creeps.
        //     creepChargeByRole[role].count += 1;
        // });

        // Calculate the average charge and count of roles.
        // let averageCharge = 0;
        // let roleCount = 0;
        // for (const role in creepChargeByRole) {
        //     const roleData = creepChargeByRole[role];
        //     const averageChargeForRole = roleData.totalCharge / roleData.count;
        //
        //     // console.log(`-[${roleData.count}][${role}] ${Math.round(averageChargeForRole)}%`);
        //
        //     averageCharge += averageChargeForRole;
        //     roleCount++;
        // }

        // Calculate and log the average charge for all roles.
        // if (roleCount > 0) {
        //     averageCharge = averageCharge / roleCount;
        //     // console.log(`-Charge[AVG] ${Math.round(averageCharge)}%`);
        // }
    }

    run() {
        // this.log();
        this.runTower();
        this.gameAccess.getAllCreepsArray()
            .filter(c => (c.interCity !== undefined && c.role === BotRole.RECYCLER) || c.interCity === undefined)
            // .sort((a, b) => {
            //     const roleAIndex = customOrder.indexOf(a.role);
            //     const roleBIndex = customOrder.indexOf(b.role);
            //     // return roleAIndex - roleBIndex;
            //     const tickA = a.ticksToLive; // Assuming 'tick' is a numeric property in the objects.
            //     const tickB = b.ticksToLive;
            //
            //     if (roleAIndex !== roleBIndex) {
            //         return roleAIndex - roleBIndex; // Sort by custom order first
            //     } else {
            //         return tickA - tickB; // If roles are the same, sort by 'tick' property
            //     }
            // })
            .forEach(creep => {
                if (this.recycleSupport(creep)) {
                    const creepRaw = this.gameAccess.Game.getObjectById(creep.id);
                    creepRaw.memory.roleTmp = String(creep.role);
                    creep.roleTmp = String(creep.role);
                    creepRaw.memory.role = BotRole.RECYCLER
                    creep.role = BotRole.RECYCLER;
                    if (creepRaw.memory.firstRecycle) {
                        creepRaw.memory.firstRecycle = undefined;
                    }
                }
                // console.log(`- bot[${creep.id}][${creep.level}] [${creep.role}][${creep.action}] - live[${creep.ticksToLive}]`)
                const moduleRole = this.rolesMap.get(creep.role);
                if (moduleRole) {
                    // try {
                        moduleRole.execute(creep);
                    // } catch (error) {
                    //     console.log(`===============!!!!! ERROR MODULE !!!!!====================`);
                    //     console.log(`==== DETAIL: ${error}`);
                    //     console.log(`==== FROM: ${creep.role}`);
                    //     console.log(`==== CREEP: ${creep.name} ${creep.pos}`);
                    //     Logs.error(`Error bot scheduler ${creep.role} ${creep.name} with error: ${error}`, JSON.stringify(creep))
                    //     console.log(`===============!!!!! ERROR MODULE !!!!!====================`);
                    // }
                }
            });
    }

    runTower() {
        this.gameAccess.getAllTowersArray().forEach(tower => towerModule.execute(tower));
    }
}

module.exports = BotScheduler;