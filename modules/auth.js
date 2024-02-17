const jwt = require("jsonwebtoken");
const redis = require("./redis");
const settings = require("../settings.json");
const db = require("./db");

function isAboutToExpire(exp){
    const timeRemaining = exp * 1000 - Date.now();
    return timeRemaining < settings.refreshSessionThreshold * 60 * 1000 && timeRemaining > 0;
}

function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET,{expiresIn: `${settings.sessionTime}m`})
}

function refreshToken(payload){
    const {exp,iat,...info}=payload;
    const newToken = generateToken(info);  
    return newToken;

}

module.exports = {
    authenticate: function (req, res, next){
        const token = req.cookies.token;
        if (!token) return next();
        
        const user = module.exports.isValid(token);
        if (!user)next();
    
        const { exp } = user;
        if(isAboutToExpire(exp)){
            const newToken=refreshToken(user);
            res.cookie("token",newToken,{ maxAge:60*1000*settings.sessionTime})
            redis.expire("sid-id:" + user.sessionid,60*settings.sessionTime);
        }
        req.user = user;
        
        module.exports.addIdToUser(req.user)
        .then(()=>{next()})
    },
    authenticateSocket:function(token,socket){
        if (!token) return false;
        const user = module.exports.isValid(token);
        if (user) {
            const { exp } = user;
            if(isAboutToExpire(exp)){
                user.newToken=refreshToken(user);
            }
            return user;
        }
        else return false;
    },
    needsRefresh:function(user){
        if(!user) return false;
        const { exp } = user;
        if(isAboutToExpire(exp)){
            user.newToken=refreshToken(user);
            return user;
        }
        else return false;
    },
    getData:function(token){
        if (!token) return new Promise((res,rej)=>res(false));
        let data = module.exports.isValid(token);
        return this.addIdToUser(data)
        .then(()=>{return data});
    },
    setToken:function(req,res){
        if(module.exports.isValid(req.body.token)){
            res.cookie("token",req.body.token,{maxAge:settings.sessionTime*60*1000});
        }
        else res.end();
    },
    addIdToUser:function(user){
        //caching of id-sid
        return redis.get("sid-id:" + user.sessionid)
        .then(data=>{
            if(data){
                user.id = data;
            }
            else{
                db.query("Select id from users where sessionid = $1 ",[user.sessionid])
                .then(data=>{
                    if(data.rowCount)
                        user.id=data.rows[0].id;
                    else console.log("ID not found" );
                })
                
                //Server error
            }
        })
    },
    isValid: function(token) {
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            return user;
        } 
        catch (err) {
            return false;
        }
    }

};
