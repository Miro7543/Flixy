const router = require("express").Router();
const db = require("./db");
const path = require("path");
const redis = require("./redis");
const pages = require("./pages");
const games = require("../games.json");
const { createReadStream } = require("fs");

function validateCode(code){
    const reg= new RegExp(/^[A-Z,a-z]{4}$/);
    return reg.test(code)
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
    res.redirect(`/lobby/${req?.body?.lobby_code || "0000"}`);
})

router.post("/create", (req,res)=>{
    if(!req.body || !Object.keys(games).includes(req.body.game)){
        //message => Server error
        res.redirect(req.url);
        return;
    }
    db.query("Insert into lobbies(game) values ($1) returning code;",[req.body.game])
    .then(data=>{
        res.redirect("/lobby/"+data.rows[0].code);
    })
})

router.get("/:code", (req,res)=>{
    if(!req.params || !req.params.code)
    return res.redirect("/");

    req.params.code=req.params.code.toUpperCase();
    
    if(!validateCode(req.params.code)){
        //Message - Invalid code
        return res.redirect("/");
    }
    //Has space?
    //Has lobby?
    
    retrieveMessages(req.params.code,req.user)
    .then(data=>{
        renderLobbyPage(res,{code:req.params.code,messages:data})
    })

    // joinLobby(req.params.code, req.user, req, res);
})

router.post("/leave", (req,res)=>{
    db.query("delete from players_lobbies using users where players_lobbies.userid = users.id and users.sessionid = $1;",[req?.user?.sessionid])
    .then(data=>{
        res.redirect("/");
        res.end();
    })
    
    // redis.get(req.user.sessionid)
    // .then(data=>{
    //     if(!data){
    //     }
    // })

    // res.redirect("/");
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
        db.query("delete from players_lobbies using users, lobbies where players_lobbies.userid = users.id and users.sessionid = $1 and players_lobbies.lobbyid = lobbies.id and lobbies.code = $2",[socket.user.sessionid, code])
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
    console.log(socket.user);
    if(!socket?.user?.username)socket.emit("redirect","/");
    socket.ON("message",(message)=>{
        io.to(code).emit("newMessage",message, socket?.user?.username);
        db.query("Insert into messages_lobbies (userid, message, lobbycode) values ($1,$2,$3)",[socket?.user?.id, message, code])
    })
}

function attachSocket(socket,io){
    const code = socket.url.slice(-4).toUpperCase();
    joinLobby(socket,io,code );
    socketDisconnect(socket,io,code);
    messageCreated(socket,io,code);
    startingGame(socket,io,code);
    // })
    // .catch(err=>{console.error(err)})
    // socket.in(code).on("joinLobby",()=>{

    // })
}


module.exports={
    router,
    attachSocket,

};