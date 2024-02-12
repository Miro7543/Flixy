window.onload=()=>{
    let div = document.createElement("div");
    div.classList.add("overlay")
    let label = document.createElement("label");
    label.classList.add("countdown");
    label.classList.add("big");
    div.appendChild(label);

    document.body.appendChild(div);
    countdown(div,label,5);
}

// let count = 5;

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


