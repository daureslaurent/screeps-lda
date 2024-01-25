const axios = require('axios');
const doPost = (time, topic, legend, value) => {
    const sendData = { time: time, topic: topic, legend: legend, value: value }
    axios.post('http://192.168.10.110:3005/screeps', sendData)
        .then((response) => {
            console.log(response.data); // Process the response data
        })
        .catch((error) => {
            // console.error(error); // Handle error if request fails
        });

}

const { ScreepsAPI } = require('screeps-api');

const INJECT_REMOTE =
    "if (this.inject===undefined){this.inject=new(require('./console_inject_InjectRemote'))}this.inject.run();this.inject.setOverrideOutput(false)"

// All options are optional
const api = new ScreepsAPI({
    token: '123',
    protocol: 'https',
    hostname: 'screeps.com',
    port: 443,
    path: '/' // Do no include '/api', it will be added automatically
});

api.socket.connect()
// Events have the structure of:
// {
//   channel: 'room',
//   id: 'E3N3', // Only on certain events
//   data: { ... }
// }
api.socket.on('connected',()=>{
    // Do stuff after connected
})
api.socket.on('auth',(event)=>{
    // event.data.status contains either 'ok' or 'failed'
    // Do stuff after auth

    console.log('auth OK')
    let lastTime = new Date();
    api.socket.subscribe('console', (event)=> {
        /** @type {string[]} */
        if (event.data.messages !== undefined) {
            const time = new Date();
            const logs = event.data.messages.log;
            logs.forEach(l => printLog(l))
            if (lastTime != null) {
                doPost(time, 'tick', 'tick', time - lastTime)
                lastTime = time;
            }
        }
    })
    api.console(INJECT_REMOTE, 'shard2')

// More common examples
//     api.socket.subscribe('cpu',(event)=>console.log('cpu',event.data))
})


/**
 * @param log {string}
 */
const printLog = (log) => {
    if (log.includes('|<<>>|')) {
        return console.log('\x1b[37m', log.replace('|<<>>|', ''), '\x1b[0m')
    }
    else if (log.includes('|<<A>>|')) {
        const rawMsg = log.replace('|<<A>>|', '');
        const split = rawMsg.split('|');
        const time = split[0]
        const data = split[1]
        return console.log('\x1b[35m', `[*${time}][${data.length > 150 ? '...' : JSON.parse(data)}]`, '\x1b[0m\x1b[34m', ` ${split[2]}`, '\x1b[0m')
    }
    else if (log.includes('|<<E>>|')) {
        const rawMsg = log.replace('|<<E>>|', '');
        const split = rawMsg.split('|');
        const time = split[0]
        const data = split[1]
        return console.log('\x1b[35m', `[*${time}][${data.length > 150 ? '...' : JSON.parse(data)}]`, '\x1b[0m\x1b[31m', ` ${split[2]}`, '\x1b[0m')
    }
    else if (log.includes('|<<HALT>>|')) {
        const rawMsg = log.replace('|<<HALT>>|', '');
        const split = rawMsg.split('|');
        const time = split[0]
        const data = split[1]
        return console.log('\x1b[33m', `[*${time}][${data.length > 150 ? '...' : JSON.parse(data)}]`, '\x1b[0m\x1b[34m', ` ${split[2]}`, '\x1b[0m')
    }
    else if (log.includes('|<<DATA>>|')) {
        const rawMsg = log.replace('|<<DATA>>|', '');
        const split = rawMsg.split('|');
        const time = split[0]
        const data = split[1]
        return console.log('\x1b[33m', `[*${time}][${JSON.parse(data)}]`, '\x1b[0m\x1b[33m', ` ${split[2]}`, '\x1b[0m')
    }
    else if (log.includes('|<<EX>>|')) {
        const rawMsg = log.replace('|<<EX>>|', '');
        const split = rawMsg.split('|');
        const time = split[0]
        const data = split[1]
        // doPost(time, data)
        // return console.log('\x1b[33m', `[*${time}][${JSON.parse(data)}]`, '\x1b[0m\x1b[33m', ` ${split[2]}`, '\x1b[0m')
    }
    else if (log.includes('|<<CHART>>|')) {
        const rawMsg = log.replace('|<<CHART>>|', '');
        const split = rawMsg.split('|');
        const time = split[0]
        const topic = split[1]
        const legend = split[2]
        const value = split[3]
        // doPost(time, topic, legend, value)
        // return console.log('\x1b[33m', `[*${time}][${JSON.parse(data)}]`, '\x1b[0m\x1b[33m', ` ${split[2]}`, '\x1b[0m')
    }
    // return console.log(log)
}