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
    // authentication:function(req,res,next){
    //     const token=req.cookies.token;
    //     if(token){
    //         db.query("Select id, userid, token, expirationdate at time zone 'UTC' as expirationdate from sessions where token=$1",[token])
    //         .catch(()=>console.error("Error when fetching token"))
    //         .then(data=>{
    //             const UTCString=(new Date()).toUTCString();
    //             const UTCnow=new Date(UTCString);
    //             const token = data?.rows[0]?.token;
    //             if(data.rowCount && UTCnow<=data.rows[0].expirationdate){
                    
    //                 db.query("Select * from users where id=$1",[data.rows[0].userid])
    //                 .catch(()=>console.error("Error when fetching user"))
    //                 .then(data=>{
    //                     if(data.rowCount){
    //                         req.user=data.rows[0];
    //                         req.user.token=token;
    //                     }
    //                     next();
    //                 })
    //             }
    //             else next();
    //         })
    //     }
    //     else next();
    // },
    checkSessionRequirement:function(req,res,next){
        const needsSession= requiredFields?.[req.method]?.[req.url.slice(1)]?.needsSession;
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