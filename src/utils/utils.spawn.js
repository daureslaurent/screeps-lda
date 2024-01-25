const BotRole = require('core/enum/BotRole');
const BODY_PART_COSTS = {
    [WORK]: 100,
    [CARRY]: 50,
    [MOVE]: 50,
    [TOUGH]: 10,
    [ATTACK]: 80,
    [RANGED_ATTACK]: 150,
    [HEAL]: 250,
    [CLAIM]: 600,
};
const DESIRED_BODY_TEMPLATES = {
    // GLOBAL: [WORK, CARRY, MOVE],
    // UNIT: [WORK, CARRY, MOVE],
    STARTER: [WORK, CARRY, MOVE],
    // MINER: [WORK, WORK, CARRY, MOVE],
    BUILDER: [WORK, CARRY, MOVE, MOVE],
    EXTRACTOR: [WORK, CARRY, MOVE, MOVE],
    CLAIMER: [CLAIM, MOVE],
    // CLAIMER: [WORK, WORK, WORK, CARRY, MOVE],
    // CARRY: [CARRY, CARRY, MOVE],
    CARRY: [
        ...Array(1).fill(CARRY),
        ...Array(1).fill(MOVE),
    ],
    ATACKER: [ /*TOUGH, TOUGH, TOUGH,*/ MOVE, RANGED_ATTACK],
    // Colonies
    CRISTOBAL: [CLAIM, MOVE],
    RODRIGO: [WORK, WORK, CARRY, MOVE, MOVE],
    // EXPLORER: [TOUGH, TOUGH, WORK, RANGED_ATTACK, CARRY, MOVE, MOVE],
    EXPLORER: [MOVE],
    GUARD: [TOUGH, TOUGH, TOUGH, MOVE, MOVE, RANGED_ATTACK, ATTACK],
    CARRY_COLON: [CARRY, CARRY, MOVE],

    // EDEN: [CLAIM, CLAIM, MOVE, MOVE]
    // ,

    // EDEN: [CLAIM, MOVE],
    EDEN: [WORK, WORK, CARRY, MOVE, MOVE],

    // BREAKER : [ATTACK, MOVE],
    BREAKER: [RANGED_ATTACK, MOVE, HEAL],
    TANK: [ATTACK, MOVE],
    HEALER: [MOVE, HEAL],
    BAG: [TOUGH, MOVE],
    // TRANSPORTER : [CARRY, MOVE],
    TRANSPORTER: [
        ...Array(2).fill(CARRY),
        ...Array(1).fill(MOVE),
    ],
    TRANSPORTERL: [
        ...Array(1).fill(CARRY),
        ...Array(1).fill(MOVE),
    ],


    GOUROU: [
        ...Array(1).fill(WORK),
        ...Array(2).fill(CARRY),
        ...Array(3).fill(MOVE),
    ],
};
const MAX_BODY_TEMPLATES = {
    // GLOBAL: [WORK, CARRY, MOVE],
    // UNIT: [WORK, CARRY, MOVE],

    MINER: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    EXTRACTOR: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    // CLAIMER: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    CLAIMER: [
        ...Array(2).fill(CLAIM),
        ...Array(2).fill(MOVE),
    ],
    CARRY: [
        ...Array(10).fill(CARRY),
        ...Array(10).fill(MOVE),
    ],
    TRANSPORTER: [
        ...Array(20).fill(CARRY),
        ...Array(10).fill(MOVE),
    ],
    STARTER: [
        ...Array(6).fill(WORK),
        ...Array(6).fill(CARRY),
        ...Array(6).fill(MOVE),
    ],
    BUILDER: [
        ...Array(5).fill(WORK),
        ...Array(1).fill(CARRY),
        ...Array(6).fill(MOVE),
    ],

    // ATACKER: [TOUGH, TOUGH, TOUGH, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK],
    CRISTOBAL: [CLAIM, CLAIM, MOVE],
    CARRY_COLON: [
        ...Array(2).fill(TOUGH),
        ...Array(16).fill(CARRY),
        ...Array(9).fill(MOVE),
    ],

    // RODRIGO: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE],
    // EXPLORER: [TOUGH, TOUGH, WORK, RANGED_ATTACK, CARRY, MOVE, MOVE],
    // GUARD: [TOUGH, TOUGH, TOUGH, RANGED_ATTACK, MOVE, MOVE],

    RODRIGO: [
        ...Array(6).fill(WORK),
        ...Array(1).fill(CARRY),
        ...Array(6).fill(MOVE),
    ],
    // BREAKER: [
    //     RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
    //     RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
    //     RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
    //     RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
    //     MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
    //     MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
    //
    //     MOVE, MOVE, MOVE, MOVE, MOVE,
    //     HEAL, HEAL, HEAL, HEAL, HEAL,
    // ],
    GUARD: [
        TOUGH, TOUGH, TOUGH,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        RANGED_ATTACK, RANGED_ATTACK,
    ],
    BREAKER: [
        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, /*RANGED_ATTACK,*/
        MOVE, MOVE, MOVE, MOVE, /*MOVE,*/

        MOVE, MOVE, /*MOVE, MOVE, MOVE,*/
        HEAL, HEAL, /*HEAL, HEAL, HEAL,*/
    ],
    TANK: [
        ...Array(10).fill(ATTACK),
        ...Array(10).fill(MOVE),
    ],

    EDEN: [
        ...Array(6).fill(WORK),
        ...Array(1).fill(CARRY),
        ...Array(7).fill(MOVE),

    ],

    GOUROU: [
        ...Array(5).fill(WORK),
        ...Array(10).fill(CARRY),
        ...Array(15).fill(MOVE),
    ],
    EXPLORER: [MOVE],

    // EXPLORER: [
    //     TOUGH, TOUGH,
    //     RANGED_ATTACK,
    //     MOVE, MOVE, MOVE,
    // ],
    ATACKER: [
        MOVE, MOVE, MOVE, MOVE, MOVE,
        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
    ],
};
const MINIMAL_BODY = [WORK, CARRY, MOVE];

