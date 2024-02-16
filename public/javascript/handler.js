function handleResponse(data){
    console.log(data);
    switch(data.status){
        case 200:{
            if(data.headers.get('content-type')=="application/json")
            return data.json();
            else return data.text();
        }break;
        case 302:{
            
        }
        case 400:{
            ShowError(data.statusText);
            throw new Error(data.statusText);
        }break;
        case 401:{
            sessionStorage.set("error","Please login to continue");
            window.location.href="/login"            
        }break;
        case 500:{
            ShowError("Server error"); 
            throw new Error(data.statusText);
        }break;
        // case
    }
}