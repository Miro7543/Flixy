const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { createReadStream } = require("fs");
const pages=require("./pages");
const db=require("./db");
const redis=require("./redis");
const crypto=require("crypto");
const sockets = require("./sockets");

const numberExp=new RegExp(/[0-9]/,"g")
const letterExp=new RegExp(/[a-z]/,"g")
const capLetterExp=new RegExp(/[A-Z]/,"g")
const specialSymbolExp=new RegExp(/[-\.\_\>\<\?\+\*\/\#\@\!\&\\]/,"g");
const sessionAge=0.3;

function generateCode(length) {
    const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
    const pin = randomBytes.toString('hex').slice(0, length);
    return pin;
}
function hashString(pass,salt){
    const hash=crypto.createHmac("sha256",salt);
    hash.update(pass)
    return hash.digest('hex');
}

function validatePassword(pass, passConf){
    if(pass !== passConf)return {valid:false,reason:"Passwords must match"};
    // if(!numberExp.test(pass))return {valid:false,reason:"Password must contain a number"};
    // if(!letterExp.test(pass))return {valid:false,reason:"Password must contain a lowercase letter"};
    // if(!capLetterExp.test(pass))return {valid:false,reason:"Password must contain an uppercase letter"};
    // if(pass.length<8)return {valid:false,reason:"Password must be at least 8 characters long"};
    return {valid:true, reason:null};
}

function validateLoginInfo(loginInfo){
    return new Promise((resolve,reject)=>{
        db.query("Select salt from users where username=$1", [loginInfo.username])
        .then(data=>{
            if(data.rowCount===1)
                return db.query("Select * from users where username=$1 and password=$2",[
                    loginInfo.username,
                    hashString(loginInfo.password, data.rows[0].salt)
                ])
                
            else{
                reject(`No user found with username ${loginInfo.username}`, null)
                throw new Error("The user was not found!")
            }
        })
        .then(data=>{
            if(data.rowCount===1){
                resolve(data.rows[0])
            }
            else reject("Wrong password") 
        })
        .catch(err=>reject(err))//Invalid username
    })
}

function removePreviosSessions(username){
    return db.query("Select sessionid from users where username = $1", [username])
    .then(data=>{
        if(!data.rowCount)return;
        return sockets.logoutLastInstance(data.rows[0].sessionid);
    })
}

function startSession(user, res){
    return db.query("Update users set lastlogin=current_timestamp, sessionid=md5(random()::text)  where id=$1 returning sessionid,username;",[user.id])
    .then((data)=>{
        const payload={
            sessionid : data?.rows[0]?.sessionid,
            username : data?.rows[0]?.username
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET,{expiresIn: `${sessionAge}m`}); 
        res.cookie("token", token, { maxAge:60*1000*sessionAge});
        return data.rows[0].sessionid;
    })
    .then((sessionid)=>{
        return redis.setex("sid-id:" + sessionid, 60*sessionAge, `${user.id}`);
    })
}

function endSession(req, res, cb){
    res.cookie("token", null, { maxAge:0});
    redis.del("sid-id:" + req?.user?.sessionid, req?.user?.id)
    res.redirect('/');
}

router.post("/login",(req,res)=>{
    validateLoginInfo(req.body)
    .then(user=>{
        removePreviosSessions(req.body.username)
        .then(()=>{
            return startSession(user,res)
        })
        .then(()=>res.redirect("/"));

    })
    .catch(err=>{
            console.error(err);
            res.redirect("/login");
            //Message

    });
})

router.post("/register",(req,res)=>{//username, email, password1, password2
    let passwordValidation=validatePassword(req.body.password1, req.body.password2);
    if(!passwordValidation.valid){
        res.status(400).send(passwordValidation.reason);
        return;
    }

    const { password1,password2, ...user} = req.body;
    db.query("Select Count(*) from users where email=$1 or username = $2",[user.email,user.username])
    .then((data)=>{
        if(+data.rows[0].count){
            res.status(400).send("There already exists a user with this email or username")
            throw new Error("Email or username already exists");
        }
        else{
            user.salt = generateCode(20);
            user.password = hashString(password1, user.salt);        
            return db.query("Insert into users(username, password, salt, email, expirationdate) values ($1, $2, $3, $4,CURRENT_TIMESTAMP + INTERVAL '30 minutes');",[
                user.username,
                user.password,
                user.salt,
                user.email
            ])
            .catch(err=>console.error("Error when creating a user"))
        } 
    })
    .catch((err)=>{})
    .then(()=>res.redirect('/'))//message    
})

router.get("/logout",(req,res)=>{
    endSession(req,res);
})

router.get("/profile",(req,res)=>{
    const reader=createReadStream("./public/html/profile.html");
    db.query("Select * from users where sessionid = $1",[req.user.sessionid])
    .then(data=>{
        if(!data.rowCount){
            //Message - profile not found
            res.redirect("/");
        }
        else {
            reader.pipe(pages.replaceInStream(data.rows[0])).pipe(res);
        }
    })
})



module.exports={
    router
};