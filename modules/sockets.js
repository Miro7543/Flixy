const { Server } = require("socket.io");
const redis = require("redis").createClient();

function attachListeners(socket){
    
}

function cookiesConverter(cookiesS){
    let cookies = cookiesS.split(";");
    return cookies.reduce((acc, cookie)=>{
        let items=cookie.trim().split("=");
        acc[items[0]] = items[1];
        return acc;
    },{});
}

module.exports ={
    init:function (server){
        const io = new Server(server);
        console.log("\x1b[34mSockets are set up and listening\x1b[37m");
        io.on("connection",(socket)=>{
            // console.log(socket.handshake.headers.cookie);
            // console.log("connected");
            //Redis

            const cookies=socket.handshake.headers.cookie
            if(!cookies)return;
            const token = cookiesConverter(cookies).token;
            if(!token)return;
            
            // redis.set(, socket.id );
            socket.on("disconnect",(data)=>{
                // console.log("disconected");
                //Redis
            })
            attachListeners("socket");
        })
    }
} 

