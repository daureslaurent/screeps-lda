const BotRole = require('core/enum/BotRole')
const VisualUiBox = require('core/visual/visual.ui.box');

class GroupUnit {
    /**
     * @param roomDataFactory {RoomDataFactory}
     * @param roomOri {string}
     * @param type {GroupType}
     */
    constructor(type, roomOri, roomDataFactory) {
        this.roomDataFactory = roomDataFactory;
        this.type = type;
        this.roomOri = roomOri;
        this.roomHandle = roomOri;
        this.groupId = type + ':' + roomOri;

        /** @type {RoomPosition} */
        this.currentPos = new RoomPosition(25, 25, roomOri);

        /** @type {{role: BotRole, level: number, tag: string}[]} */
        this.needCreep = [];

        /** @type {Map<BotRole, string[]>} */
        this.creepsMap = new Map();

        /** @type {RoomData} */
        this.roomDataOri = this.roomDataFactory.getRoomData(roomOri);

        this.ttlAverage = 0;
        this.ttlMin = 0;
        this.recyleTTL = 400;

        this.state = 'INIT';
        this.missingCreepsNumber = 0;
        this.needFullCreepOperate = false;
        this.enableRecycle = true;

        this.byPassSpawn = false;

        this.toDelete = false;
        console.log('Construct GroupUnit')
    }

    /**
     * @param gameAccess {GameAccess}
     */
    update(gameAccess) {
        this.creepsMap.forEach((value, key) => {
            this.creepsMap.set(key, value.filter(id => gameAccess.Game.getObjectByIdNonCached(id) != null));
        })
    }

    /**
     * @return {string}
     */
    getRoomHandle() {
        return this.roomHandle;
    }

    /**
     * @return {string}
     */
    getGroupId() {
        return this.groupId;
    }

    /**
     * @param role {BotRole}
     * @param level {number}
     * @param tag {string}
     */
    appendNeed(role, level, tag = '') {
        this.needCreep.push({
            role: role,
            level: level,
            tag: tag,
        })
    }

    /**
     * @return {{role: BotRole, level: number, tag: string}[]}
     */
    getSpawnSummary() {
        if (this.byPassSpawn) {
            console.log('Bypass Spawning group !')
            return [];
        }
        const creepsGroupIds = this.getAllGroupCreep();
        if (creepsGroupIds.length === 0) {
            this.missingCreepsNumber = this.needCreep.length
            return this.needCreep.slice();
        }

        /** @type {Creep[]} */
        let creepsGroups = creepsGroupIds
            .map(id => Game.getObjectById(id))
            .filter(c => c != null)

        /** @type {{role: BotRole, level: number, tag: string}[]} */
        const missingCreeps = [];

        this.needCreep.forEach(need => {
            const found = creepsGroups.filter(c => (c.memory.role === need.role
                    || c.memory.roleTmp === need.role) /*&& c.memory.level === need.level*/)
            if (found.length > 0) {
                creepsGroups = creepsGroups.filter(c => c.id !== found[0].id)
            } else {
                missingCreeps.push(need);
            }
        })
        this.missingCreepsNumber = missingCreeps.length;
        return missingCreeps;
    }

    /**
     * @param role {BotRole || string}
     * @param id {string}
     */
    appendCreep(role, id) {
        if (!this.creepsMap.has(role)) {
            this.creepsMap.set(role, []);
        }
        const dataMap = this.creepsMap.get(role);
        if (!dataMap.includes(id)) {
            dataMap.push(id);
        }
    }

    /**
     * @abstract
     * @param gameAccess {GameAccess}
     * @return {string}
     */
    getLog(gameAccess) {
        return ''
    }

