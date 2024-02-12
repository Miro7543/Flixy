const redis = require("redis")
const redisClient = redis.createClient();
redisClient.connect().then(data=>{console.log("\x1b[34mRedis connected\x1b[37m")});

module.exports={
    get:function(key){
        return redisClient.get(key)
        .catch(err=>console.error("Redis error(get): " + err))
    },
    set:function(key,val){
        return redisClient.set(key,val)
        .catch(err=>console.error("Redis error(set): " + err))
    },
    setex:function(key,time,val){
        return redisClient.setEx(key,time,val)
        .catch(err=>console.error("Redis error(setex): " + err))
    },
    del:function(key){
        return redisClient.del(key)
        .catch(err=>console.error("Redis error(del): " + err))
    },
    expire:function(key,time){
        return redisClient.expire(key,time)
        .catch(err=>console.error("Redis error(expire): " + err))
    },
}
