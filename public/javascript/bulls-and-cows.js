socket.on("GameStarted",(data)=>{
    fetch(`/bulls-and-cows/${data.code}`)
    .then(data=>{
        if(data.ok){
            return data.text();
        }
    })
    .then(data=>{
        document.body.innerHTML=data;
        startCountdown();
        addSubmitFormListeners();
    })
})

function removeSubmittionForm(){
    const submitCont = document.querySelector("div.submitionCont")
    const content=document.querySelector("div.content");
    content.removeChild(submitCont);
    content.innerHTML = "Waiting for other player to choose a number"

}

function addSubmitFormListeners(){
    const submitForm = document.querySelector("form.submitForm")
    const submitInput = document.querySelector("form.submitForm>input")
    submitForm.addEventListener("submit", (event)=>{
        event.preventDefault();
        if(submitInput.validity.valid){
            socket.emit("submit-number",submitInput.value,removeSubmittionForm);
        }
        else;//message
    })
}
function addGuessFormListeners(){
        const guessForm = document.querySelector("form.guessForm")
    const guessInput = document.querySelector("form.guessForm>input")
    guessForm.addEventListener("submit", (event)=>{
        event.preventDefault();
        if(guessInput.validity.valid){
            socket.emit("guess-number",guessInput.value);
        }
        else;//message
    })
}

socket.on("startGuessing",(string,turn)=>{
    document.querySelector("div.content").innerHTML=string;
    addGuessFormListeners()
    
    document.querySelectorAll('.onTurn').forEach(el=>el.classList.remove("onTurn"));
    document.querySelector("div."+turn).classList.add("onTurn");
    // .forEach(div=>div.style.display="flex")
})

function addGuess(bac, whose){
    const guess = `
    <div class="guess">
        <label class="number">${bac.number}</label>
        <label> ${bac.cows}<img src="cow.png"></label>
        <label> ${bac.bulls}<img src="bull.png"></label>
    </div>
    `
    const guesses = document.querySelector(`div.guesses.${whose}`)
    guesses.innerHTML+=guess;

}

socket.on("info",(bac)=>{
    addGuess(bac,"self")
})

socket.on("infoOponent",(bac)=>{
    addGuess(bac,"opponent")    
})
socket.on("win",()=>{
    displayOverlay("You won!")
    setTimeout(()=>{window.location.href = "/"},5000);
})
socket.on("lose",()=>{
    displayOverlay("You lost!")
    setTimeout(()=>{window.location.href = "/"},5000);
})
socket.on("tie",()=>{
    displayOverlay("It's a tie!")
    setTimeout(()=>{window.location.href = "/"},5000);
})

socket.on("turn",(player)=>{
    document.querySelectorAll('.onTurn').forEach(el=>el.classList.remove("onTurn"));
    document.querySelector("div."+player).classList.add("onTurn");
    
})

socket.on("lastChance",(self)=>{
    const message = 
    self ?
    "You have a last chance to guess the opponent's number. If you do the game will be a tie otherwise you lose." :
    "Your opponent has a last chance to guess your number. If he guesses it correctly the game will be tie otherwise you win."
    displayOverlay("Last chance",message,3,"medium");
})


socket.on("error",(err)=>{
    ShowError(err);
})
