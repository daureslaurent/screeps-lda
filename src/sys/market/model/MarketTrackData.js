class MarketTrackData {

    constructor(resourceType, trackType, amount) {
        this.resourceType = resourceType;
        this.trackType = trackType;
        this.bestPrice = undefined;
        this.bestPriceTrx = undefined;
        this.minPrice = undefined;
        this.minPriceTrx = undefined;
        this.amount = amount;
    }
}

module.exports = MarketTrackData;