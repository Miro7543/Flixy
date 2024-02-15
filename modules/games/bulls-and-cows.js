const router = require("express").Router();
const db = require("../db");
const redis = require("../redis");
const pages = require("../pages");
const fs = require("fs");
const path = require("path");
const lobbies = require("../games")

const guessesHTML=`<div class="guessesCont">
<label class="title">Guesses</label>
<div class="guesses self"></div>
<form class="guessForm">
    <input type="text" pattern="^(?!.*(.).*\\1)\\d{4}$" title="Please enter a 4 digit number with different digits." maxlength="4" placeholder="Enter your guess">
    <button type="submit">Guess</button>
</form>
</div>
<div class="guessesCont">
<label class="title">Oponent's guesses</label>
<div class="guesses opponent"></div>
<form class="guessForm">
<label>Your number: $number$</label>    
</form>
</div>`

function BaC(room,socket1,socket2){
    this.room = room;
    this.socket1 = socket1;
    this.socket2 = socket2;
    this.turn = socket1;
    this.number1=null;
    this.number2=null;
    this.started=false;
    this.lastChance = false;
    this.otherPlayer = function(socket){
        if(socket.id == this.socket1.id)return "player2";
        else return "player1";
    };
    this.otherSocket = function(socket){
        if(socket.id == this.socket1.id)return this.socket2;
        else return this.socket1;
    };
    this.opponentNumber=function(socket){
        if(this.socket1.id == socket.id)return this.number2;
        else return this.number1;
    }
    this.getBaC = function(number,opNum){
        const numDigits = Array.from(String(number),Number);
        const opNumDigits = Array.from(String(opNum),Number);
        const bulls = numDigits.filter((digit,index)=>digit === opNumDigits[index]).length;
        
        const set = new Set(String(number) + String(opNum));
        const cows = (8 - set.size) - bulls; 
        return {number,cows,bulls};
    }
    this.guess = function(socket,number){
        console.log(socket.id, this.socket1.id, this.turn.id);
        if(socket.id != this.turn.id)
            return socket.emit("error","Wait for your turn");
        if(!this.validateNumber(number))
            return socket.emit("error","Invalid number. Enter a 4 digit number with different digits.");
        if(!this.started)
            return socket.emit("error","The game hasn't started yet.");
        
        const opNum = this.opponentNumber(socket);
        const bac = this.getBaC(number,opNum);
        socket.emit("info", bac)
        this.otherSocket(socket).emit("infoOponent", bac)
        this.room.emit("turn",this.otherPlayer(socket));
        this.turn = this.otherSocket(socket);
        if(bac.bulls == 4){
            if(this.lastChance){
                return room.emit("tie");
            }
            if(socket==this.socket1){
                this.lastChance=true;
                socket.emit("lastChance",false);
                this.otherSocket(socket).emit("lastChance",true);
                return;
            }
            else{
                socket.emit("win");
                this.otherSocket(socket).emit("lose");
            }
        }
        if(this.lastChance){
            socket.emit("lose");
            this.otherSocket(socket).emit("win");
        }

    }
    this.submit = function(socket, number,cb){
        if(!this.validateNumber(number)){
            socket.emit("error","Invalid number. Enter a 4 digit number with different digits.");
        }
        cb();
        if(socket.id == this.socket1.id)this.number1=number;
        if(socket.id == this.socket2.id)this.number2=number;
        if(this.number1 && this.number2){
            this.startGame();
        }
    }
    this.startGame = function(){
        this.started=true;
        this.socket1.emit("startGuessing",guessesHTML.replace("$number$",this.number1),"player1");
        this.socket2.emit("startGuessing",guessesHTML.replace("$number$",this.number2),"player1");
        this.turn = this.socket1;
    }


    this.validateNumber=function(number){
        return (new Set(String(number)).size === String(number).length) && (String(number).length==4);
    }

    socket1.ON("submit-number",(number,cb)=>this.submit(socket1,number,cb))
    socket2.ON("submit-number",(number,cb)=>this.submit(socket2,number,cb))
    socket1.ON("guess-number",(number)=>this.guess(socket1,number))
    socket2.ON("guess-number",(number)=>this.guess(socket2,number))

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
        })
        const reader = fs.createReadStream(path.join("public","html","games","BaC.html"))
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
            console.log(socketids)
            const sockets = socketids.map(socketid=>io.sockets.sockets.get(socketid));
            const game = new BaC(io.in(code),...sockets);
        })
    })

}

module.exports={
    router,
    startGame
}