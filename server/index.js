const express = require('express');
const app = express()
const WebSocket = require('ws')
const pty = require('node-pty')
// require('express-ws')(app)

const wss = new WebSocket.Server({port: 3031})

const os = require('os')
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'

wss.on('connection', (ws) => {
    console.log('websocket 连接成功了')
    console.log(ws)
    let data = Buffer.from(JSON.stringify({type: 'write', terminal: 'hello world'}))
    ws.send(data)
    // console.log(ws, 'ws=====')
    const term = pty.spawn(shell, ['--login'], {
        name: 'xterm',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    })

    ws.on('open', (data) => {
        console.log('open data ===', data)
    })

    ws.on('create', opt => {
        const term = pty.spawn(shell, ['--login'], {
            name: opt.name,
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env
        })
        term.on('data', data => {
            process.stdout.write(data)
            ws.send(data)
            ws.emit(`${opt.name}-message`, data)
        })
        // ws.on(`${opt.name}-write`, data => term.write(data))
        // ws.on(`${opt.name}-resize`, size => term.resize(size[0], size[1]))
        // ws.on(`${opt.name}-destory`, () => term.destroy())
        // ws.emit(option.name + '-pid', term.pid)

    })
    ws.on('message', (data) => {
        console.log('接收客户端的数据：',  data)
        term.write(data)
    })

    ws.on('close', () => {
        term.kill()
    })

    term.on('data', (data) => {
        process.stdout.write(data);
        ws.send(data)
        let obj = Buffer.from(JSON.stringify({type: 'write', terminal: 'hello world'}))
        ws.send(obj)
    }) 
})
// app.listen(3030)