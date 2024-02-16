let timeout;
function createToast(){
    let toast = document.createElement("div")
    toast.id = "toast";
    document.body.appendChild(toast)
    return toast;
}
function ShowMessage(message=''){
    if(document.getElementById("toast"))
        document.getElementById("toast").remove();
    if(timeout)clearTimeout(timeout)
    const toast = createToast();
    toast.innerHTML=message;
    toast.classList.add('show');
    toast.classList.remove('error');
    timeout=setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(()=>{document.body.removeChild(toast)},300);
    }, 3000);
}

function ShowError(message=''){
    if(document.getElementById("toast"))
        document.getElementById("toast").remove();
    if(timeout)clearTimeout(timeout)
    toast = createToast();
    toast.innerHTML=message;
    toast.classList.add('error');
    toast.classList.add('show');
    timeout=setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(()=>{document.body.removeChild(toast)},300);
    }, 4000);
}

function Check(){
    if(sessionStorage.getItem("error")!=undefined){
        ShowError(sessionStorage.getItem("error"))
        sessionStorage.removeItem("error")
    }
    if(sessionStorage.getItem("message")!=undefined){
        ShowMessage(sessionStorage.getItem("message"))
        sessionStorage.removeItem("message")
    }
}

window.addEventListener("load",()=>{
    Check();
})
    
// Show();