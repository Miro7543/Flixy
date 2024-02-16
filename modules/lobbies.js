const router = require("express").Router();
const db = require("./db");
const path = require("path");
const redis = require("./redis");
const sockets = require("./sockets");
const pages = require("./pages");
const games = require("../games.json");
const { createReadStream } = require("fs");
const gamesConfig = require("../games.json");
const moduleMap = {
    "tic-tac-toe" : require("./games/TTT"),
    "bulls-and-cows" : require("./games/bulls-and-cows"),
    "sudoku" : require("./games/sudoku")
}

const nameMap = {
    "tic-tac-toe": "Tic Tac Toe",
    "bulls-and-cows": "Bulls and Cows",
    "sudoku": "Sudoku"
}

function validateCode(code){
    const reg= new RegExp(/^[A-Z,a-z]{4}$/);
    return reg.test(code);
}

function renderLobbyPage(res,data){
    const reader = createReadStream(path.join(__dirname,"../","public", "html", "lobby.html"),{encoding:"utf8"});
    reader.pipe(pages.replaceInStream(data)).pipe(res);

}

function getPlayersInLobby(code){
    return db.query("Select * from lobby_players where code = $1",[code])
    .then(data=>{
        return data.rows.map(player=>
            `<div class = "playerCont"><h2>${player.username}</h2></div>`
        ).join('\n');
    })
}

function retrieveMessages(code,user){
    return db.query("select * from lobby_messages where code = $1",[code])
    .then(data=>{
        return data.rows.map(message=>
            `<div class = "messageCont ${user.username == message.username ? "self" : ""}">
                <label class = "sender">${message.username}</label>
                <label class = "message">${message.message}</label>
            </div>`
        ).join("\n");
    })
}

router.post("/join", (req,res)=>{
    console.log(req.body)
    validateLobby(req?.body?.lobby_code,false,req,res)
    .then(()=>validateSpace(req.body.lobby_code,false,req,res))
    .then(()=>{res.redirect(`/lobby/${req?.body?.lobby_code || "0000"}`)})
    .catch(err=>{console.log(err)})
})

router.post("/create", (req,res)=>{
    console.log(req.body)
    if(!req.body || !Object.keys(games).includes(req.body.game)){
        res.status(500);
        res.end();
        return;
    }
    db.query("Insert into lobbies(game) values ($1) returning code;",[req.body.game])
    .then(data=>{
        res.redirect("/lobby/"+data.rows[0].code);
    })
    .catch(err=>{res.status(500);res.end(0)});
})

router.get("/game.js",(req,res)=>{
    db.query("Select game from lobby_players where sessionid = $1 and status = 'in lobby'", [req.user.sessionid])
    .then(data=>{
        if(data.rowCount){
            res.setHeader("Content-Type", "application/javascript")
            res.sendFile(path.join(__dirname, "../", "public", "javascript", data.rows[0].game + ".js"));
            res.end()
        }
        else res.status(404).end();
    })
})

function validateSpace(code,redirect = true,req){
    return db.query("Select count(*) from lobby_players where code = $1",[code])
    .then(data1=>{
        return db.query("select game from lobbies where code = $1",[code])
        .then((data2)=>{
            if(Number(data1.rows[0].count)>=gamesConfig[data2.rows[0].game].maxPlayers){
                if(!redirect){
                    sockets.notification("The lobby is full",req.body.socketid,true)
                }
                else res.redirect("/");
                throw new Error("");
            }
            req.game = data2.rows[0].game;
        })
    })
}

function validateLobby(code,redirect=true,req,res){
    return db.query("Select * from lobbies where code = $1",[code ])
    .then(data=>{
        if(!data.rowCount){
            if(!redirect){
                sockets.notification(`There is no lobby with code ${code} `,req.body.socketid,true)
            }
            else res.redirect("/");
            throw new Error("");
        }
    })
}

router.get("/:code", (req,res)=>{
    console.log(req.params);
    if(!req.params || !req.params.code)
    return res.redirect("/");

    req.params.code=req.params.code.toUpperCase();
    
    if(!validateCode(req.params.code)){
        sockets.notification("Invalid code",req?.body?.sockeid);
        return res.redirect("/");
    }

    validateLobby(req.params.code,true,req)
    .then(()=>validateSpace(req.params.code,true,req))
    .then(()=>retrieveMessages(req.params.code,req.user))
    .then((data)=>renderLobbyPage(res,{code:req.params.code,messages:data,game:nameMap[req.game]}))
    .catch(err=>{console.error(err)})
})