module.exports = {
    /**
     * @param role
     * @param maxBudget
     * @return {{bodyCost: number, body: string[]}|{bodyCost: *, body: *}|{bodyCost: number, body: *[]}}
     */
    processBodyByRoleBudget: (role, maxBudget) => {
        let desiredBody = DESIRED_BODY_TEMPLATES[role];

        if (BotRole.TRANSPORTER === role && maxBudget <= 500) {
            desiredBody = DESIRED_BODY_TEMPLATES[BotRole.TRANSPORTER + 'L']
        }
        let desiredCost = _.sum(desiredBody, part => BODY_PART_COSTS[part]);

        const numRepeats = Math.floor(maxBudget / desiredCost);
        const body = [];
        if (desiredBody === undefined) {
            console.log('Unknow error !!!!')
            const costMin = 200;
            return {
                body: MINIMAL_BODY,
                bodyCost: costMin,
            };
        }
        for (let i = 0; i < numRepeats; i++) {
            body.push(...desiredBody);
        }
        const bodyCost = numRepeats * desiredCost

        if (MAX_BODY_TEMPLATES[role] !== undefined) {
            const bodyRed = MAX_BODY_TEMPLATES[role]
            const bodyCostRed = _.sum(bodyRed, part => BODY_PART_COSTS[part])
            if (bodyCostRed < bodyCost) {
                return {
                    body: bodyRed,
                    bodyCost: bodyCostRed,
                }
            }
        }

        if (!body || body.length === 0) {
            const costMin = 200;
            return {
                body: MINIMAL_BODY,
                bodyCost: costMin,
            };
        }
        return {
            body: body,
            bodyCost: bodyCost,
        };
    },
    /**
     * @param role
     * @param roomLevel
     * @param energyCapacityAvailable
     * @return {{bodyCost: number, body: string[]}|{bodyCost: *, body: *}|{bodyCost: number, body: *[]}}
     */
    processBodyByRoleLevel(role, roomLevel, energyCapacityAvailable) {
        const maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][roomLevel];
        const maxLevel = 300 + ((maxExtensions) * 50);
        const maxBudget = Math.min(maxLevel, energyCapacityAvailable)

        return this.processBodyByRoleBudget(role, maxBudget)
    },

}