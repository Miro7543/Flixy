socket.on("GameStarted",(data)=>{
    fetch(`/tic-tac-toe/${data.code}`)
    .then(data=>{
        if(data.ok){
            return data.text();
        }
    })
    .then(data=>{
        document.documentElement.innerHTML = data;
        startCountdown();
        const clockLabel = document.querySelector("label.clock");
        startClock(clockLabel,63,60);
        addCellListeners();
    })// document.querySelector("div.playersCont").innerHTML = data.players;
})

function addCellListeners(){
    document.querySelectorAll("td").forEach(cell=>{
        cell.addEventListener("click",()=>{
            const position = Number(cell.id.slice(4));
            socket.emit("play" ,position);
        })
    })
}

socket.on("win",(pos,table)=>{
    pos.forEach(position=>{
        const cell = document.getElementById('cell'+position)
        cell.innerHTML = table[position];
        cell.classList.add("winning");
    })
    displayOverlay("You won!")
    setTimeout(()=>{window.location.href = "/"},5000);
})
socket.on("lose",(pos,table)=>{
    pos.forEach(position=>{
        const cell = document.getElementById('cell'+position)
        cell.innerHTML = table[position];
        cell.classList.add("losing");
    })
    displayOverlay("You lost!")
    setTimeout(()=>{window.location.href = "/"},5000);
})
socket.on("tie",()=>{
    displayOverlay("It's a tie!")
    setTimeout(()=>{window.location.href = "/"},5000);
})

socket.on("turn",(player, table)=>{
    document.querySelectorAll('.onTurn').forEach(el=>el.classList.remove("onTurn"));
    document.querySelector("div."+player).classList.add("onTurn");
    updateTable(table);

})

function updateTable(table){
    table.forEach((element,index) => {
        document.getElementById('cell'+index).innerHTML = element;
    });
}