const menuLinksH = document.querySelectorAll(".menuLink a");
const currentPath = window.location.pathname;

Array.from(menuLinksH).forEach(link => {
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
        if(xhr.readyState=='3' || xhr.readyState=='4'){ // 3=Response loading, 4=Response done
            if (xhr.readyState=='3' ) { // Not to overwrite the the status 
              const statusCode=xhr.status;
              const statusText=xhr.statusText
              const responseReturned=xhr.responseText;

              // Callback (if there is a callback)
              if(callback) {
                  try {
                      // W/O json it will create an error
                      const parsedResponse=JSON.parse(responseReturned);
                      callback(statusCode,parsedResponse);
                  } catch (err) {
                      callback(statusCode,statusText);
                  }
              }
            }
        }
    }

    const payloadString=JSON.stringify(payload)

    // Sending the request as we set up before
    xhr.send(payloadString)
};

// Bind the forms
app.bindForms = function(){
    document.querySelector("form").addEventListener("submit", function(e){
  
      // Stop it from submitting
      e.preventDefault();
      const formId = this.id;
      const path = this.action;
      const method = this.method.toUpperCase();
  
      // Hide the error message (if it's currently shown due to a previous error)
      document.querySelector("#"+formId+" .formError").style.display = 'hidden';
  
      // Turn the inputs into a payload
      let payload = {};
      const elements = this.elements; // Selecting the form controll elements
      for(let i = 0; i < elements.length; i++){
        if(elements[i].type !== 'submit'){
          let valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
          payload[elements[i].name] = valueOfElement;
        }
      }
  
      // Call the appropriate API
      app.client.request(undefined,path,method,undefined,payload,function(statusCode,responsePayload){
        // Display an error on the form if needed
        if(statusCode !== 200 && statusCode!==201){
  
          // Try to get the error from the api, or set a default error message
          var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'Error during API request.';
  
          // Set the formError field with the error text
          document.querySelector("#"+formId+" .formError").innerHTML = error;
          document.querySelector("#"+formId+" .formError").style.display = 'block';
  
        } else {
          // If successful, send to form response processor
          app.formResponseProcessor(formId,payload,responsePayload);
        }
  
      });
    });
  };

// Form response processor
app.formResponseProcessor = function(formId,requestPayload,responsePayload){
    var functionToCall = false;
    if(formId == 'accountCreate'){
        console.log('Account submitted...')
      // @TODO Login the user
    }
  };
  
  // Init (bootstrapping)
  app.init = function(){
    // Bind all form submissions
    app.bindForms();
  };
  
  // Call the init processes after the window loads
  window.onload = function(){
    app.init();
  };



