const pg=require("pg");
require("dotenv").config();

const pool=new pg.Pool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST,
    database:process.env.DB_DATABASE,
    password:process.env.DB_PASSWORD
})

const DB={//mock object
    query:function(){
        return Promise.reject("A reason");
    }
}

pool.on("connect",()=>{
    console.log("\x1b[34mConnected to database\x1b[37m");
})

pool.on("error",(err)=>{
    console.error(err);
})

pool.connect();

module.exports={
    query:(query, options)=>{
        return pool.query(query, options)
        .catch(err=>{console.error(err); throw new Error("Server error")});
    }
}