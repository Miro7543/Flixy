const router = require("express").Router();
const { createReadStream } = require("fs");
const pages=require("./pages");
const db=require("./db");
const crypto=require("crypto");

const numberExp=new RegExp(/[0-9]/,"g")
const letterExp=new RegExp(/[a-z]/,"g")
const capLetterExp=new RegExp(/[A-Z]/,"g")
const specialSymbolExp=new RegExp(/[-\.\_\>\<\?\+\*\/\#\@\!\&\\]/,"g");

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

function validateLoginInfo(loginInfo, cb){
    db.query("Select salt from users where username=$1", [loginInfo.username])
    .then(data=>{
        if(data.rowCount===1)
            db.query("Select * from users where username=$1 and password=$2",[
                loginInfo.username,
                hashString(loginInfo.password, data.rows[0].salt)
            ])
            .catch(err=>console.error("Error when fetching user"))
            .then(data=>{
                if(data.rowCount===1){
                    cb(null,data.rows[0]);
                }
                else cb(`Wrong password`, null);
            })
        else cb(`No user found with username ${loginInfo.username}`, null)
    })
    .catch(err=>console.error("Error when fetching users salt",err))
}


function startSession(user, res, cb){
    db.query("Insert into sessions(userid) values ($1) returning token", [user.id])
    .then(data=>{
        db.query("Update users set lastlogin=current_timestamp where id=$1",[user.id])
        .then(()=>{
            res.cookie("token", data.rows[0].token, { maxAge:3600000});
            cb();
        })
        .catch(err=>console.error("Error when setting lastlogin in users"))
    })
    .catch(err=>console.error("Error when creating a session"));
}

function endSession(req, res, cb){
    db.query("Update sessions set expirationdate=current_timestamp where token = $1",[req?.user?.token])
    .then(data=>{
        res.cookie("token", null, { maxAge:0});
        res.redirect('/');
    })
}

router.post("/login",(req,res)=>{
    validateLoginInfo(req.body,(err, user)=>{
        if(err){
            console.error(err);
            res.redirect("/login");
        }
        else startSession(user,res,()=>{
            res.redirect("/");
        });

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
    .catch(err=>console.error("Error when checking for email uniqueness"))
    .then((data)=>{
        if(+data.rows[0].count){
            res.status(400).send("There already exists a user with this email or username")
            throw new Error("Email or username already exists");
        }
        else{
            user.salt = generateCode(20);
            user.password = hashString(password1, user.salt);        
            return db.query("Insert into users(username, password, salt, email) values ($1, $2, $3, $4);",[
                user.username,
                user.password,
                user.salt,
                user.email
            ])
            .catch(err=>console.error("Error when creating a user"))
        } 
    })
    .catch((err)=>{})
    .then(()=>res.status(200).redirect('/'))//message    
})

router.get("/logout",(req,res)=>{
    endSession(req,res)
})

router.get("/profile",(req,res)=>{
    const reader=createReadStream("./public/html/profile.html");
    console.log(req.user)
    reader.pipe(pages.replaceInStream(req.user)).pipe(res);
})


module.exports={
    router
};