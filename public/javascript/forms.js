
document.addEventListener("DOMContentLoaded",()=>{
    const joinForms = document.querySelectorAll(".join-lobby-form");
    joinForms.forEach(form=>{
        form.addEventListener("submit",(event)=>{
            event.preventDefault();
            fetch(form.action,{
                met
            })
        })
    })
    const createForms = document.querySelectorAll(".join-lobby-form");
    createForms.forEach(form=>{
        form.addEventListener("submit",(event)=>{
            event.preventDefault();
            fetch(form.action,{
                met
            })
        })
    })

})