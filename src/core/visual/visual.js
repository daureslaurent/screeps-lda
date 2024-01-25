const NeedsGame = require('core/interface/model.needsGame');
const _module = require('core/interface/_module');

const DEPOSIT_STYLE = {
    radius: 0.2,
    fill: 'blue',
    opacity: 0.7,
}
const WITHDRAW_STYLE = {
    radius: 0.2,
    fill: 'green',
    opacity: 0.7,
}
const WITHDRAW_STYLE_PRINCIPALS = {
    radius: 0.2,
    fill: 'green',
    opacity: 0.7,
}
const WITHDRAW_STYLE_CARRY = {
    radius: 0.2,
    fill: 'yellow',
    opacity: 0.7,
}

const visualModules = [
    // require('bot.feat.mining'),
    require('core/visual/feat/visual.feat.sys.storage'),
    require('core/visual/feat/visual.feat.sys.general'),
    require('core/visual/feat/visual.feat.sys.worker'),
    require('core/visual/feat/visual.feat.sys.flow'),
    require('core/visual/feat/visual.feat.sys.intercity'),
    require('core/visual/feat/visual.feat.sys.transporter'),
]

class Visual extends _module {

    /**
     *
     * @param gameAccess {GameAccess}
     * @param roomDataFactory {RoomDataFactory}
     */
    constructor(gameAccess, roomDataFactory) {
        super('Visual', NeedsGame.ALL, gameAccess);
        // if (Game.shard.name !== 'shard3') {
        //     return;
        // }
        // const DEFAULT_ROOM = Game.spawns['Spawn1'].pos.roomName

        // this.roomData = roomDataFactory.getRoomData(Game.flags.B.room.name);
        // this.room = this.roomData.room;
        this.anyRoom = undefined;
        this.roomDataFactory = roomDataFactory;
        this.modules = [];
        roomDataFactory.getAllRoomData().forEach(roomData => {
            visualModules.forEach(module => {
                if (this.anyRoom === undefined) {
                    this.anyRoom = roomData.room
                }
                const instance = new module(gameAccess, roomData)
                this.modules.push(instance);
            })
        })
    }

    banner() {
    }

    run() {

        const waitingPos = this.roomDataFactory.getRoomData(this.anyRoom).getSysCity().getWaitingPos();

        const room = waitingPos.roomName;
        // const room = Game.flags.B.room;
        // // this.room = room;
        // // this.roomData = this.fa
        // this.displayEnergyInfo(room.visual, room);
        this.displayCreepsInfo(room.visual, room);
        // // this.displaySpawnEnergy(room.visual, room);
        // this.drawControllerInfo(room.visual, room)
        // this.visualEventLog(room.visual, room)

        this.modules.forEach(m => m.execute())

        // this.drawPlanifierBuilding(room.visual, room)
    }

    /**
     * @param roomVisual {RoomVisual}
     * @param room {Room}
     */
    visualEventLog(roomVisual, room) {
        const style = {
            /*fill: 'transparent',*/
            stroke: '#000000',
        };
        const width = 5.3;
        const font = 0.65;
        const space = font + .05;
        const styleTxt = {
            font: font,
            align: 'left',
            opacity: 0.6,
            stroke: '#000000FF',
        }
        let line = space;
        const anchor = Game.flags.UI
        if (!anchor) {
            return;
        }
        const posOri = anchor.pos;
        const logs = ['asc', 'asddd'];

        const afterLine = (line * logs.length) + (line + space);

        roomVisual.rect(posOri.x, posOri.y, width, afterLine, style);

        logs.forEach(log => {
            roomVisual.text(`> ${log}`,
                posOri.x + 0.2,
                posOri.y + line,
                styleTxt);
            line += space;
        })
    }

    displayCreepsInfo(roomVisualA, room) {
        this.gameAccess.getAllCreepsArray()
            .forEach(creep => {
                const creepObj = this.gameAccess.Game.getObjectById(creep.id);
                if (creepObj) {
                    const roomVisual = creepObj.room.visual;
                    const colorCharge = creep.charge < 15 ?
                        'red' :
                        creep.charge < 30 ? 'orange' :
                            '';

                    if (creep.charge < 30) {
                        roomVisual.circle(creep.pos, {
                            radius: 0.2,
                            fill: colorCharge,
                            opacity: 0.7,
                        })
                    }
                    if (creep.needEvolve) {
                        roomVisual.circle(creep.pos, {
                            radius: 0.4,
                            fill: 'green',
                            opacity: 0.4,
                        })
                    }
                }

            });
    }

