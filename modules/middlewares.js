const requiredFields=require("../requiredFields.json");
const db=require("./db")
const sockets=require("./sockets")


module.exports={
    validateFields:function (req, res, next){
        let fieldsForReq = requiredFields?.[req.method]?.[req.url.slice(1)]?.fields;
        if(fieldsForReq === undefined)return next();

        if(!fieldsForReq.every(field => req.body[field]!==undefined)){
            res.status(500);
            sockets.notification("Server error",req.body.socketid,true);
            
        }
        else next();
    },
    checkSessionRequirement:function(req,res,next){
        const urlRequirements = Object.keys(requiredFields?.[req.method]).find(url=>req.url.startsWith(url))

        const needsSession= requiredFields?.[req.method]?.[urlRequirements]?.needsSession;
        if(needsSession !== undefined){
            const hasSession = req.user !== undefined;
            if( hasSession !== needsSession){
                if(hasSession){
                    res.redirect("/"); 
                }
                else{
                    sockets.notifyLater("You have to be logged in to continue",req?.body?.socketid, true,()=>{
                        res.redirect("/login");
                    });
                }
            }
            else {
                next();
            }
        }
        else{
            next();
        } 
    }
}