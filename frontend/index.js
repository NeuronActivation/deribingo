'use strict';

const ws = new WebSocket("ws://" + location.hostname + "/deribingo-ws");

function sendMessage(json) {
    ws.send(JSON.stringify(json))
}

ws.addEventListener("open", () => {
    const msg = {
        "cmd": "load",
        "id": location.hash.substring(1)
    }

    sendMessage(msg)
})

ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data.toString())

    if(msg.cmd === "load") {
        if(msg.result === undefined) {
            let width = parseInt(prompt("Enter width"))
            let height = parseInt(prompt("Enter height"))

            generateBingoTable(width, height)
            setupBingoTable(width, height)
        }

        else {
            location.hash = msg.id

            generateBingoTable(msg.result.width, msg.result.height)
            fillBingoTable(msg.result.data)
        }
    }

    else if(msg.cmd === "cross") {
        const div = document.getElementById(msg.index.toString())
        
        if(msg.shouldCross)
            div.classList.add("crossed");

        else div.classList.remove("crossed");
    }
})

function setupBingoTable(width, height) {
    for(let i = 0; i < width * height; i++) {
        const div = document.getElementById(i.toString())

        div.onclick = (event) => {
            const value = prompt("Enter text")
            event.target.innerHTML = value
        }
    }

    const submit = document.createElement("button")
    submit.type = "button"
    submit.innerHTML = "Create bingo"

    submit.onclick = () => {
        let data = []

        for(let i = 0; i < width * height; i++) {
            const div = document.getElementById(i.toString())
            data.push({
                text: div.innerHTML,
                crossed: false
            })
        }

        const msg = {
            cmd: "create",
            
            bingo: {
                width: width,
                height: height,
                data: data
            }
        }

        document.getElementById("main").innerHTML = ""
        sendMessage(msg)
    }
    

    document.getElementById("main").appendChild(submit)
}

function fillBingoTable(data) {
    for(let i = 0; i < data.length; i++) {
        const entry = data[i]
        const div = document.getElementById(i.toString())

        div.innerHTML = entry.text

        if(entry.crossed)
            div.classList.add("crossed");

        div.onclick = (event) => {
            const shouldCross = !event.target.classList.contains("crossed")

            const msg = {
                cmd: "cross",
                index: event.target.id,
                shouldCross: shouldCross
            }

            sendMessage(msg)
        }
    }
}

function generateBingoTable(width, height) {
    const table = document.createElement("table")
    let i = 0

    for(let y = 0; y < height; y++) {
        const row = document.createElement("tr")

        for(let x = 0; x < width; x++) {
            const column = document.createElement("th")
            const div = document.createElement("div")

            div.className = "bingoentry"
            div.id = i

            column.appendChild(div)
            row.appendChild(column)
        
            i++
        }

        table.appendChild(row)
    }

    document.getElementById("main").appendChild(table)
}
