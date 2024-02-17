const router = require("express").Router();
const db = require("../db");
const redis = require("../redis");
const pages = require("../pages");
const fs = require("fs");
const path = require("path");
const lobbies = require("../games")

function TTT(room,socket1,socket2){
    this.player1 = socket1;
    this.player2 = socket2;
    this.room = room;
    this.turn = socket1;
    this.symbol = 'X';
    this.table = Array(9).fill(' ');
    this.otherPlayer = function(socket){
        if(socket == this.player1)return "player2";
        else return "player1";
    }
    this.otherSocket = function(socket){
        if(socket == this.player1)return this.player2;
        else return this.player1;
    }
    this.play = function(socket,position){
        if(socket != this.turn ){
            socket.emit("error", "Wait for your turn");
            return;
        }
        if(this.table[position]!= ' '){
            socket.emit("error", "Chose an empty cell");
            return;
        }

        this.table[position] = this.symbol;
        const gameEnd = this.endGame(); 
        if(gameEnd === 'tie'){
            return room.emit("tie");
        }
        else if(gameEnd){
            socket.emit("win",this.endGame(),this.table);
            this.otherSocket(socket).emit("lose",this.endGame(),this.table);
            return;
        }
        this.changeSymbol();
        this.turn = this.otherSocket(socket)
        room.emit("turn", this.otherPlayer(socket),this.table);
    }
    this.endGame=function(){
        const table = this.table;
        for(let i = 0; i<3;i++)
            if(table[i*3+0] == table[i*3+1] && table[i*3+1] == table[i*3+2] && table[i*3+0]!=' ')
                return [i*3+0,i*3+1,i*3+2];
        for(let i = 0; i<3;i++)
            if(table[0+i] == table[3+i] && table[3+i] == table[6+i]&& table[0+i]!=' ')
                return [0+i,3+i,6+i];
        if(table[0]==table[4] && table[4] == table[8]&& table[0]!=' ')return [0,4,8];
        if(table[2]==table[4] && table[4] == table[6]&& table[2]!=' ')return [2,4,6];
        if(table.every(cell=>cell!=' '))return 'tie';
        return false;
    }
    this.changeSymbol=()=>{
        if(this.symbol=='O')this.symbol='X';
        else this.symbol = 'O';
    }
    setTimeout(()=>room.emit("turn", "player1",this.table),5000);
    socket1.ON("play",(position)=>this.play(socket1,position));
    socket2.ON("play",(position)=>this.play(socket2,position));
    

} 


function renderPage(req,res){
    lobbies.getRoomInfo(req)
    .then(data=>{
        if(!data){
            res.redirect("/");
            return;
        }
        const result = {};
        data.rows.forEach((player,index)=>{
            result["player"+(index+1)] = player.username;
            if(player.avatar)
            result["avatar"+(index+1)] = player.avatar;
        })

        const reader = fs.createReadStream(path.join("public","html","games","TTT.html"))
        reader.pipe(pages.replaceInStream(result)).pipe(res);
    })
}

router.get("/:code",(req,res)=>{
    renderPage(req,res)
})

function startGame(socket,io,code){
    lobbies.getRoomInfo({params:{code}})
    .then(data=>{
        const socketids = data.rows.map(user=>redis.get("sid-socketid:"+ user.sessionid))
        Promise.all(socketids)
        .then(socketids=>{
            const sockets = socketids.map(socketid=>io.sockets.sockets.get(socketid));
            const game = new TTT(io.in(code),...sockets)
        })
    })

}


module.exports = {
    router,
    startGame
}