    /**
     * @param roomVisual {RoomVisual}
     * @param room {Room}
     */
    drawPlanifierBuilding(roomVisual, room) {
        const spawn = this.roomData.getMainSpawn();
        const espace = 6;

        this.buildExtension(roomVisual, new RoomPosition(
            spawn.pos.x - espace,
            spawn.pos.y,
            this.room));
        this.buildExtension(roomVisual, new RoomPosition(
            spawn.pos.x - espace,
            spawn.pos.y - espace,
            this.room));
        this.buildExtension(roomVisual, new RoomPosition(
            spawn.pos.x,
            spawn.pos.y - espace,
            this.room));

        this.buildExtension(roomVisual, new RoomPosition(
            spawn.pos.x,
            spawn.pos.y,
            this.room));

        this.buildExtension(roomVisual, new RoomPosition(
            spawn.pos.x + espace,
            spawn.pos.y,
            this.room));
        this.buildExtension(roomVisual, new RoomPosition(
            spawn.pos.x,
            spawn.pos.y + espace,
            this.room));
        this.buildExtension(roomVisual, new RoomPosition(
            spawn.pos.x + espace,
            spawn.pos.y + espace,
            this.room));

        this.buildExtension(roomVisual, new RoomPosition(
            spawn.pos.x - espace,
            spawn.pos.y + espace,
            this.room));
        this.buildExtension(roomVisual, new RoomPosition(
            spawn.pos.x + espace,
            spawn.pos.y - espace,
            this.room));
    }


    /** BUILDING **/

    /**
     *
     * @param roomVisual {RoomVisual}
     * @param inputPos {RoomPosition}
     */
    buildExtension(roomVisual, inputPos) {
        const centerPos = new RoomPosition(
            inputPos.x,
            inputPos.y,
            this.room,
        );

        roomVisual.circle(centerPos, {
            radius: 0.4,
            fill: 'green',
            opacity: 0.4,
        })

        // Define the layout for extension placement
        const extensionLayout = [
            [-1, -2],
            [0, -2],
            [1, -2],
            [-2, -1],
            [2, -1],
            [-2, 0],
            [2, 0],
            [-2, 1],
            [2, 1],
            [-1, 2],
            [0, 2],
            [1, 2],
        ];
        let extensionsBuilt = 0;
        const maxExtensions = extensionLayout.length;
        if (extensionsBuilt < maxExtensions) {
        }

        for (let i = 0; i < extensionLayout.length; i++) {
            const iLayout = extensionsBuilt + i;
            const pos = new RoomPosition(
                centerPos.x + extensionLayout[iLayout][0],
                centerPos.y + extensionLayout[iLayout][1],
                this.room);

            const structuresAtPos = this.gameAccess.getRoom(this.room).lookForAt(LOOK_STRUCTURES, pos)
                .filter(val => val.structureType === STRUCTURE_EXTENSION);
            const structuresAtPos2 = this.gameAccess.getRoom(this.room).lookForAt(LOOK_STRUCTURES, pos)
                .filter(val => val.structureType !== STRUCTURE_EXTENSION);
            const color = structuresAtPos.length > 0 ?
                'orange' :
                structuresAtPos2.length > 0 ?
                    'red' :
                    'green'
            roomVisual.circle(pos, {
                radius: 0.4,
                fill: color,
                opacity: 0.4,
            })
        }

        const roadLayout = [
            [-2, -2],
            [2, -2],
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [-2, 2],
            [2, 2],
        ]
        let roadBuilt = 0;

        for (let i = 0; i < roadLayout.length; i++) {
            const iLayout = roadBuilt + i;
            const pos = new RoomPosition(
                centerPos.x + roadLayout[iLayout][0],
                centerPos.y + roadLayout[iLayout][1],
                this.room);

            const structuresAtPos = this.gameAccess.getRoom(this.room).lookForAt(LOOK_STRUCTURES, pos)
                .filter(val => val.structureType === STRUCTURE_ROAD);
            const structuresAtPos2 = this.gameAccess.getRoom(this.room).lookForAt(LOOK_STRUCTURES, pos)
                .filter(val => val.structureType !== STRUCTURE_ROAD);
            const color = structuresAtPos.length > 0 ?
                'orange' :
                structuresAtPos2.length > 0 ?
                    'red' :
                    'blue'
            roomVisual.circle(pos, {
                radius: 0.4,
                fill: color,
                opacity: 0.4,
            })
        }


        const clearanceLayout = []
        const clearanceRange = 3
        for (let i = -clearanceRange; i <= clearanceRange; i++) {
            clearanceLayout.push([i, -clearanceRange])
            clearanceLayout.push([i, clearanceRange])
            clearanceLayout.push([-clearanceRange, i])
            clearanceLayout.push([clearanceRange, i])
        }
        const clearancesPos = clearanceLayout
            .map((value, count) => {
                const xLayout = value[0] + centerPos.x;
                const yLayout = value[1] + centerPos.y;
                return new RoomPosition(xLayout, yLayout, this.room);
            });
        const checkStruct = clearancesPos
            .filter(pos =>
                this.gameAccess.getRoom(this.room).getTerrain().get(pos.x, pos.y) === TERRAIN_MASK_SWAMP ||
                this.gameAccess.getRoom(this.room).lookForAt(LOOK_STRUCTURES, pos).length !== 0,
            );

        const color = checkStruct.length > 0 ?
            'red' :
            'grey';
        clearancesPos.forEach(pos => {
            roomVisual.circle(pos, {
                radius: 0.4,
                fill: color,
                opacity: 0.4,
            })
        })
    }

