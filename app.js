const express = require("express")
const app = express();
const db= require("./db.js");
const path=require("path");
const fs=require("fs");
const pages=require("./pages.js");

require("dotenv").config()

const htmlFolder=path.join(__dirname, "public","html");
const htmlFiles=fs.readdirSync(path.join(htmlFolder,"static"));
console.log(htmlFiles)

// app.use(staticHTMLS)
app.use(pages.staticHTMLS)
app.use(express.static(path.join(__dirname, "public", "css")))
app.use(express.static(path.join(__dirname, "public", "javascript")))
app.use(express.urlencoded({extended:true}))
app.use("/login",require("./login.js"));


app.get("/",(req,res)=>{
    res.sendFile(path.join(htmlFolder,"index.html"));
    
})

app.listen(process.env.PORT,()=>{
    console.log(`\x1b[34mserver running on ${process.env.PORT}\x1b[37m`)
});