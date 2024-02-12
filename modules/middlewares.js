const requiredFields=require("../requiredFields.json");
const db=require("./db")


module.exports={
    validateFields:function (req, res, next){
        let fieldsForReq = requiredFields?.[req.method]?.[req.url.slice(1)]?.fields;
        if(fieldsForReq === undefined)return next();

        if(!fieldsForReq.every(field => req.body[field]!==undefined)){
            res.status(500).redirect(req.url);
            //message
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
                    //message (Has session but needs to be logged out)
                }
                else{
                    res.redirect("/login");
                    //message (Doesn't have session but needs to be logged in)
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