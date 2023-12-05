const pg=require("pg");
require("dotenv").config();

const pool=new pg.Pool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST,
    database:process.env.DB_DATABASE,
    password:process.env.DB_PASSWORD
})

pool.on("connect",()=>{
    console.log("\x1b[34mConnected to database\x1b[37m");
})

pool.on("error",(err)=>{
    console.log(err);
})

pool.connect();