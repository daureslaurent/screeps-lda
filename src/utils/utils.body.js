const BODYPART_COST = {
    move: 50,
    work: 100,
    carry: 50,
    attack: 80,
    ranged_attack: 150,
    heal: 250,
    tough: 10,
    claim: 600,
};

module.exports = {
    getBodyCost: (body) => {
        let cost = 0;
        for (let part of body) {
            cost += BODYPART_COST[part.type];
        }
        return cost;
    },
}