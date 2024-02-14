socket.on("GameStarted",(data)=>{
    fetch(`/tic-tac-toe/${data.code}`)
    .then(data=>{
        if(data.ok){
            return data.text();
        }
    })
    .then(data=>{
        document.body.innerHTML=data;
        startCountdown();
        const clockLabel = document.querySelector("label.clock");
        startClock(clockLabel,63,60); 
        addFormListeners();
    })// document.querySelector("div.playersCont").innerHTML = data.players;
})

function addFormListeners(){
    const submitForm = document.querySelector("form.submitForm")
    const submitInput = document.querySelector("form.submitForm>input")
    submitForm.addEventListener("submit", (event)=>{
        event.preventDefault();
        if(submitInput.validity.valid){
            socket.emit("submit number",input.value);
        }
        else;//message
    })
}

