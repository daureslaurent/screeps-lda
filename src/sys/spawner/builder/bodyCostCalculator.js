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

module.exports = {
    /**
     * @param body {string[]}
     * @return {number}
     */
    calculateCost(body) {
        return _.sum(body, part => BODY_PART_COSTS[part])
    }
}