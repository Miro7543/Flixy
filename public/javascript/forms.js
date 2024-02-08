
document.addEventListener("DOMContentLoaded",()=>{
    const form = document.querySelector("form")
    const  inputs = form.querySelectorAll("input");
    const  error = form.querySelector("label.error-message");
    form.onsubmit = (event)=>{
        const formData=new FormData(form);
        const URLencoded=new URLSearchParams(formData);
        if(!validatePass(formData.get("password1"))){
            error.innerHTML = `Password must contain 
            <ul>
                <li>Upper case letter</li>
                <li>Lower case letter</li>
                <li>A digit</li>
                <li>At least 8 characters</li>
            </ul>`;
            event.preventDefault();
        }
    }
})

function validatePass(pass1){
    const lowerLetter=RegExp(".*[a-z].*");
    const upperLetter=RegExp(".*[A-Z].*");
    const digit=RegExp(".*[0-9].*");
    return lowerLetter.test(pass1) && upperLetter.test(pass1) && digit.test(pass1) && pass1.length>=8;
}