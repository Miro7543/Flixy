const express = require("express")
const bodyparser = require("body-parser")
const app = express();
const { createServer } = require('node:http');
const server = createServer(app);
    
const fs=require("fs");
const path=require("path");

const pages=require("./modules/pages.js");
const middlewares=require("./modules/middlewares.js");
const accountsRouter=require("./modules/accounts.js");
const cookieParser = require('cookie-parser');
const sockets = require("./modules/sockets.js");
const auth = require("./modules/auth.js");
const lobbiesRouter=require("./modules/lobbies.js").router;
const tttRouter=require("./modules/games/TTT.js").router;
const sudokuRouter=require("./modules/games/sudoku.js").router;
const bacRouter=require("./modules/games/bulls-and-cows.js").router;

sockets.init(server);
require("dotenv").config();

app.use((req,res,next)=>{
    next()
})

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public", "css"))) 
app.use(express.static(path.join(__dirname, "public", "icons"))) 
app.use(express.static(path.join(__dirname, "public", "javascript")))
app.use(express.static(path.join(__dirname, "public", "images")))
app.use(express.static(path.join(__dirname, "public", "html", "games")))

app.use(express.urlencoded({extended:true}))
app.use(auth.authenticate);//Deals with sessions, tokens, etc. 
app.use(middlewares.checkSessionRequirement);//Checks if the user passes the session requirements
app.use(middlewares.validateFields);//Check if there are enough fields in the body

app.use(pages.staticHTMLS)//Return static htmls (login, register ...)


app.use(accountsRouter.router);
app.use("/lobby",lobbiesRouter)
app.use("/tic-tac-toe",tttRouter)
app.use("/sudoku",sudokuRouter)
app.use("/bulls-and-cows",bacRouter);


app.get("/",(req,res)=>{//return landing page
    let header=`
    <a href="/login">
    Login
    </a>
    <a href="/register">
    Register
    </a>`;
    if(req.user !== undefined){
        header=`
        <h1 class="greeting">
            Hello ${req.user.username}!
        </h1>
        <a href="/logout">
            <img src="logout.svg" class="logoutIcon"></svg>
        </a>
        `
    }
    const readStream=new fs.createReadStream(path.join(__dirname,"public", "html", "index.html"),{encoding:"utf8"});
    const transformer=pages.replaceInStream({header});
    readStream.pipe(transformer).pipe(res);
})

app.post("/settoken",auth.setToken)//Update token request is made from socket 

server.listen(process.env.PORT,()=>{
    console.log(`\x1b[34mServer running on ${process.env.PORT}\x1b[37m`)
});

module.exports = app;
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1); 
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });