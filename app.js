const express = require("express")
const app = express();
const db= require("./db.js");
require("dotenv").config()

app.get("/",(req,res)=>{
    res.send("Hello world!");
})

app.listen(process.env.PORT,()=>{
    console.log(`server running on ${process.env.PORT}`)
});