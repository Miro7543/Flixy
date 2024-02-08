const express = require("express")
const app = express();
const { createServer } = require('node:http');
const server = createServer(app);
    
const fs=require("fs");
const path=require("path");
const db= require("./db");
const pages=require("./pages.js");
const middlewares=require("./middlewares.js");
const accountsRouter=require("./accounts.js");
const cookieParser = require('cookie-parser');
const io= require("./sockets.js")(server);
io.on("connection",(socket)=>{
    io.fetchSockets().then(data=>{console.log(data.map(s=>s.handshake.auth))})
    // console.log(.sockets.entries());
    // console.log(socket.handshake.auth)
})
require("dotenv").config()

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public", "css"))) 
app.use(express.static(path.join(__dirname, "public", "icons"))) 
app.use(express.static(path.join(__dirname, "public", "javascript")))
// app.use(express.static(path.join(__dirname, "public", "html", "static")))

app.use(express.urlencoded({extended:true}))
app.use(middlewares.validateFields);//Check if there are enough fields in the body
app.use(middlewares.authentication);
app.use(middlewares.checkSessionRequirement);

app.use(pages.staticHTMLS)//Return static htmls (login, register ...)


app.use(accountsRouter.router);


app.get("/",(req,res)=>{
    let header=`
    <a href="/login">
    Login
    </a>
    <a href="/register">
    Register
    </a>`;
    if(req.user !== undefined){
        header=`
        <a href="/profile">
            Hello ${req.user.username}!
        </a>
        <a href="/logout">
            <img src="logout.svg" class="logoutIcon"></svg>
        </a>
    `
    }
    const readStream=new fs.createReadStream(path.join(__dirname,"public", "html", "index.html"),{encoding:"utf8"});
    const transformer=pages.replaceInStream({header});
    readStream.pipe(transformer).pipe(res);
})

server.listen(process.env.PORT,()=>{
    console.log(`\x1b[34mserver running on ${process.env.PORT}\x1b[37m`)
});

module.exports = app;