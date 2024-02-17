const router = require("express").Router();
const jwt = require("jsonwebtoken");
// const { createReadStream } = require("fs");
// const pages=require("./pages");
const db=require("./db");
const redis=require("./redis");
const crypto=require("crypto");
const sockets = require("./sockets");
const settings = require("../settings.json")

const numberExp=new RegExp(/.*[0-9].*/)
const letterExp=new RegExp(/.*[a-z].*/)
const capLetterExp=new RegExp(/.*[A-Z].*/)
// const specialSymbolExp=new RegExp(/[-\.\_\>\<\?\+\*\/\#\@\!\&\\]/,"g");

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
    if(!numberExp.test(pass))return {valid:false,reason:"Password must contain a number"};
    if(!letterExp.test(pass))return {valid:false,reason:"Password must contain a lowercase letter"};
    if(!capLetterExp.test(pass))return {valid:false,reason:"Password must contain an uppercase letter"};
    if(pass.length<8)return {valid:false,reason:"Password must be at least 8 characters long"};
    return {valid:true, reason:null};
}

function validateLoginInfo(loginInfo,req,res){
    return new Promise((resolve,reject)=>{
        db.query("Select salt from users where username=$1", [loginInfo.username])
        .then(data=>{
            if(data.rowCount===1)
                return db.query("Select * from users where username=$1 and password=$2",[
                    loginInfo.username,
                    hashString(loginInfo.password, data.rows[0].salt)
                ])
                
            else{
                // reject(`No user found with username ${loginInfo.username}`, null)
                sockets.notification(`No user found with username ${loginInfo.username}`,req?.body?.socketid,true);

            }
        })
        .then(data=>{
            if(data.rowCount===1){
                resolve(data.rows[0])
            }
            else{
                sockets.notification(`Wrong password`,req?.body?.socketid,true);
                throw new Error("");
            } 
        })
        .catch(err=>reject(err))
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
        const token = jwt.sign(payload, process.env.JWT_SECRET,{expiresIn: `${settings.sessionTime}m`}); 
        res.cookie("token", token, { maxAge:60*1000*settings.sessionTime});
        return data.rows[0].sessionid;
    })
    .then((sessionid)=>{
        return redis.setex("sid-id:" + sessionid, 60*settings.sessionTime, `${user.id}`);
    })
}

function endSession(req, res){
    res.cookie("token", null, { maxAge:0});
    redis.del("sid-id:" + req?.user?.sessionid)
    .then((data)=>{
        if(data){
            sockets.notifyLater("You have logged out successfully",data,false,()=>{        
                res.redirect('/');
                res.end();
            });
        }
    })

}

router.post("/login",(req,res)=>{
    validateLoginInfo(req.body,req,res)
    .then(user=>{
        removePreviosSessions(req.body.username)
        .then(()=>{
            return startSession(user,res);
        })
        .then(()=>{
            sockets.notifyLater("You have logged in successfully",req?.body?.socketid,false,()=>{
                res.redirect("/")
            });
            
        });
    })
    .catch(err=>{
        if(err.message !="")
            console.error(err);
        // sockets.notification(err,req?.body?.socketid,true);
    });
})

router.post("/register",(req,res)=>{//username, email, password1, password2
    let passwordValidation=validatePassword(req.body.password1, req.body.password2);
    if(!passwordValidation.valid){
        // res.status(400).send(passwordValidation.reason);
        sockets.notification(passwordValidation.reason,req?.body?.socketid,true);
        return;
    }

    const { password1,password2, ...user} = req.body;
    db.query("Select Count(*) from users where email=$1 or username = $2",[user.email,user.username])
    .catch((err)=>{
        console.error(err);
        sockets.notification("Server error",req?.body?.socketid,true);
    })
    .then((data)=>{
        if(+data.rows[0].count){
            sockets.notification("There already exists a user with this email or username",req?.body?.socketid,true);
            throw new Error("");
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
            .catch(err=>{
                sockets.notification("Server error",req?.body?.socketid,true);
                console.error("Error when creating a user")
            })
        } 
    })
    .then(()=>{
        res.redirect('/')
        sockets.notifyLater("Account was successfully created!",req?.body?.socketid,false);

    },()=>{})//message    
})

router.get("/logout",(req,res)=>{
    endSession(req,res);
})

module.exports={
    router
};