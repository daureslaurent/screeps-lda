class BuildData {

    /**
     * @param id {string}
     * @param pos {RoomPosition}
     * @param type {string}
     */
    constructor(id, pos, type) {
        this.id = id;
        this.pos = pos;
        this.type = type
    }
}

module.exports = BuildData;