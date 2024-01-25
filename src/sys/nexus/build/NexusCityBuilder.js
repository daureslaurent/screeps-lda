const USE_MEMORY = false;
const SpawnerData = require('sys/spawner/model/SpawnerData');
const VisualUiBox = require('core/visual/visual.ui.box');
const NexusBuilderFeatLoader = require('sys/nexus/build/feat/FeatLoaderNexusBuilder');
const BuildTemplate = require('sys/nexus/build/BuildTemplate');
const FeatLoaderNexusRoutine = require('sys/nexus/build/routine/FeatLoaderNexusRoutine');

class NexusCityBuilder {
    /**
     * @param roomName {string}
     */
    constructor(roomName) {
        this.roomName = roomName;

        this.featManager = new NexusBuilderFeatLoader(roomName);
        this.routineManager = new FeatLoaderNexusRoutine(roomName);

        /** @type {BuildTemplate} */
        this.template = undefined;

        this.constructMemory();
        if (USE_MEMORY === true) {
            this.loadMemory();
        }
    }

    constructMemory() {
        if (USE_MEMORY === false) {
            Memory.sysNexus = undefined
        }
        if (!Memory.sysNexus) {
            Memory.sysNexus = {}
        }
        if (!Memory.sysNexus.base) {
            Memory.sysNexus.base = {}
        }
        if (!Memory.sysNexus.base[this.roomName]) {
            Memory.sysNexus.base[this.roomName] = {}
        }
    }
    saveMemory() {
        if (USE_MEMORY === true) {
            Memory.sysNexus.base[this.roomName].queue = this.queue;
        }
    }
    loadMemory() {
        const memory = Memory.sysNexus.base[this.roomName]
        if (memory) {
            this.queue = memory.queue.map(e => new SpawnerData(e)) || [];
        }
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param flag {Flag}
     */
    update(gameAccess, roomData, flag = undefined) {
        this.externalDebug(flag, gameAccess)
        this.handleFeature(gameAccess, roomData)
    }

    /**
     * @param gameAccess {GameAccess}
     * @param roomData {RoomData}
     * @param flag {Flag}
     */
    run(gameAccess, roomData, flag = undefined) {
        this.handleRoutine(gameAccess, roomData);
    }


    handleFeature(gameAccess, roomData) {
        // Template Init if not
        if (this.template === undefined) {
            this.template = new BuildTemplate(roomData.getMainSpawn().pos);
        }

        const levelRoom = roomData.getRoomLevel();
        const template = this.template;

        // Need Init
        this.featManager.getFeatsNotInit(levelRoom)
            .forEach(f => {
                f.init(gameAccess, roomData, template)
            })

        this.featManager.getUpdatable(levelRoom)
            .filter(f => f.getNeedUpdate(gameAccess))
            .forEach(f => f.update(gameAccess, roomData, template))
    }

    handleRoutine(gameAccess, roomData) {
        const levelRoom = roomData.getRoomLevel();
        this.routineManager.getFeatsNotInit(levelRoom)
            .forEach(f => {
                f.init(gameAccess, roomData, undefined)
            })

        const ArrayBuildData = this.featManager.getFeats()
            .map(f => f.getBuildData())
            .reduce((result, value) => result.concat(value), [])

        this.routineManager.getFeats()
            .filter(f => f.getNeedUpdate(gameAccess))
            .forEach(f => f.update(gameAccess, roomData, ArrayBuildData))
    }

    /**
     * @param flag {Flag}
     */
    externalDebug(flag, gameAccess) {
        if (flag == null) {
            return;
        }
        const visual = flag.room.visual;
        const box = new VisualUiBox(visual, flag.pos);
        box.setTitle('====== Builder System ======')
        box.addLine('=== Features ===')
        this.featManager.getFeats().forEach(f => {
            const timingInit = Math.round(f.timing.onInit * 10) / 10
            const timingUpdate = Math.round(f.timing.onUpdate * 10) / 10

            const logUpdate = f.getUpdateEnable()
                ? ` Ut: ${timingUpdate.toFixed(2)}`
                : '';

            const logFeat = `${f.getIsInit()?f.getNeedUpdate(gameAccess)?'🔵':'🟢':'🟠'} `
                +`It: ${timingInit.toFixed(2)}${logUpdate} 📗${f.getBuildData().length}`
                + ` .${f.name}`;
            box.addLine(logFeat)

            f.getBuildData()
                .forEach(data => {
                    const color = this.DEPRECATED_getColor(!data?undefined:data.type)
                    if (data != null) {
                        visual.circle(data.pos, {
                            radius: 0.2,
                            fill: color,
                        })
                    }
                })
        })

        box.addLine('=== Routine ===')
        this.routineManager.getFeats()
            .forEach(f => {
                const timingInit = Math.round(f.timing.onInit * 10) / 10
                const timingUpdate = Math.round(f.timing.onUpdate * 10) / 10
                const logUpdate = f.getUpdateEnable()
                    ? ` Ut: ${timingUpdate.toFixed(2)}`
                    : '';
                const logFeat = `${f.getIsInit()?f.getNeedUpdate(gameAccess)?'🔵':'🟢':'🟠'} `
                    +`${logUpdate} 📗${f.getBuildData().length}`
                    + ` .${f.name}`;
                box.addLine(logFeat)
            })

        box.draw()
    }
    DEPRECATED_getColor(type) {
        if (type === STRUCTURE_RAMPART) {
            return 'rgb(47,255,0)';
        }
        else if (type === STRUCTURE_WALL) {
            return 'rgb(192,27,27)';
        }
        else if (type === STRUCTURE_ROAD) {
            return 'rgba(0,255,234,0.37)';
        }
        else if (type === STRUCTURE_TOWER) {
            return 'rgba(230,0,255,0.85)';
        }
        else if (type === STRUCTURE_CONTAINER) {
            return 'rgb(213,24,74)';
        }
        else if (type === STRUCTURE_STORAGE) {
            return 'rgba(115,255,0,0.85)';
        }
        else if (type === STRUCTURE_EXTENSION) {
            return 'rgba(255,251,0,0.85)';
        }
        return 'rgba(100,100,100,0.85)';
    }
}

module.exports = NexusCityBuilder;