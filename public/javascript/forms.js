
document.addEventListener("DOMContentLoaded",()=>{
    const joinForms = document.querySelectorAll(".join-lobby-form");
    joinForms.forEach(form=>{
        form.addEventListener("submit",(event)=>{
            event.preventDefault();
            fetch(form.action,{
                method:"POST",
                body:JSON.stringify(formDataToObj(form))
            })
            .then(handleResponse)
        })
    })
    const createForms = document.querySelectorAll("form.create-lobby-form");
    createForms.forEach(form=>{
        console.log(form)
        form.addEventListener("formdata",(event)=>{
            event.formData.append("socketid",socket.id)
        })
    })

})

function formDataToObj(form){
    const formDataObject = {};
    for (const [key, value] of form.entries()) {
        formDataObject[key] = value;
    }
}