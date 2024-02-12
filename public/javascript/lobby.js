
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
