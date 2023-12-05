const pg=require("pg");
require("dotenv").config();

const pool=new pg.Pool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST,
    database:process.env.DB_DATABASE,
    password:process.env.DB_PASSWORD
})

pool.on("connect",()=>{
    console.log("Connected to database");
})

pool.on("error",(err)=>{
    console.log(err);
})

pool.connect();