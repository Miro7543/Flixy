const { Transform } = require('stream');
const path=require("path");
const fs=require("fs");
const htmlFolder=path.join(__dirname,"../", "public","html");
const htmlFiles=fs.readdirSync(path.join(htmlFolder,"static"));

const DefExp=new RegExp(/\$.+\$/,"g")
function replaceInChunk(s, map){
    Object.keys(map).forEach(key=>{
        const Exp=new RegExp(`\\$${key}\\$`,"g");
        s=s.replaceAll(Exp, map[key]);
    })
    if(DefExp.test(s)){
        s=s.replaceAll(DefExp,"");
    }
    return s;
}

module.exports={
    staticHTMLS:function(req, res, next){
        if(req.method=="GET"){
            const searchedFile=htmlFiles.find(file=>"/"+file===req.url+".html");
            if( searchedFile ){
                res.sendFile(path.join(htmlFolder,"static",searchedFile));
            }
            else next();
        }
        else next();
    },
    replaceInStream:function (map){
        const transform=new Transform({
            transform(chunk,encoding,cb){
                if(!chunk)cb(null,replaceInChunk(this.buffer ? this.buffer : "", map));
                
                let chunkString=chunk.toString();
                
                if(this.buffer==undefined)this.buffer='';
                this.buffer+=chunkString;
                
                if(this.buffer.includes("\n")){
                    let lines = this.buffer.split("\n");
                    this.buffer=lines.pop();
                    let result="";
                    lines.forEach(line=>result+=replaceInChunk(line, map));
                    cb(null,result);
                }
            },
            encoding:"utf8"
        })
        return transform;
    }
} 