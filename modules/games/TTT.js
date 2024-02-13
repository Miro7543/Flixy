const router = require("express").Router();
const db = require("../db");
const pages = require("../pages");
const fs = require("fs");
const path = require("path");

function getRoomInfo(req,res){
    const code = req.params.code;
    return db.query("Select * from lobby_players where code = $1 order by datecreated",[code])
    .then(data=>{
        if(!data){
            return; 
        }
        else{
            const result = {};
            data.rows.forEach((player,index)=>{
                result["player"+(index+1)] = player.username;
            })
            return result;
        }
    })
}

function renderPage(req,res){
    getRoomInfo(req,res)
    .then(data=>{
        if(!data){
            res.redirect("/");
        }
        console.log(data)
        const reader = fs.createReadStream(path.join("public","html","games","TTT.html"))
        reader.pipe(pages.replaceInStream(data)).pipe(res);
    })
}

router.get("/:code",(req,res)=>{
    // console.log(req.params)
    
    renderPage(req,res)

})



function attachSockets(socket,io,code){
    socket.
    socket.on("play",data=>{

    })
    socket.on("disconnect",()=>{

    })
}

module.exports = {
    attachSockets,
    router
}