    /**
     * @param gameAccess {GameAccess}
     */
    handleGroup(gameAccess) {
        const customLog = this.getLog != null ? this.getLog(gameAccess) : ''
        console.log(`🚂 =[${this.roomHandle}]=[${this.state}] ${this.getGroupId()} @ ${this.currentPos.roomName} | ${customLog}`)

        const roomData = this.roomDataFactory.getRoomData(this.getRoomHandle())
        /** @type {Creep[]} */
        const creeps = this.getAllGroupCreep()
            .map(id => gameAccess.Game.getObjectById(id))
            .filter(c => c != null)

        if (this.state === 'INIT') {
            if (creeps.length > 0) {
                this.currentPos = creeps[0].pos;
            }
            this.state = '';
        }

        const numberUnderTTL = creeps.filter(c => c.ticksToLive <= this.recyleTTL).length
        if (numberUnderTTL > 0 && this.recyleTTL !== 0 && this.enableRecycle === true) {
            this.state = 'RECYCLE'
        }
        if (this.state === 'RECYCLE' && this.enableRecycle === false) {
            this.state = '';
        }

        if (this.needFullCreepOperate) {
            if (this.missingCreepsNumber > 0) {
                this.state = 'WAIT_SPAWN'
            }
            if (this.missingCreepsNumber === 0 && this.state === 'WAIT_SPAWN') {
                this.state = '';
            }
        }


        this.updateLiveMetric(gameAccess);

        const retGroup = this.runGroupTech != null ?
            this.runGroupTech(gameAccess, roomData) :
            this.runGroup(gameAccess, roomData)

        creeps.forEach(creep => {
            this.runCreepTech != null ?
                this.runCreepTech(creep,
                    gameAccess,
                    roomData) :
                this.runCreep(creep,
                    gameAccess,
                    roomData)
        })

        if (retGroup === 'DESTROY') {
            this.toDelete = true;
        }
    }

    /**
     * @abstract
     * @param creep {Creep}
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runCreep(creep, gameAccess, roomData) {
    }

    /**
     * @abstract
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     */
    runGroup(gameAccess, roomData) {
    }

    /**
     * @return {string[]}
     */
    getAllGroupCreep() {
        return [].concat(...Array.from(this.creepsMap.values()))
    }

    /**
     * @param gameAccess {GameAccess}
     * @return {Creep[]}
     */
    getAllGroupCreepObj(gameAccess) {
        return [].concat(...Array.from(this.creepsMap.values()))
            .map(id => gameAccess.Game.getObjectById(id))
            .filter(c => c != null);
    }

    /**
     * @param gameAccess {GameAccess}
     * @return number
     */
    updateLiveMetric(gameAccess) {
        /** @this {Creep[]} */
        const creeps = this.getAllGroupCreep()
            .map(id => gameAccess.Game.getObjectById(id))
            .filter(c => c != null);
        const ttls = creeps
            .map(c => c.ticksToLive)
        this.ttlMin = Math.min(...ttls);
        this.ttlAverage = ttls
            .reduce((total, value) => total + value, 0) / creeps.length;

    }

    debugExternal() {
        const roomGame = Game.rooms[this.currentPos.roomName];
        if (roomGame == null) {
            return;
        }

        const visual = roomGame.visual;
        visual.circle(this.currentPos, {
            radius: 0.5,
            fill: '#1bb2c0',
        });

        const box = new VisualUiBox(
            visual,
            new RoomPosition(this.currentPos.x, this.currentPos.y, this.currentPos.roomName),
        );

        box.setTitle(`InterCityGroup ${this.getGroupId()}`)
        box.addLine(`State: ${this.state}`)
        const spawnNeed = this.getSpawnSummary();
        if (spawnNeed.length > 0) {
            box.addLine(`== SPAWN ${spawnNeed.length}`)
            spawnNeed.forEach(need => {
                box.addLine(`- ${need.role}@${need.level}`)
            })
        }

        this.creepsMap.forEach((ids, role) => {
            ids
                .map(id => Game.getObjectById(id))
                .filter(c => c != null)
                .forEach(c => box.addLine(`- ${role}@${c.memory.level} ` +
                    `${c.store.getUsedCapacity(RESOURCE_ENERGY)} / ${c.store.getCapacity(RESOURCE_ENERGY)} ⚡ ${c.ticksToLive}` +
                    (c.memory.role === BotRole.RECYCLER ? '💊' : '')))
        })

        if (this.debugExternalCustom !== undefined) {
            this.debugExternalCustom(box, visual);
        }
        box.draw();
    }

}

module.exports = GroupUnit;