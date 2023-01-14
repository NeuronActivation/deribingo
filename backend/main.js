const express = require('express');
const process = require('process');
const webSocket = require('ws');
const path = require('path');
const http = require('http');
const fs = require('fs');

const app = express();
const port = 3000;
const wsPort = 3001;

app.use(express.static(path.resolve("../frontend/")));

const ws = new webSocket.Server({port: wsPort});

let bingos = {}
let connectionsInBingo = {}

function saveBingo(name) {
    fs.writeFile(path.resolve("bingos/" + name + ".json"), JSON.stringify(bingos[name]), 
    (err) => {
        if(err)
            console.log(err)
    })
}

function findBingo(client) {
    for (const [key, value] of Object.entries(connectionsInBingo)) {
        for(let i = 0; i < value.length; i++) {
            if(value[i] === client)
                return key;
        }
    }

    return undefined;
}

ws.on("connection", (client) => {
    client.on("message", (payload) => {
        let msg = undefined;

        try {
            msg = JSON.parse(payload.toString());
            console.log(msg)
        }

        catch(e) {
            client.close();
            return
        }

        if(msg.cmd === "create") {
            if(findBingo(client) !== undefined) {
                console.log("Connection already in a bingo :-)")
                client.close()
                return
            }

            const length = 5
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;

            for(let i = 0; i < length; i++)
                result += characters.charAt(Math.floor(Math.random() * charactersLength));

            bingos[result] = msg.bingo
            connectionsInBingo[result] = []
            saveBingo(result)

            msg = {
                cmd: "load",
                id: result
            }
        }

        if(msg.cmd === "load") {
            if(msg.id in bingos) {
                msg.result = bingos[msg.id]
                connectionsInBingo[msg.id].push(client)
            }
        }

        else if(findBingo(client) === undefined) {
            console.log("Connection not in a bingo :-(")
            client.close()
            return
        }

        if(msg.cmd === "cross") {
            const bingo = findBingo(client)
            bingos[bingo].data[msg.index].crossed = msg.shouldCross

            connectionsInBingo[bingo].forEach((c) => {
                c.send(JSON.stringify(msg))
            })

            saveBingo(bingo)
            return
        }

        client.send(JSON.stringify(msg))
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.resolve("../frontend/index.html"));
})

app.listen(port, () => {
    console.log(`The server is listening on port ${port}`);

    if(!fs.existsSync("bingos"))
        fs.mkdirSync("bingos")

    const files = fs.readdirSync("bingos")

    files.forEach((f) => {
        const name = f.substr(0, f.lastIndexOf("."))
        const data = fs.readFileSync(path.resolve("bingos/" + f))

        bingos[name] = JSON.parse(data)
        connectionsInBingo[name] = []
    })
})
