const _module = require('core/interface/_module');

class _moduleCity extends _module {

    /**
     *
     * @param name {string}
     * @param room {string}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    constructor(name, room, gameAccess, roomData) {
        super(name + '_' + room, undefined, gameAccess);
        this.room = room;
        /** @type {RoomData} */
        this.roomData = roomData;
        this.actions = [];
    }

    updateBaseReport() {

    }

    banner() {
        // console.log(`=CITY=====--- -==-- ${this.catching?'|C+|':''}[${this.name}]`)
    }

    preRun() {
        if (this.actions.length > 0) {
            console.log(this.name, 'waiting actions !')
        }
        this.actions = [];
    }

    afterRun() {
        // console.log(this.name, '_moduleCity - afterRun', JSON.stringify(this.actions))
        return this.actions;
    }

    /**
     *
     * @param action {Action}
     */
    pushAction(action) {
        this.actions.push(action);
    }


}

module.exports = _moduleCity;