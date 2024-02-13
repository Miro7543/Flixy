socket.on("GameStarted",(data)=>{
    fetch("TTT.html")
    .then(data=>{
        if(data.ok){
            return data.text();
        }
    })
    .then(data=>{
        document.body.innerHTML=data;
    })// document.querySelector("div.playersCont").innerHTML = data.players;
})