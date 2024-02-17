
document.addEventListener("DOMContentLoaded",()=>{
    const joinForms = document.querySelectorAll("form");
    joinForms.forEach(form=>{
        form.addEventListener("formdata",(event)=>{
            event.formData.append("socketid",socket.id)
        })
        form.addEventListener("submit",(ev)=>{
            ev.preventDefault();
            const data = new URLSearchParams();
            for (const pair of new FormData(form)) {
                data.append(pair[0], pair[1]);
            }
            fetch(form.action,{
                method:"POST",
                body: data 
            })
            .then(handleResponse)
            .catch(err=>{console.log(err)})
        })
            
    })
    
    const loginForm = document.querySelector("form.login")
    if(loginForm)
    loginForm.addEventListener("submit",(ev)=>{
        ev.preventDefault();
        const data = new URLSearchParams();
        for (const pair of new FormData(loginForm)) {
            data.append(pair[0], pair[1]);
        }
        fetch(loginForm.action,{
            method:"POST",
            body: data 
        })
        .then(handleResponse)
        .catch(err=>{console.log(err)})
    })
    
    const registerForm = document.querySelector("form.login")
    if(registerForm)
    registerForm.addEventListener("submit",(ev)=>{
        ev.preventDefault();
        const data = new URLSearchParams();
        for (const pair of new FormData(registerForm)) {
            data.append(pair[0], pair[1]);
        }
        fetch(loginForm.action,{
            method:"POST",
            body: data 
        })
        .then(handleResponse)
        .catch(err=>{console.log(err)})
    })
    // const createForms = document.querySelectorAll("form.create-lobby-form");
    // createForms.forEach(form=>{
        // form.addEventListener("formdata",(event)=>{
            // event.formData.append("socketid",socket.id)
        // })
    // })

})
