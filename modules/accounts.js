const router = require("express").Router();
const jwt = require("jsonwebtoken");
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


function startSession(user, res){
    return db.query("Update users set lastlogin=current_timestamp, token=md5(random()::text)  where id=$1 returning token,username;",[user.id])
    .then((data)=>{
        const payload={
            // id : user.id,
            sessionid : data.rows[0].token,
            username : data.rows[0].username
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET,{expiresIn: '1m'}); 
        res.cookie("token", token, { maxAge:60*1000});
        return;
    })
}

function endSession(req, res, cb){
    // db.query("Update sessions set expirationdate=current_timestamp where token = $1",[req?.user?.token])
    // .then(data=>{
        res.cookie("token", null, { maxAge:0});
        res.redirect('/');
    // })
}

router.post("/login",(req,res)=>{
    validateLoginInfo(req.body)
    .then(user=>{
        startSession(user,res)
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
    .then(()=>res.status(200).redirect('/'))//message    
})

router.get("/logout",(req,res)=>{
    endSession(req,res)
})

router.get("/profile",(req,res)=>{
    const reader=createReadStream("./public/html/profile.html");
    db.query("Select * from users where token = $1",[req.user.sessionid])
    .then(data=>{
        if(!data.rowCount){
            //Message - profile not found
            res.redirect("/");
        }
        else {
            console.log(data.rows[0])
            reader.pipe(pages.replaceInStream(data.rows[0])).pipe(res);
        }
    })
})


module.exports={
    router
};