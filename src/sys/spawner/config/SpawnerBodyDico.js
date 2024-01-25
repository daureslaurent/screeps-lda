const DESIRED_BODY_TEMPLATES = {
    STARTER: [WORK, CARRY, MOVE],
    BUILDER: [WORK, CARRY, MOVE, MOVE],
    EXTRACTOR: [WORK, CARRY, MOVE, MOVE],
    CLAIMER: [CLAIM, MOVE],
    CARRY: [
        ...Array(1).fill(CARRY),
        ...Array(1).fill(MOVE),
    ],
    ATACKER: [ /*TOUGH, TOUGH, TOUGH,*/ MOVE, RANGED_ATTACK],
    // Colonies
    CRISTOBAL: [CLAIM, MOVE],
    RODRIGO: [WORK, WORK, CARRY, MOVE, MOVE],
    EXPLORER: [MOVE],
    GUARD: [TOUGH, TOUGH, TOUGH, MOVE, MOVE, RANGED_ATTACK, ATTACK],
    CARRY_COLON: [CARRY, CARRY, MOVE],

    EDEN: [WORK, WORK, CARRY, MOVE, MOVE],

    BREAKER: [RANGED_ATTACK, MOVE, HEAL],
    TANK: [ATTACK, MOVE],
    HEALER: [MOVE, HEAL],
    BAG: [TOUGH, MOVE],
    // TRANSPORTER : [CARRY, MOVE],
    COLONIES_TRANSPORTER: [
        ...Array(2).fill(CARRY),
        ...Array(1).fill(MOVE),
    ],
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
    MINER: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    EXTRACTOR: [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    CLAIMER: [
        ...Array(2).fill(CLAIM),
        ...Array(2).fill(MOVE),
    ],
    CARRY: [
        ...Array(10).fill(CARRY),
        ...Array(10).fill(MOVE),
    ],
    COLONIES_TRANSPORTER: [
        ...Array(20).fill(CARRY),
        ...Array(10).fill(MOVE),
    ],
    TRANSPORTER: [
        ...Array(10).fill(CARRY),
        ...Array(5).fill(MOVE),
    ],
    STARTER: [
        ...Array(6).fill(WORK),
        ...Array(3).fill(CARRY),
        ...Array(6).fill(MOVE),
    ],
    BUILDER: [
        ...Array(5).fill(WORK),
        ...Array(1).fill(CARRY),
        ...Array(6).fill(MOVE),
    ],
    CRISTOBAL: [CLAIM, CLAIM, MOVE],
    CARRY_COLON: [
        // ...Array(2).fill(TOUGH),
        ...Array(10).fill(CARRY),
        ...Array(5).fill(MOVE),
    ],
    RODRIGO: [
        ...Array(6).fill(WORK),
        ...Array(1).fill(CARRY),
        ...Array(4).fill(MOVE),
    ],
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
    ATACKER: [
        MOVE, MOVE, MOVE, MOVE, MOVE,
        RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
    ],
};

module.exports = {
    maxBody: MAX_BODY_TEMPLATES,
    body: DESIRED_BODY_TEMPLATES,
}