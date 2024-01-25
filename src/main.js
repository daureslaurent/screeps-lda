const Movement = require('src/movement');
const {halt} = require('utils/Logs');
const Logs = require('utils/Logs');
Movement.setConfig({
    calculateCarryWeight: true,
    defaultStuckLimit: 2,
    // staticCreepFilter: defaultIsStatic, // See setStatic() method below.
    // trackHostileRooms: false,
    // visualise: true,
});
const version = $VERSION;

const ENABLE_VISUAL = false;

const profiler = new (require('core/monitoring/Profiler'))();
const gameAccess = new (require('core/game/GameAccess'))(profiler)
const roomDataFactory = new (require('core/game/RoomDataFactory'))
const modules = [
    // new (require('extractor'))(),
    new (require('core/city/CitiesBinder'))(gameAccess, roomDataFactory),
    new (require('core/bot.scheduler'))(gameAccess, roomDataFactory),
];
const monitoring = new (require('core/monitoring/monitoring'))(gameAccess);
const visual = new (require('core/visual/visual'))(gameAccess, roomDataFactory);

const THROTTLE_LOW = 500;
const THROTTLE_HIGH = 2000;
let throttle = true;

const currentShard = Game.shard.name;
const reset = Game.time;
/** @type {InjectRemote} */
const inject = new (require('console/inject/InjectRemote'))(gameAccess, roomDataFactory)
this.inject = inject

module.exports.loop = function () {
    inject.updateStart();

    if (reset === Game.time) {
        halt('=== RESET ===')
    }
    // return;

    // allCreepProcess();
    // Game.memory = {};
    // return;

    const bucket = Game.cpu.bucket;
    let skipTick = false
    if (bucket < 300 && Game.time % 2 === 0
        || bucket < 1000 && Game.time % 4 === 0
        || bucket < 2000 && Game.time % 6 === 0
        || bucket < 3000 && Game.time % 12 === 0
    ) {
        skipTick = true
    }


    const startBanner = `--=VVV=============================================- -==| ${currentShard.toUpperCase()} | [${bucket}]=-- ${version} --====- =============================================> ${Game.time - reset}`
    const endBanner = `--=^^^=============================================- -==| ${currentShard.toUpperCase()} | [${bucket}]=-- ${version} --====- =============================================<`
    console.log(startBanner)


    checkClean();
    gameAccess.tick();

    if (throttle === true && bucket <= THROTTLE_HIGH) {
        console.log(`Searching CPU ... ${Game.cpu.bucket} / ${THROTTLE_HIGH}`)
        console.log(endBanner)
        return;
    }
    throttle = bucket <= THROTTLE_LOW

    // utilsBuilderNexus.buildNexus(Game.flags.EDEN2.pos, true)
    // utilsBuilderNexus.buildNexus(Game.spawns["Spawn1"].pos, true)

    if (Game.cpu.bucket >= 10000 && Game.cpu.generatePixel && currentShard !== 'shard3') {
        Game.cpu.generatePixel()
        halt('SYS --- Generate pixel')
    }

    // if (currentShard === 'shard2') {
    // }
    // else {
    // utilsBuilderNexus.buildNexus(Game.flags.EDEN2.pos, true)
    // console.log(`New shard handle -> ${currentShard}`)
    // for(var i in Game.creeps) {
    //     const c = Game.creeps[i];
    //     if (!c.memory.role) {
    //
    //         const flagRoom = Game.flags.EDEN2 ? Game.flags.EDEN2.pos.roomName : undefined
    //
    //         console.log('Inject Creep from other shard')
    //         if (c.name.includes("EDEN")) {
    //             c.memory = {
    //                 role: BotRole.EDEN,
    //                 level: 0,
    //                 bodyCost: 0,
    //                 baseRoom: flagRoom,
    //                 colon: undefined,
    //             }
    //         } else if (c.name.includes("BREAKER")) {
    //             c.memory = {
    //                 role: BotRole.BREAKER,
    //                 level: 0,
    //                 bodyCost: 0,
    //                 baseRoom: flagRoom,
    //                 colon: undefined,
    //             }
    //         }
    //     }
    // }
    // if (c.memory.baseRoom === this.room) {
    //     creeps.push(c);
    // }

    if (skipTick === false) {
        modules
            .map(filter)
            .map(module => module.execute())

        if (ENABLE_VISUAL /*&& Game.shard.name === 'shard3'*/) {
            visual.execute();
        }

        profiler.execute()
    }
    else {
        console.log(' ==== SKIPED TICK ! ====')
    }

    monitoring.execute();
    console.log(endBanner)
    checkForCommands();
}


// const nexus = Game.flags.NEXUS
// if (nexus != null && nexus.pos != null) {
//     // utilsBuilderNexus.buildNexus(nexus.pos)
// }

function checkForCommands() {
    if (Memory.commands && Memory.commands.length > 0) {
        let command = Memory.commands.shift();
        if (command.command === 'InitRemote') {
            Logs.log('Init remote ...')
        }
    }
}

const filter = (module) => {
    return module;
}

// CLEAN
function checkClean() {
    // Check if it's time to perform the cleanup (e.g., every 500 ticks)
    if (!Memory.lastCleanup || Game.time - Memory.lastCleanup >= 25) {
        cleanDeadCreepsMemory()
        // Update the last cleanup time
        Memory.lastCleanup = Game.time;
    }
}

function cleanDeadCreepsMemory() {
    const allCreeps = Game.creeps;
    // if (allCreeps && allCreeps.length > 5) {
    for (const creepName in Memory.creeps) {
        if (!(creepName in allCreeps)) {
            // Creep no longer exists, remove it from memory
            delete Memory.creeps[creepName];
            console.log(`Removed dead creep memory for ${creepName}`);
        }
    }
}

// }

function allCreepProcess() {
    const allCreeps = Game.creeps;
    // if (allCreeps && allCreeps.length > 5) {
    for (const creepName in Memory.creeps) {
        if ((creepName in allCreeps)) {
            Memory.creeps[creepName].worker = undefined;
        }
        // Creep no longer exists, remove it from memory
        // delete Memory.creeps[creepName];
        // console.log(`Removed dead creep memory for ${creepName}`);
    }
}