const NEXUS_EXTENSION = [{
    dx: 1,
    dy: 1,
},
    {
        dx: -1,
        dy: 1,
    },
    {
        dx: 1,
        dy: -1,
    },
    {
        dx: -1,
        dy: -1,
    },
];


function buildExtensionSample(x1, y1, dx, dy, level) {
    const x = x1 + (dx * level);
    const y = y1 + (dy * level);
    const posA0 = {
        x: x,
        y: y + dy,
    }
    const posA1 = {
        x: x,
        y: y + (dy * 2),
    }
    const posB0 = {
        x: x + dx,
        y: y,
    }
    const posB1 = {
        x: x + (dx * 2),
        y: y,
    }
    return [posA0, posA1, posB0, posB1]
}

function buildExtensionSampleEnd(x, y, dx, dy, i) {
    const posA0 = {
        x: x + (dx * (i)),
        y: y + (dy * (i + 1)),
    }
    const posB0 = {
        x: x + (dx * (i + 1)),
        y: y + (dy * i),
    }
    return [posA0, posB0]
}

function buildExtensionSampleBorderEnd(x, y, dx, dy) {
    const posA0 = {
        x: x,
        y: y + (dy * 3),
    }
    const posA1 = {
        x: x,
        y: y + (dy * 4),
    }
    const posA2 = {
        x: x + dx,
        y: y + (dy * 4),
    }
    const posB0 = {
        x: x + (dx * 3),
        y: y,
    }
    const posB1 = {
        x: x + (dx * 4),
        y: y,
    }
    const posB2 = {
        x: x + (dx * 4),
        y: y + dy,
    }
    return [posA0, posA1, posA2, posB0, posB1, posB2]
}

function buildNexusRoadMidle(x, y, dx, dy, i) {
    return [{
        x: x + (dx * i),
        y: y + (dy * i),
    }];
}

function buildNexusRoadAxes(x, y, i) {
    const ret = [];
    for (let j = 1; j < i; j++) {
        ret.push({
            x: x + j,
            y: y,
        })
        ret.push({
            x: x - j,
            y: y,
        })
        ret.push({
            x: x,
            y: y - j,
        })
        ret.push({
            x: x,
            y: y + j,
        })
    }
    return ret;
}

function buildNexusRoadBorder(x, y, dx, dy, i) {
    const ret = []
    for (let j = 0; j < 5; j++) {
        const posA0 = {
            x: x + (dx * j),
            y: y + (dy * 5),
        }
        ret.push(posA0)
        const posB2 = {
            x: x + (dx * 5),
            y: y + (dy * j),
        }
        ret.push(posB2)
    }
    return ret
}

function buildTower(x, y, dx, dy, i) {
    return {
        x: x + (dx * i),
        y: y + (dy * i),
    }
}

