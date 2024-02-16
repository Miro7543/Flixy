addDifficultyListeners();
socket.on("GameStarted",(data)=>{
    fetch(`/sudoku/${data.code}`)
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
        addDifficultyListeners();
    })
})

let selected=null;

function removeDifficulties(){
    const voting = document.querySelector("div.votingCont")
    voting.innerHTML = "";
}

function addDifficultyListeners(){
    document.querySelectorAll("button.difficultyBtn")
    .forEach(button=>{
        button.addEventListener("click",()=>{
            socket.emit("vote",button.getAttribute("value"),removeDifficulties);
        })
    })
}

function addSelectorListeners(){
    document.querySelectorAll("div.number")
    .forEach(numberBtn=>{
        numberBtn.addEventListener("click",()=>{
            document.querySelectorAll("div.number.selected")
            .forEach(selectedBtn=>selectedBtn.classList.remove("selected"))
            numberBtn.classList.add("selected");
            selected = Number(numberBtn.getAttribute("num"));
            document.querySelectorAll(`td.highlight`)
            .forEach(cell=>cell.classList.remove("highlight"))
            document.querySelectorAll(`td[curr="${selected}"]`)
            .forEach(cell=>cell.classList.add("highlight"))

        })

    })   
}

function addFillListener(cell,index){
    cell.addEventListener("click",()=>{
        if(selected==null){
            //message - select a number or erase 
            return;
        }
        if(selected == 0){
            cell.innerHTML=''
            cell.classList.remove("invalid");
            cell.setAttribute("curr",0);
            return;
        }
        socket.emit("guess",index,selected,(correct)=>{
            cell.innerHTML=selected;
            cell.setAttribute("curr",selected);
            cell.classList.add("highlight");
            if(!correct)cell.classList.add("invalid");
        })
    })
}

function fillBoard(board){
    board.forEach((num,index)=>{
        const pos=linearToSquarePos(index);
        if(num){
            const cell = document.querySelector(`td.square${pos.square} td.cell${pos.cell}`)
            cell.innerHTML = num;
            cell.classList.add("given");
            cell.setAttribute("curr",num);
        }
        else{
            const cell = document.querySelector(`td.square${pos.square} td.cell${pos.cell}`)
            cell.classList.add("not-given");
            addFillListener(cell,index)
        }
    })
}

socket.on("startGame",(board,difficulty)=>{
    const voting = document.querySelector("div.votingCont")
    document.querySelector("div.board").removeChild(voting);
    fillBoard(board);
    addSelectorListeners();
    document.querySelector("label.difficulty").innerHTML="Difficulty: "+difficulty
})

function base10ToBase3(number) {
    if (number === 0) return '0';

    let result = '';
    while (number > 0) {
        result = (number % 3) + result; 
        number = Math.floor(number / 3);
    }
    return result;
}

socket.on("data",(data)=>{
    console.log(data);
    data.forEach(userInfo=>{
        const playerCont = document.querySelector(`div.player.${userInfo.player}`)
        console.log(userInfo)
        playerCont.querySelector("label.left").innerHTML = "Left: " + userInfo.left;
        playerCont.querySelector("label.solved").innerHTML = "Solved: " + userInfo.solved;
        playerCont.querySelector("label.percent").innerHTML = "Percentage: " + userInfo.percent+"%";

    })
})

function linearToSquarePos(position){
    const x = Math.floor(position / 9);
    const y = position % 9;
    
    const x1 = Math.floor(x / 3);
    const x2 =  x % 3;
    
    const y1 = Math.floor(y / 3);
    const y2 = y % 3;
    console.log(position)
        console.log( {square:(x1*3+y1)+1, cell:(x2*3+y2)+1})
    return {square:(x1*3+y1)+1, cell:(x2*3+y2)+1};
}   
socket.on("win",()=>{
    displayOverlay("You won!")
    setTimeout(()=>{window.location.href = "/"},5000);
})
socket.on("lose",()=>{
    displayOverlay("You lost!")
    setTimeout(()=>{window.location.href = "/"},5000);
})