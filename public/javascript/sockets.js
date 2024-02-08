const socket = io({
    auth:{
        token:""
    }
});
socket.connect();
socket.on("connect",()=>{console.log(socket.id)})