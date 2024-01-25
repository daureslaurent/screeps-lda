class FlowModelData {

    /**
     * @param amount {number}
     * @param isInput {boolean}
     * @param time {number}
     */
    constructor(amount, isInput, time = Game.time) {
        this.amount = amount;
        this.isInput = isInput;
        this.time = time;
    }
}

module.exports = FlowModelData;