const MINIMAL_BODY = [WORK, CARRY, MOVE];
const bodyCostCalculator = require('sys/spawner/builder/bodyCostCalculator')
const PART_ORDER = [
    TOUGH,
    ATTACK,
    RANGED_ATTACK,
    WORK,
    CARRY,
    MOVE,
    HEAL,
]

class SpawnerBodyBuilder {

    /**
     * @param body {string[]}
     * @return {number}
     */
    calculateCost(body) {
        return bodyCostCalculator.calculateCost(body);
    }

    /**
     *
     * @param bodyInput {string[]}
     * @param maxBody {string[]}
     * @param maxBudget {number}
     * @return {{bodyCost: number, body: *[]}|{bodyCost: *, body: *}|{bodyCost: number, body: *}}
     */
    processBodyByBudget(bodyInput, maxBudget, maxBody = undefined) {
        let desiredBody = bodyInput.slice();
        if (desiredBody === undefined) {
            return {
                body: MINIMAL_BODY,
                bodyCost: this.calculateCost(MINIMAL_BODY),
            };
        }
        let desiredCost = this.calculateCost(desiredBody)
        const numRepeats = Math.floor(maxBudget / desiredCost);
        const body = [];
        for (let i = 0; i < numRepeats; i++) {
            body.push(...desiredBody);
        }
        const bodyCost = numRepeats * desiredCost

        if (maxBody !== undefined) {
            const bodyRed = maxBody
            const bodyCostRed = this.calculateCost(bodyRed)
            if (bodyCostRed < bodyCost) {
                return {
                    body: this._sortBody(bodyRed),
                    bodyCost: bodyCostRed,
                }
            }
        }


        if (!body || body.length === 0) {
            return {
                body: MINIMAL_BODY,
                bodyCost: this.calculateCost(MINIMAL_BODY),
            };
        }
        return {
            body: this._sortBody(body),
            bodyCost: bodyCost,
        };
    }

    /**
     * @param bodyInput {string[]}
     * @param maxBody {string[]}
     * @param roomLevel {number}
     * @param energyCapacityAvailable {number}
     * @return {{bodyCost: number, body: string[]}|{bodyCost: *, body: *}|{bodyCost: number, body: *[]}}
     */
    processBodyByLevel(bodyInput, maxBody, roomLevel, energyCapacityAvailable) {
        const maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][roomLevel];
        const maxLevel = 300 + ((maxExtensions) * 50);
        const maxBudget = Math.min(maxLevel, energyCapacityAvailable)
        return this.processBodyByBudget(bodyInput, maxBudget, maxBody)
    }

    /**
     * @param body {string[]}
     * @return {string[]}
     * @private
     */
    _sortBody(body) {
        return body.sort((a, b) => {
            const roleAIndex = PART_ORDER.indexOf(a);
            const roleBIndex = PART_ORDER.indexOf(b);
            return roleAIndex - roleBIndex;
        })
    }

}

module.exports = SpawnerBodyBuilder;