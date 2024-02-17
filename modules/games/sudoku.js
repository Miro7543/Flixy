const router = require("express").Router();
const redis = require("../redis");
const pages = require("../pages");
const fs = require("fs");
const path = require("path");
const lobbies = require("../games")
const sudokuGen = require("sudoku-core");

function Sudoku(room,...sockets){
    this.difficulties ={
        "easy":0,
        "medium":0,
        "hard":0,
        "expert":0
    }
    this.players = sockets;
    this.voted = Array(sockets.length).fill(false);
    this.correct = Array(sockets.length).fill(0);
    this.boards = [];
    this.cellsToSolve=null;
    this.room = room;
    this.difficulty = null;
    this.startGame=function(){
        this.setDifficulty();
        this.generateGame();
        this.cellsToSolve=this.board.filter(x=>x==null).length;
        room.emit("startGame",this.board,this.difficulty);
    }
    this.setDifficulty = function(){
        let max=0,maxDifficulty="easy";
        for(let key in this.difficulties){
            if(this.difficulties[key]>=max){
                max=this.difficulties[key];
                maxDifficulty=key;
            }
        }
        this.difficulty=maxDifficulty;
    }
    this.generateGame = function(){
        this.board = sudokuGen.generate(this.difficulty);
        this.solvedBoard = sudokuGen.solve(this.board).board;
        for(let i = 0;i<this.players.length;i++)
            this.boards.push(Array(...this.board))
    }
    this.otherPlayers=function(player){return this.players.filter(p=>p.id!=player.id)}
    this.guess = function(player,playerIndex,position,number){
        if(!this.board[position] && this.solvedBoard[position] == number ){
            if(!this.boards[playerIndex][position]){
                this.boards[playerIndex][position]=number;
                this.correct[playerIndex]++;
                room.emit("data",this.correct.map((c,index)=>{return {player:`player${index+1}`,solved:c, left:this.cellsToSolve-c,percent:Math.floor(c*100/this.cellsToSolve)}}))
                if(this.boards[playerIndex].every(x=>x!=null)){
                    player.emit("win");
                    this.otherPlayers(player).forEach(p=>p.emit("lose"));
                }
                return true;
            }
        }
        return false;
    }
    console.log(this.players)
    this.players.forEach((player,index)=>{
        player.ON("guess", (position,number,cb)=>{
            const result = this.guess(player,index,position,number);
            cb(result);
        })
        player.ON("vote",(difficulty,cb)=>{
            if(!Object.keys(this.difficulties).includes(difficulty)){
                return player.emit("error","Invalid difficulty");
            }
            this.difficulties[difficulty]++;
            this.voted[index] = true;
            cb();
            if(this.voted.every(x=>x)){
                this.startGame();
            }
        })
   })

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
            result["player"+(index+1)] = `
            <div class="player player${index+1}">
            <img src="" alt="">
            <label >${player.username}</label>
            <label class="left">Left:</label>
            <label class="solved">Solved: 0</label>
            <label class="percent">Percentage: 0%</label>
            </div>
            `;
        })

        const reader = fs.createReadStream(path.join("public","html","games","sudoku.html"))
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
            const game = new Sudoku(io.in(code),...sockets)
        })
    })

}


module.exports = {
    router,
    startGame
}