module.exports = {
    /**
     *
     * @param pos {RoomPosition}
     * @param show {boolean}
     */
    buildNexus: (pos, show = false) => {
        if (!pos || !Game.rooms[pos.roomName]) {
            return;
        }
        const visual = Game.rooms[pos.roomName].visual;
        const style = {
            radius: 0.2,
            fill: '#1bb2c0',
            opacity: 0.4,
        };
        const styleB = {
            radius: 0.2,
            fill: '#532893',
            opacity: 0.4,
        };
        const styleC = {
            radius: 0.2,
            fill: '#c01b1b',
            opacity: 1,
        };
        const styleD = {
            radius: 0.2,
            fill: '#00ff78',
            opacity: 0.4,
        };
        const styleE = {
            radius: 0.2,
            fill: '#1100ff',
            opacity: 0.4,
        };

        //Build Extension
        const nexusPos = [];
        NEXUS_EXTENSION.forEach(d => {
            if (!(d.dx === 1 && d.dy === 1)) {
                const ox = pos.x + d.dx;
                const oy = pos.y + d.dy;
                for (let i = 0; i < 3; i++) {
                    buildExtensionSample(ox, oy, d.dx, d.dy, i).forEach(n => nexusPos.push(n));
                }
                buildExtensionSampleEnd(ox, oy, d.dx, d.dy, 3).forEach(n => nexusPos.push(n));
                buildExtensionSampleBorderEnd(ox, oy, d.dx, d.dy).forEach(n => nexusPos.push(n));
            }
        })

        // Build road
        const roadPos = [];
        NEXUS_EXTENSION.forEach(d => {
            const ox = pos.x + d.dx;
            const oy = pos.y + d.dy;
            buildNexusRoadBorder(ox, oy, d.dx, d.dy, 3).forEach(n => roadPos.push(n));

            for (let i = 0; i < 5; i++) {
                buildNexusRoadMidle(ox, oy, d.dx, d.dy, i).forEach(n => roadPos.push(n));
            }

        })
        buildNexusRoadAxes(pos.x, pos.y, 6).forEach(n => roadPos.push(n))

        // Build city rampart
        const cityRampart = [];
        const cityRampartMap = new Map();
        for (let i = 0; i <= 6; i++) {
            const ox = pos.x + i;
            const oy = pos.y + i;

            cityRampart.push({x:pos.x - 6, y: pos.y - i})
            cityRampart.push({x:pos.x - 6, y: pos.y + i})

            cityRampart.push({x:pos.x + 6, y: pos.y - i})
            cityRampart.push({x:pos.x + 6, y: pos.y + i})

            cityRampart.push({x:pos.x - i, y: pos.y - 6})
            cityRampart.push({x:pos.x + i, y: pos.y - 6})

            cityRampart.push({x:pos.x - i, y: pos.y + 6})
            cityRampart.push({x:pos.x + i, y: pos.y + 6})
        }

        // Build tower
        const towerPos = [];
        NEXUS_EXTENSION.forEach(d => {
            const ox = pos.x + d.dx;
            const oy = pos.y + d.dy;
            towerPos.push(buildTower(ox, oy, d.dx, d.dy, 5));
        })
        towerPos.push({
            x: pos.x + 6,
            y: pos.y,
        })
        towerPos.push({
            x: pos.x - 6,
            y: pos.y,
        })

        // Build Spawn
        const spawnPos = [];
        spawnPos.push({
            x: pos.x,
            y: pos.y + 6,
        })
        spawnPos.push({
            x: pos.x,
            y: pos.y - 6,
        })

        const container = [{
            x: pos.x + 1,
            y: pos.y + 2,
        }]
        const storage = [{
            x: pos.x + 2,
            y: pos.y + 1,
        }]

        const waitingPos = [{
            x: pos.x + 3,
            y: pos.y + 5,
        }]
        const operatorPos = [{
            x: pos.x + 3,
            y: pos.y + 2,
        }]

        const link = [{
            x: pos.x + 3,
            y: pos.y + 1,
        }]
        const terminal = [{
            x: pos.x + 4,
            y: pos.y + 1,
        }]

        if (show === true) {
            nexusPos.forEach(n => visual.circle({
                x: n.x,
                y: n.y,
                roomName: pos.roomName,
            }, styleB))
            roadPos.forEach(n => visual.circle({
                x: n.x,
                y: n.y,
                roomName: pos.roomName,
            }, styleC))
            towerPos.forEach(p => visual.circle({
                x: p.x,
                y: p.y,
                roomName: pos.roomName,
            }, styleD))
            spawnPos.forEach(p => visual.circle({
                x: p.x,
                y: p.y,
                roomName: pos.roomName,
            }, style))
            container.forEach(p => visual.circle({
                x: p.x,
                y: p.y,
                roomName: pos.roomName,
            }, styleE))
            storage.forEach(p => visual.circle({
                x: p.x,
                y: p.y,
                roomName: pos.roomName,
            }, styleE))
            waitingPos.forEach(p => visual.circle({
                x: p.x,
                y: p.y,
                roomName: pos.roomName,
            }, styleE))
            link.forEach(p => visual.circle({
                x: p.x,
                y: p.y,
                roomName: pos.roomName,
            }, {
                radius: 0.2,
                fill: '#eeff00',
                opacity: 0.4,
            }))
            terminal.forEach(p => visual.circle({
                x: p.x,
                y: p.y,
                roomName: pos.roomName,
            }, {
                radius: 0.2,
                fill: '#e600ff',
                opacity: 0.4,
            }))
        }

        const emptyPos = [];
        const dx = 1;
        const dy = 1;
        const ox = pos.x + dx;
        const oy = pos.y + dy;
        for (let i = 0; i < 3; i++) {
            buildExtensionSample(ox, oy, dx, dy, i).forEach(n => emptyPos.push(n));
        }
        buildExtensionSampleEnd(ox, oy, dx, dy, 3).forEach(n => emptyPos.push(n));
        buildExtensionSampleBorderEnd(ox, oy, dx, dy).forEach(n => emptyPos.push(n));

        return {
            container: container,
            link: link,
            terminal: terminal,
            road: roadPos,
            tower: towerPos,
            spawnPos: spawnPos,
            extension: nexusPos,
            storage: storage,
            waitingPos: waitingPos,
            operatorPos: operatorPos,
            emptyPos: emptyPos,
            cityRampart: cityRampart,
        }

    },


}