router.post("/leave", (req,res)=>{
    db.query("delete from players_lobbies using users where players_lobbies.userid = users.id and users.sessionid = $1;",[req.user.sessionid])
    .then(data=>{
        res.redirect("/");
        res.end();
    })
})

function joinLobby(socket,io,code ){
    socket.join(code)
    db.query("Select id from lobbies where code = $1",[code])
    .then(lobbyData=>{
        if(!lobbyData.rowCount)
            throw new Error("No lobby found"); 
        if(!socket.user || !socket.user.id)
            throw new Error("No user found"); 
          
        return db.query(`
            Insert into players_lobbies (userid, lobbyid)
            values ($1,$2)
            on conflict (userid) do update
            set userid = excluded.userid, lobbyid = excluded.lobbyid
            returning *,xmax as conflict `,[
                socket.user.id,
                lobbyData.rows[0].id
            ]
        )
    })
    .then(()=>{
        return getPlayersInLobby(code);
    })
    .then((data)=>{
        io.to(code).emit("playerJoined",{players : data});
    
    })
    .catch(err=>{}/*Message*/ )
}

function socketDisconnect(socket,io,code){
    socket.ON("disconnect",()=>{
        if(socket?.user?.sessionid)
        db.query("delete from players_lobbies using users, lobbies where players_lobbies.userid = users.id and users.sessionid = $1 and players_lobbies.lobbyid = lobbies.id and lobbies.code = $2 and players_lobbies.status = 'in lobby' ",[socket.user.sessionid, code])
        .then(()=>{
            // socket.to(code).emit("playerLeft",{username : socket?.user?.username})
            return getPlayersInLobby(code)
        })
        .then((data)=>{
            io.to(code).emit("playerLeft",{players : data});
        })
    })
}

function messageCreated(socket,io,code){
    if(!socket?.user?.username)socket.emit("redirect","/");
    socket.ON("message",(message)=>{
        const socketsInRoom = io.sockets.in(code).adapter.sids;
        for (const socketId of socketsInRoom) {
            io.sockets.sockets.get(socketId[0]).emit(
                "newMessage",
                message,
                socket?.user?.username,
                socketId[0] === socket.id
            );
        }
        // io.to(code).emit("newMessage",message, socket?.user?.username);
        db.query("Insert into messages_lobbies (userid, message, lobbycode) values ($1,$2,$3)",[socket?.user?.id, message, code])
    })
}

function attachSocket(socket,io,code){
    joinLobby(socket,io,code );
    socketDisconnect(socket,io,code);
    messageCreated(socket,io,code);
    startingGame(socket,io,code);
    requestScript(socket,code);
}

function startingGame(socket,io,code){

    socket.ON("startGame",()=>{
        //checkPlayerCount();
        // getGame(socket.user.sessionid)
        db.query("Select id,game from lobbies where code = $1",[code])
        .then(data=>{
            if(data.rowCount)
                return db.query("UPDATE players_lobbies SET status = 'in game' WHERE lobbyid = $1",[data.rows[0].id])
                .then(()=>data.rows[0].game);
        })
        .then(data=>{
            if(data){
                console.log(data);
                io.to(code).emit("GameStarted",{game:data,code});
                moduleMap[data].startGame(socket,io,code);
            }
            else socket.emit("redirect",{url:"/"})

        })
    })
}

function getGame(sessionid){
    return db.query("Select * from lobby_players where sessionid = $1", [sessionid])
    .then(data=>{

        if(data.rowCount)
            return data.rows[0].game;
        else return;
    })
}


function requestScript(socket,code){
    db.query("Select game from lobbies where code = $1 ",[code])
    .then(data=>{
        if(!data.rowCount){
            //message - Server error
            return;
        }
        console.log(data.rows[0].game);
        socket.emit("get-script", {url: `${data.rows[0].game}.js`})
    })
}

module.exports={
    router,
    attachSocket,
};