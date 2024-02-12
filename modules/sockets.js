const { Server } = require("socket.io");
const redis = require("./redis")
const jwt =require("jsonwebtoken");
const auth =require("./auth");

const lobbies = require("./lobbies");
const sudoku = require("../games/sudoku");
// const ttt = require("../games/ttt");

let io;


function attachListeners(socket,IO){
    socket.url = socket.handshake.headers.referer;
    const lobbyRegex = RegExp(/\/lobby\/[a-z,A-Z]{4}$/);
    if(lobbyRegex.test(socket.url)){
        lobbies.attachSocket(socket,IO);
    }
}

function getToken(socket){
    const cookies=socket.handshake.headers.cookie
    if(!cookies)return false;
    const token = cookiesConverter(cookies).token;
    if(!token)return false;
    return token;
}

function cookiesConverter(cookiesS){
    let cookies = cookiesS.split(";");
    return cookies.reduce((acc, cookie)=>{
        let items=cookie.trim().split("=");
        acc[items[0]] = items[1];
        return acc;
    },{});
}

function authenticater(socket){
    return function(event, cb){
        socket.on(event,(...args)=>{
            console.log(socket.token)
            const inSession = auth.isValid(socket.token);
            console.log(inSession);
            if(!inSession){
                socket.emit("redirect", {url:"/"})
                return;
            }
            const needsRefresh = auth.needsRefresh(socket.user);
            if(needsRefresh)
                socket.emit("set-token",{token:needsRefresh.newToken});
            cb(...args);
        })
        
    }
}




module.exports ={
    init:function (server){
        io = new Server(server);
        console.log("\x1b[34mSockets are set up and listening\x1b[37m");
        // io.use(authenticate)
        io.on("connection",(socket)=>{
            socket.token = getToken(socket);//gets the token 
            socket.url = new URL(socket.handshake.headers.referer).pathname;//gets the pathname
            
            auth.getData(socket.token)
            .then(data=>{
                if(!data){
                    socket.emit("redirect", {url:"/"})
                }
                else{
                    socket.user = data;
                    redis.set("sid-socketid:" + data.sessionid, socket.id)
                    .then(()=>{
                        socket.ON = authenticater(socket);
                        attachListeners(socket,io);
                    })
                } 
            })
            

            // socket.on("disconnect",(data)=>{
            //     if(socket.user){
            //         redis.del("sid-socketid:" + socket.user.sessionid)
            //     }
            // })
        })
    },
    logoutLastInstance:function(sessionid){
        return redis.get("sid-socketid:" + sessionid)
        .then(data=>{
            if(data !== null){
                const targetedSocket = io.sockets.sockets.get(data);  
                if(targetedSocket){
                    targetedSocket.emit("logout");
                }
            }
        })
    },
    disconnectFromRoom:function(userid, lobbyid){

    }
} 

