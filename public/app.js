const menuLinksH = document.querySelectorAll(".menuLink a");
const currentPath = window.location.pathname;
  console.log('Currenth path',document,currentPath, typeof menuLinksH,menuLinksH)

Array.from(menuLinksH).forEach(link => {
    console.log('Link ****', link );
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
});

// Frontend app. container
const app={};

app.config={
    sessionToken:false
};

app.client={};

app.client.request=(headers,path,method,queryStringObject,payload,callback)=>{
    headers=typeof headers=='object' && headers!==null ? headers:{};
    path=typeof path=='string' ? path:'/';
    method=typeof method=='string' && ['GET','POST','PUT','DELETE'].includes(method.toUpperCase()) ? method:'GET';
    queryStringObject=typeof queryStringObject=='object' && queryStringObject!==null ? queryStringObject:{};
    payload=typeof payload=='object' && payload!==null ? payload:{};
    callback=typeof callback=='function' ? callback:false;

    const requestUrl=path+'?';
    const counter=0;
    // Extending requestUrl with query keys and values
    for (const key in queryStringObject){
        if (queryStringObject.hasOwnProperty(key)) {
            counter++;
            if (counter>1){
                requestUrl+='&';
            }
            requestUrl=key+'='+queryStringObject[key];
        }
    }

    // Http request
    const xhr=new XMLHttpRequest();
    // Setting up the rquest
    xhr.open(method,requestUrl,true); // true -> async request -> don't wait 
    xhr.setRequestHeader('Content-Type','application/json');

    // Adding other headers if there are
    for (const headerKey in headers) {
        if (headers.hasOwnProperty(headerKey)) {
            xhr.setRequestHeader(headerKey,headers[headerKey]);
        }
    };

    // If there is a session token then add it to headers
    if (app.config.sessionToken) {
        xhr.setRequestHeader('token',app.config.sessionToken.id);
    };

    // Handle the response if the request has done
    xhr.onreadystatechange=()=>{
        if(xhr.readyState=XMLHttpRequest.DONE){
            const statusCode=xhr.status;
            const responseReturned=xhr.responseText;

            // Callback (if there is a callback)
            if(callback) {
                try {
                    // E/O json it will create an error
                    const parsedResponse=JSON.parse(responseReturned);
                    callback(statusCode,parsedResponse);
                } catch (err) {
                    callback(statusCode,false);
                }
            }
        }
    }

    const payloadString=JSON.stringify(payload)

    // Sending the request as we set up before
    xhr.send(payloadString)
};



