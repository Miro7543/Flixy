const jwt = require("jsonwebtoken");
const redis = require("./redis");

const refreshTreshold = 0.5;
const refreshedAge = 1;


function isAboutToExpire(exp){
    const timeRemaining = exp * 1000 - Date.now();
    return timeRemaining < refreshTreshold * 60 * 1000 && timeRemaining > 0;
}

function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET,{expiresIn: `${refreshedAge}m`})
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
            res.cookie("token",newToken,{ maxAge:60*1000*refreshedAge})
            redis.expire("sid-id:" + user.sessionid,60*refreshedAge);
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
                console.log("expiring");
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
            res.cookie("token",req.body.token);
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
                console.log("ID not found" );
                //Server error
            }
        })
    },
    // saveSocket: (req, res, next) => {
        // if (!req.user) return next();
    // },
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
