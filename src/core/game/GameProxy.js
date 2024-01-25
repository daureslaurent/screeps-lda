const Profiler = require('core/monitoring/Profiler')

class GameProxy {
    /**
     *
     * @param profiler {Profiler}
     */
    constructor(profiler) {
        this.profiler = profiler;
        this.cache = new Map();
    }

    /**
     * Get an object with the specified unique ID.
     * It may be a game object of any type.
     * Only objects from the rooms which are visible to you can be accessed.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#getObjectById}
     *
     * @type {function}
     *
     * @param {string} id The unique identificator.
     *
     * @return {object|null}
     */
    getObjectById(id) {
        this.profiler.trace('GameProxy', `getObjectById[${id}]`)
        if (this.cache.has(id)) {
            return this.cache.get(id)
        }
        const obj = Game.getObjectById(id);
        if (obj) {
            this.cache.set(id, obj);
        }
        return obj;
    }

    getObjectByIdNonCached(id) {
        this.profiler.trace('GameProxy', `getObjectByIdNonCached[${id}]`)
        const obj = Game.getObjectById(id);
        if (obj) {
            this.cache.set(id, obj);
        }
        return obj;
    }

    // getObjectById(id){
    //     return Game.getObjectById(id);
    // }

    clear() {
        this.cache.clear();
    }


}

module.exports = GameProxy;