    /** BUILDING **/




    drawControllerInfo(roomVisual, room) {
        const controller = room.controller
        const x = controller.pos.x - 5;
        const y = controller.pos.y;

        const style = {
            /*fill: 'transparent',*/
            stroke: '#000000',
        };
        const font = 0.65;
        const space = font + .05;
        const styleTxt = {
            font: font,
            align: 'left',
            opacity: 0.6,
            stroke: '#000000FF',
        }
        let line = space;

        const totalLine = 3;

        const afterLine = (line * (1 + totalLine));

        // const controller = new StructureController();
        const prct = Math.round(((controller.progress / controller.progressTotal) * 100) * 100) / 100;

        roomVisual.rect(x, y, 5, afterLine, style);

        roomVisual.text(`Controller`, x + 0.2, y + line, styleTxt);
        line += space;

        roomVisual.text(`lvl:${controller.level} ${prct.toFixed(2)} %`, x + 0.2, y + line, styleTxt);
    }

    displaySpawnEnergy(roomVisual, room) {
        const spawns = this.roomData.getSpawners()[0];
        const color = this.roomData.baseReport.needFillingRoomEnergy ?
            'red' : 'green'
        roomVisual.circle(spawns.pos, {
            radius: 0.5,
            fill: color,
            opacity: 0.3,
        });
    }

    displayEnergyInfo(roomVisual, room) {
        const sources = this.roomData.getSources();
        const spawns = this.roomData.getSpawners();
        const extensions = room.find(FIND_MY_STRUCTURES, {
            filter: {
                structureType: STRUCTURE_EXTENSION,
            },
        });
        // const baseReport = this.roomData.getBaseReport();
        // // Display sources
        // sources.forEach(source => {
        //     baseReport.retrieveStorageFromIdObject(source.id).forEach(idStorage => {
        //         const storage = this.gameAccess.Game.getObjectById(idStorage)
        //         if (storage) {
        //             roomVisual.circle(storage.pos, {
        //                 radius: 0.5,
        //                 fill: 'red',
        //                 opacity: 0.5,
        //             });
        //         }
        //     });
        //
        //     roomVisual.circle(source.pos, {
        //         radius: 0.5,
        //         fill: 'yellow',
        //         opacity: 0.5,
        //     });
        // });

        // Display spawns
        spawns.forEach(spawn => {
            baseReport.retrieveStorageFromIdObject(spawn.id).forEach(idStorage => {
                const storage = this.gameAccess.Game.getObjectById(idStorage)
                if (storage) {
                    roomVisual.circle(storage.pos, {
                        radius: 0.5,
                        fill: 'red',
                        opacity: 0.5,
                    });
                }
            });
            const currentEnergy = room.energyAvailable;
            const maxEnergy = room.energyCapacityAvailable;
            roomVisual.text(`${currentEnergy} / ${maxEnergy}`, spawn.pos.x + 1, spawn.pos.y, {
                align: 'left',
                opacity: 0.8,
            });
        });


    }
}

module.exports = Visual;