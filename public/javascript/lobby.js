function startCountdown(){
    let div = document.createElement("div");
    div.classList.add("overlay")
    let label = document.createElement("label");
    label.classList.add("countdown");
    
    div.appendChild(label);
    document.body.appendChild(div);
    countdown(div,label,3);
}


function countdown(div,label,count){
    label.innerHTML = count;
    label.classList.add("big");
    if(count==0){    
        label.innerHTML = "GO!";
    }
    if(count<0){    
        document.body.removeChild(div);
        return;
    }
    if(count>0){
        setTimeout(()=>{
            label.classList.remove("big");
            
        },500)
    }

    setTimeout(()=>{
        countdown(div,label,count-1);
    },1000)
}

function timeToString(time){
    return `${Math.floor(time/60) < 10 ? "0" : "" }${Math.floor(time/60)}:${time%60 < 10 ? "0" : "" }${time%60}`
}

function startClock(clock,time,maxTime){
    clock.innerHTML = timeToString(Math.min(time,maxTime));
    if(time==0)    
        return;
    setTimeout(()=>{
        startClock(clock,time-1,maxTime);
    },1000)   

}

const messageInput = document.querySelector("div.messageForm>input");
function sendMessage(){
    if(messageInput.value=='')return;
    socket.emit("message",messageInput.value);
    messageInput.value = '';
    messageInput.focus();
}

document.addEventListener("keydown",(ev)=>{
    if(ev.keyCode==13 && document.activeElement == messageInput){
        sendMessage();
    }
})

socket.on("playerJoined",(data)=>{
    document.querySelector("div.playersCont").innerHTML = data.players;
})

socket.on("playerLeft",(data)=>{
    document.querySelector("div.playersCont").innerHTML = data.players;
})

socket.on("newMessage",(message,username,self)=>{
    const messageHTML = `
    <div class = "messageCont ${self ? "self" : ""}">
        <label class = "sender">${username}</label>
        <label class = "message">${message}</label>
    </div>
    `
    document.querySelector("div.messagesCont").innerHTML += messageHTML;
})

socket.on("get-script",({url})=>{
    if(!document.querySelector(`script[src = "../${url}"]`)){
        const script = document.createElement("script");
        script.src = "../"+url;
        script.defer = true;
        document.body.appendChild(script);
    }
})


function displayOverlay(text,message=null,expiration = 6,size = null){
    const div = document.createElement("div")
    div.classList.add("overlay");
    
    const label = document.createElement("label")
    label.innerHTML = text;
    if(size)
        label.classList.add(size);
    div.appendChild(label)

    if(message){
        const message = document.createElement("label")
        message.innerHTML = message;
        message.classList.add("subtitle");
        div.appendChild(message)
    }

    
    document.body.appendChild(div);
    setTimeout(()=>{
        document.body.removeChild(div);
    },expiration*1000);
}