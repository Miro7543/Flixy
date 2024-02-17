const socket = io();

window.onload=()=>{
    socket.connect();
}

socket.on("set-token",(data)=>{
    fetch("/settoken",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify(data)
    });
})

socket.on("redirect",({url})=>{
    window.location.href = url;
})

socket.on("logout",()=>{
    window.location.href="/logout";
})

socket.on("notification",({text})=>{
    ShowMessage(text);
})

socket.on("error",({text})=>{
    ShowError(text);
})

socket.on("notifyLater",(text,error,cb)=>{
    sessionStorage.setItem(error?"error":"message",text);
    cb();
})
