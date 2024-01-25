// const utils = require('utils')
// utils.talkAction(creep, '👜')


module.exports = {
    // talkAction: (creep, txt) => {
    //     creep.room.visual.text(txt,
    //         creep.pos.x, creep.pos.y, { align: 'center', opacity: 0.7 });
    // },
    talkAction: (creep, txt) => {
        creep.room.visual.text(
            txt,
            creep.pos.x - .48,
            creep.pos.y + .242, {
                color: 'white',
                fontSize: 0.5,
                opacity: 0.8,
                align: 'left',
                stroke: 'black',
                strokeWidth: 0.1,
            },
        );
    },
    mapToList: (map) => {
        return [].concat(...Array.from(map.values()));
    },
    generateUniqueId: () => {
        const timestamp = String(Game.time).slice(-3);
        const random = Math.floor(Math.random() * 5000000); // Adjust the range as needed

        return `${timestamp}-${random}`;
    },
    /**
     * @param body {Array<{boost: string, type: string, hits: number}>}
     * @param type {string}
     */
    countBody(body, type) {
        return body.filter(b => b.type === type).length;
    },
    /**
     * @param startPos {RoomPosition}
     * @param endPos {RoomPosition}
     * @param creepSpeed
     * @return {number}
     */
    estimateTicksBetweenRooms(startPos, endPos, creepSpeed) {
        const route = Game.map.findRoute(startPos.roomName, endPos.roomName);
        if (route === ERR_NO_PATH || route.length === 0) {
            return Infinity; // No path found or rooms are not connected
        }
        let totalDistance = 0;

        // Calculate the distance between rooms
        for (let i = 0; i < route.length; i++) {
            if (i === 0) {
                totalDistance += Game.map.getRoomLinearDistance(startPos.roomName, route[i].room);
            } else {
                totalDistance += Game.map.getRoomLinearDistance(route[i - 1].room, route[i].room);
            }
        }

        // Calculate the ticks required
        return totalDistance * 50 / creepSpeed;
    },
}