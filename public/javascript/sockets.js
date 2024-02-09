const socket = io();
socket.connect();
socket.on("connect",()=>{console.log(socket.id)})
const logo = document.querySelector("div.header>div>h1")
logo.addEventListener("click",()=>{
    console.log("s");
    socket.emit("hello","world!");
})