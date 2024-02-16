const toast=document.getElementById("toast")
let timeout;
function ShowMessage(message=''){
    toast.innerHTML=message;
    toast.classList.add('show');
    toast.classList.remove('error');
    if(timeout)clearTimeout(timeout)
    timeout=setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function ShowError(message=''){
    toast.innerHTML=message;
    toast.classList.add('error');
    toast.classList.add('show');
    if(timeout)clearTimeout(timeout)
    timeout=setTimeout(() => {
        toast.classList.remove('show');

        toast.classList.remove('error');
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