const { Server } = require("socket.io");
const redis = require("./redis")
const auth =require("./auth");


let io;


function attachListeners(socket,IO){
    const urlToModule = [
        {reg:RegExp(/\/lobby\/[a-z,A-Z]{4}$/) , module : require("./lobbies")},
        // {reg:RegExp(/\/sudoku\/[a-z,A-Z]{4}$/) , module : require("./games/sudoku")},
        // {reg:RegExp(/\/ttt\/[a-z,A-Z]{4}$/) , module : require("./games/TTT")},
        // {reg:RegExp(/\/lobby\/[a-z,A-Z]{4}$/) , module : sudoku}
    ]
    socket.url = socket.handshake.headers.referer;
    const code = socket.url.slice(-4).toUpperCase();
    for(let url of urlToModule){
        if(url.reg.test(socket.url))
            url.module.attachSocket(socket,IO,code)
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
            const inSession = auth.isValid(socket.token);
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
                if(data)
                {
                    socket.user = data;
                    console.log(data.username, data.sessionid, socket.id)
                    redis.set("sid-socketid:" + data.sessionid, socket.id)
                    .then(()=>{
                        socket.ON = authenticater(socket);
                        attachListeners(socket,io);
                    })
                } 
            })
            
        })
    },
    logoutLastInstance:function(sessionid){
        return redis.get("sid-socketid:" + sessionid)
        .then(data=>{
            if(data !== null){
                const targetedSocket = io.sockets.sockets.get(data);  
                if(targetedSocket){
                    targetedSocket.emit("notifyLater","Someone has logged in to your account", true,()=>{
                        targetedSocket.emit("logout");
                    })
                }
            }
        })
    },
    notification:function (text,socketid,error){
        console.log(text,socketid,error)
        if(!socketid)return;
        const target = io.sockets.sockets.get(socketid);
        if(!target)return;
        if(error)target.emit("error",{text});
        else target.emit("notification",{text});
    },
    notifyLater:function(text,socketid,error,cb){
        console.log(text,socketid,error)
        if(!socketid)return;
        const target = io.sockets.sockets.get(socketid);
        if(!target)return;
        if(error)target.emit("notifyLater",text,error,cb);
        else target.emit("notifyLater",text,error,cb);

    },
    disconnectFromRoom:function(userid, lobbyid){

    }
} 

