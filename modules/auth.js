const jwt = require("jsonwebtoken");
module.exports = {
    authenticate:(req, res, next)=>{
        const token = req.cookies.token;
        if(!token)return next();
        const user = jwt.verify(token, process.env.JWT_SECRET); 
        req.user=user;
        next();
    },
    saveSocket:(req,res,next)=>{
        if(!req.user)return next();
    }

}