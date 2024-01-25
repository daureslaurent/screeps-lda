const _module = require('core/interface/_module');

class _moduleVisual extends _module {

    /**
     *
     * @param name {string}
     * @param role {string}
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(name, role, gameAccess, roomDataFactory) {
        super(name, undefined, gameAccess);
        // this.room = room;
        this.roomDataFactory = roomDataFactory;
        // this.actions = [];
        this.role = role;
    }

    getRole() {
        return this.role;
    }

    /**
     * @returns {RoomData}
     */
    getRoomData() {
        return this.roomDataFactory.getRoomData(this.room);
    }

    /**
     *
     * @param creep {Creep}
     */
    execute() {
        // console.log(`=BOT=MINING-- -==-- [${this.name}]`)
        return this.run()
        // return super.execute();
    }

    // preRun() {
    //     if (this.actions.length > 0) {
    //         console.log(this.name, 'waiting actions !')
    //     }
    //     this.actions = [];
    // }
    //
    // afterRun() {
    //     console.log(this.name, '_moduleCity - afterRun', JSON.stringify(this.actions))
    //     return this.actions;
    // }


}

module.exports = _moduleVisual;