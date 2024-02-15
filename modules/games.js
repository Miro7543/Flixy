const db = require("./db");
function getRoomInfo(req){
    const code = req.params.code;
    return db.query("Select * from lobby_players where code = $1 order by datecreated",[code])
    .then(data=>{
        if(data.rowCount){
            return data;
        }
        return; 
    })
}
module.exports= {
    getRoomInfo
}