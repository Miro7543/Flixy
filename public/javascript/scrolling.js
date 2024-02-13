const vp=document.getElementById("viewport");
const links=document.getElementById("side-links").children;
let lastPos=0;
const anchors=[
    "landing-page",
    "tic-tac-toe",
    "bulls-and-cows",
    "sudoku",
    "battleships"
];
let anchorIndex=0;
links[anchorIndex].classList.add("selected");
let anchorScrollingCooldown=false;

vp.addEventListener("wheel",(event)=>{
    event.preventDefault();
    if(!anchorScrollingCooldown){
        moveToNextAnchor(event.deltaY);
        anchorScrollingCooldown=true;
        setTimeout(()=>{anchorScrollingCooldown=false;},400);
    }
})

document.addEventListener("keydown",(ev)=>{
    if(Math.abs(ev.keyCode-39)<=1)
        moveToNextAnchor(ev.keyCode-39);
})

document.addEventListener("DOMContentLoaded",()=>{
    if(location.hash){
        let index=anchors.findIndex(x=>x==location.hash.slice(1));
        anchorIndex=index;
        selectButton();
        location.hash = "";
        location.hash = anchors[anchorIndex];
    }
})

function moveToNextAnchor(delta){
    if(delta>0){//down
        anchorIndex++;
        anchorIndex=Math.min(anchorIndex,5);
    }
    else if(delta<0){ //up
        anchorIndex--;
        anchorIndex=Math.max(anchorIndex,0);
    }
    location.hash = anchors[anchorIndex];
    selectButton();

}

function selectButton(){
    for(let link of links){
        link.classList.remove("selected");
    }
    links[anchorIndex].classList.add("selected");
}

function addClickListeners(){
    for(let i=0;i<6;i++){
        links[i].addEventListener("click",()=>{
            let href=links[i].attributes.getNamedItem("href");
            location.hash = href;
            anchorIndex=i;  
            selectButton();   
        })
    }
}
addClickListeners();
