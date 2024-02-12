const socket = io();
const timeouts={};


window.onload=()=>{
    socket.connect();
}

socket.on("connect",()=>{console.log("Hello")})

socket.on("set-token",(data)=>{
    fetch("/settoken",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify(data)
    });
})

socket.on("redirect",({url})=>{
    window.location.href = url;
})

socket.on("logout",()=>{
    window.location.href="/logout";
})

socket.on("playerJoined",(data)=>{
    document.querySelector("div.playersCont").innerHTML = data.players;
})

socket.on("playerLeft",(data)=>{
    document.querySelector("div.playersCont").innerHTML = data.players;
})

socket.on("newMessage",(message,username)=>{
    const messageHTML = `
    <div class = "messageCont self">
        <label class = "sender">${username}</label>
        <label class = "message">${message}</label>
    </div>
    `
    document.querySelector("div.messagesCont").innerHTML += messageHTML;
})

socket.on("GameStarted",(data)=>{
    window.location.href = "/" + data.game + "/" + data.code;
    // document.querySelector("div.playersCont").innerHTML = data.players;
})
