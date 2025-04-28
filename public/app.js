
// Frontend app. container
const app = {};

app.config = {
  // When reloading the page but the user already logged in use the token
  sessionToken:
    typeof localStorage.getItem("token") == "object"
      ? localStorage.getItem("token")
      : false,
};

app.client = {};
app.lastInteractionTime = Date.now();
app.needsToRenewToken = true;

app.client.request = (
  headers,
  path,
  method,
  queryStringObject,
  payload,
  callback
) => {
  //TODO: check whether the server has not logged the user out because some function only will be available for logged in users
  headers = typeof headers == "object" && headers !== null ? headers : {};
  path = typeof path == "string" ? path : "/";
  payload = typeof payload == "object" && payload !== null ? payload : {};

  // Hidden method check for PUT and DELETE forms
  if (payload._method){
    method=payload._method;
    delete payload._method
  } else {
    method =
    typeof method == "string" &&
    ["GET", "POST", "PUT", "DELETE"].includes(method.toUpperCase())
      ? method
      : "GET";
  }
 
  queryStringObject =
    typeof queryStringObject == "object" && queryStringObject !== null
      ? queryStringObject
      : {};

  callback = typeof callback == "function" ? callback : false;
  let requestUrl = path + "?";
  let counter = 0;

  // Extending requestUrl with query keys and values
  for (const key in queryStringObject) {
    if (queryStringObject.hasOwnProperty(key)) {
      counter++;
      if (counter > 1) {
        requestUrl += "&";
      }
      requestUrl += key + "=" + queryStringObject[key];
    }
  }

  // Http request
  const xhr = new XMLHttpRequest();
  // Setting up the rquest
  xhr.open(method, requestUrl, true); // true -> async request -> don't wait
  xhr.setRequestHeader("Content-Type", "application/json");

  // Adding other headers if there are
  for (const headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }

  // If there is a session token then add it to headers
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // Handle the response if the request has done
  xhr.onreadystatechange = () => {
    if (xhr.readyState == "3" || xhr.readyState == "4") {
      // 3=Response loading, 4=Response done
      if (xhr.readyState == "3") {
        // Not to overwrite the the status
        const statusCode = xhr.status;
        const statusText = xhr.statusText;
        const responseReturned = xhr.responseText;

       

        // Callback (if there is a callback)
        if (callback) {
          try {
            // W/O json it will create an error
            const parsedResponse = JSON.parse(responseReturned);
            callback(statusCode, parsedResponse);
          } catch (err) {
            callback(statusCode, statusText);
          }
        }
      }
    }
  };

  const payloadString = JSON.stringify(payload);

  // Sending the request as we set up before
  xhr.send(payloadString);
};

// Bind the forms
app.bindForms = function () {
  if (document.querySelector("form")) {
    var allForms = document.querySelectorAll("form");
    for(var i = 0; i < allForms.length; i++){
      allForms[i].addEventListener("submit", function(e){
        // Stop it from submitting

        e.preventDefault();
        const formId = this.id;
        const path = this.action;
        const method = this.method.toUpperCase();

        // Turn the inputs into a payload
        let payload = {};
        const elements = this.elements; // Selecting the form controll elements
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].type !== "submit") {
            let valueOfElement =
              elements[i].type == "checkbox"
                ? elements[i].checked
                : elements[i].value;
            payload[elements[i].name] = valueOfElement;
          }
        }

        if (formId=='menuOrder') {
          // Forming the payload object according to the shopping cart API
          payload={};
          const tableBodyElement = document.querySelector('.scrollable-table tbody');
          const rowElements = tableBodyElement.querySelectorAll('tr');

          const pizzaOrders = [];

          rowElements.forEach((row) => {
            const nameInputElement = rowElements.querySelector('input.pizza-name');
            const priceInputElement = rowElements.querySelector('input.pizza-price');
            const qtyInputElement = rowElements.querySelector('input.pizza-qty');

            if (qtyInputElement && parseInt(qtyInputElement.value) > 0) {
              const pizza = {
                name: nameInputElement.value,
                price: parseInt(priceInputElement.value),
                qty: parseInt(qtyInputElement.value)
              };
              pizzaOrders.push(pizza);
            };
          });
          const emailInputElement=document.querySelector('[name="user-email"]')
          // Formatted payload
          payload={email:emailInputElement.value, items:pizzaOrders}
        };

        // Call the appropriate API
        app.client.request(
          undefined,
          path,
          method,
          undefined,
          payload,
          function (statusCode, responsePayload) {
            // Display an error on the form if needed
            if (statusCode !== 200 && statusCode !== 201) {
              // Try to get the error from the api, or set a default error message
              var error =
                typeof responsePayload.Error == "string"
                  ? responsePayload.Error
                  : "Error during API request.";

              // Set the formError field with the error text
              app.errorMessage(error);
            } else {
              // If successful, send to form response processor
              app.formResponseProcessor(formId, payload, responsePayload);
            }
          }
        );
      });
    };
  }
};

// Create an info message for the user
app.message = (messageText) => {
  const infoMessage={
    content: messageText,
    expiresAt: Date.now() + 1000 * 5 // the message appears for 8 seconds
  };
  localStorage.setItem('infoMessage',JSON.stringify(infoMessage))
};


// Create an error message for the user
app.errorMessage = (messageText) => {
  const errorMessage={
    content: messageText,
    expiresAt: Date.now() + 1000 * 5 // the message appears for 8 seconds
  };
  localStorage.setItem('errorMessage',JSON.stringify(errorMessage))
};

// Form response processor
app.formResponseProcessor = function (formId, requestPayload, responsePayload) {
  const functionToCall = false;

  if (formId == "accountCreate") {
    // Take the email and password, and use it to log the user in (create a token)
    const newPayload = {
      email: requestPayload.email,
      password: requestPayload.password,
    };

    // Create a new token
    app.client.request(
      undefined,
      "api/tokens",
      "POST",
      undefined,
      newPayload,
      function (newStatusCode, newResponsePayload) {
        if (newStatusCode !== 200) {
          app.errorMessage("Sorry, an error has occured. Please try again.");
        } else {
          // If successful, set the token in the local storage and redirect the user
          app.setSessionToken(newResponsePayload);
          app.message("You have signed up successfully.");
        }
      }
    );
  }
  // If login was successful, set the token in local storage and redirect the user
  if (formId == "login") {
    app.setSessionToken(responsePayload);
    app.message("You have logged in successfully.");
  }

 // Messages to the user on successfull FORM activities
   if (formId=='accountEdit') 
      app.message('Account updated successfully.')


  if(formId == 'accountDelete'){
    app.logoutProcess();
    window.location = '/account/delete';
    app.message('Account deleted successfully.')
  }
};

app.bindLogoutButton = () => {
  const logoutButton = document.querySelector("#logoutButton");
  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    app.logoutProcess();
  });
};


app.logoutProcess = () => {
  window.location.href = "/account/logout";

  const tokenId =
    typeof app.config.sessionToken.id == "string"
      ? app.config.sessionToken.id
      : false;
  const userEmail =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  const headers = { token: tokenId };
  const payload = { email: userEmail };

  if (tokenId) {
    app.client.request(
      undefined,
      "api/tokens",
      "DELETE",
      undefined,
      payload,
      function (statusCode, responsePayload) {
        // Display an error on the form if needed
        if (statusCode !== 200 && statusCode !== 201) {
          // Try to get the error from the api, or set a default error message
          var error =
            typeof responsePayload.Error == "string"
              ? responsePayload.Error
              : "Error during API request.";
          app.errorMessage(error);
        } else {
          app.deleteSessionToken();
          app.setLoggedInClass(false);
          app.message('You have logged out successfully.');
          clearInterval(inactiveTime);
        }
      }
    );
  } else {
    app.errorMessage("Could not logout.");
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function (loggedIn) {
  let target1 = document.querySelector(".showHide");
  let target2 = document.querySelector(".switchDisabled a");
  let hideWhenLogout=document.querySelector(".hideWhenLogout");

    if (loggedIn) {
      if (target1) target1.style.visibility = "hidden";
      if (target2) target2.style.pointerEvents = "none";
      if (hideWhenLogout) hideWhenLogout.style.visibility="visible";
    } else {
      if (target1) target1.style.visibility = "visible";
      if (target2) target2.style.pointerEvents = "auto";
      if (hideWhenLogout) hideWhenLogout.style.visibility="hidden";
    };
  };

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function () {
  const tokenString = localStorage.getItem("token");
  if (typeof tokenString == "string") {
    try {
      let token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if (typeof token == "object") {
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    } catch (e) {
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  } else {
    app.setLoggedInClass(false);
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function (token) {
  app.config.sessionToken = token;
  const tokenString = JSON.stringify(token);
  localStorage.setItem("token", tokenString);
  if (typeof token == "object") {
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

app.deleteSessionToken = () => {
  localStorage.removeItem("token");
};

// Renew the token
app.renewToken = function (callback) {
  const id =
    typeof app.config.sessionToken.id == "string"
      ? app.config.sessionToken.id
      : false;
  const email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;

  if (id && email) {
    // Update the token with a new expiration
    const payload = {
      id,
      email,
    };
    app.client.request(
      undefined,
      "api/tokens",
      "PUT",
      undefined,
      payload,
      function (statusCode, responsePayload) {
        // Display an error on the form if needed
        if (statusCode == 200) {
          app.setSessionToken(responsePayload);
          app.message("Token has renewed.");
          callback(false);
        } else {
          app.errorMessage(responsePayload["Error"]);
          callback(true);
        }
      }
    );
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Renew token loop
const renewInterval = setInterval(function () {
  app.renewToken(function (err) {
    if (err) {
      console.log("Error occured during token renew.");
    }
  });
}, 1000 * 60 * 5);

// If user is not active for 10 minutes he will be logged out
const inactiveTime = setInterval(() => {
  const now = Date.now();
  const minutesInactive = (now - app.lastInteractionTime) / 1000 / 60;
  if (minutesInactive >= 10) {
    console.log("User inactive for over 10 minutes. User will be logged out. ");
    clearInterval(renewInterval);
    app.logoutProcess();
  }
}, 1000 * 30); // Check every half minute


const checkIfUserLoggedOut = setInterval(() => {
  const email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;

  if (email) {
    const queryStringObject = {
      email
    };
    app.client.request(
      undefined,
      "api/logoutcheck",
      "GET",
      queryStringObject,
      undefined,
      function (statusCode, responsePayload) {
        // Display an error on the form if needed
        if (statusCode == 404) {
          app.message("You have logged out by the server.");
          localStorage.removeItem('token')
          window.location.href='/account/login'
        } else {
          console.log(statusCode,responsePayload['Error']);
        }
      }
    );
  };
}, 1000 * 1); // 


// Checking of user message in local storage every 2 seconds and display them
const checkMessages = setInterval(() => {
  const infoMessage=JSON.parse(localStorage.getItem('infoMessage'))
  const errorMessage=JSON.parse(localStorage.getItem('errorMessage'))

  if (infoMessage) {
    let message = document.querySelector("#messageModal #messageInfo");
    message.innerText = infoMessage.content;
    const messageModalElement=document.querySelector('#messageModal');
    messageModalElement.setAttribute('class','messageModal');
    if (Date.now() > infoMessage.expiresAt) {
      messageModalElement.removeAttribute('class');
      localStorage.removeItem("infoMessage");
      message.innerText='';
    } 
  }

  if (errorMessage) {
    let error= document.querySelector("#errorModal #errorInfo");
    error.innerText = errorMessage.content;
    const errorModalElement=document.querySelector('#errorModal');
    errorModalElement.setAttribute('class','errorModal');
    if (Date.now() > errorMessage.expiresAt) {
      errorModalElement.removeAttribute('class');
      localStorage.removeItem("errorModal");
      error.innerText='';
    } 
  }
}, 1000 * 1); 

app.init = function () {
  const menuLinksH = document.querySelectorAll(".menuLink a");
  const currentPath = window.location.pathname;

  // Change the appearance of the active link
  Array.from(menuLinksH).forEach((link) => {
    if (
      link.getAttribute("href") === currentPath ||
      (link.getAttribute("id") === "logoutButton" &&
        currentPath == "/account/logout")
    ) {
      link.classList.add("active");
    }
  });


  // Bind all form submissions
  app.bindForms();
  app.bindLogoutButton();

  // Get the token from localstorage
  app.getSessionToken();

  // Check user interaction
  ["click", "keydown", "mousemove", "scroll", "touchstart"].forEach((event) => {
    window.addEventListener(
      event,
      () => {
        app.lastInteractionTime = Date.now();
      },
      true
    );
  });

  const form = document.querySelector("#accountEdit");

  app.loadDataOnPage();
};

app.loadDataOnPage = function(){
  // Get the current page from the body class
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

  // Logic for loading menu list page
  if(primaryClass == 'menuList'){
    app.loadMenuListPageContent();
  }

  // Logic for loading menu order page
  if(primaryClass == 'menuOrder'){
    app.loadMenuOrderPageContent();
  }

  // Logic for loading account edit page
  if(primaryClass == 'accountEdit'){
    app.loadAccountEditPageContent();
  }

  if(primaryClass == 'accountDelete'){
    app.loadAccountDeletePageContent();
  }
};


app.loadMenuListPageContent = function(){
  // Get the email  
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the menu data
    var queryStringObject = {
      email
    };
    app.client.request(undefined,'api/menu','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200 && responsePayload){
        const pizzaList=responsePayload.items instanceof Array ? responsePayload.items:false
 
        if (pizzaList) {
        // Creating table
        const tableContainerElement=document.querySelector('.scrollable-table')
        const tableElement=document.createElement('table');
        const tHeadElement=document.createElement('thead');
        const tBodyElement=document.createElement('tbody');
        
        // Create header rows
        const hRowElement=document.createElement('tr');
        const hNameElement=document.createElement('th');
        hNameElement.innerText='Name'
        hNameElement.className='pizzaName';

        const hIngredientsElement=document.createElement('th');
        hIngredientsElement.innerText='Ingredients'
        hIngredientsElement.className='pizzaIngredients';

        const hPriceElement=document.createElement('th');
        hPriceElement.innerText='Price'
        hPriceElement.className='pizzaPrice';

        // Creating table structure
        tableContainerElement.appendChild(tableElement);
        tableElement.appendChild(tHeadElement);
        tableElement.appendChild(tBodyElement);
        tHeadElement.appendChild(hRowElement);
        hRowElement.appendChild(hNameElement);
        hRowElement.appendChild(hIngredientsElement);
        hRowElement.appendChild(hPriceElement);
        pizzaList.forEach((item) => {
            // Create a table row
            const rowElement = document.createElement('tr');
            const nameElement = document.createElement('td');
            const ingredientsElement = document.createElement('td');
            const priceElement = document.createElement('td');
            nameElement.textContent = item.name;
            nameElement.className='pizzaName'
            ingredientsElement.textContent = item.ingredients;
            ingredientsElement.className='pizzaIngredients'
            priceElement.textContent = item.price;
            priceElement.className='pizzaPrice'
            rowElement.appendChild(nameElement);
            rowElement.appendChild(ingredientsElement);
            rowElement.appendChild(priceElement);
            tBodyElement.appendChild(rowElement);
          });
        }
      } else {
        app.errorMessage("Error: "+statusCode+" - Something went wrong when communicating with the server.")
      }
    });
  } else {
    app.errorMessage("Your email creditantial is missing.")
  }
};

app.loadMenuOrderPageContent = function(){
  // Get the email from the current token
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the menu data
    var queryStringObject = {
      email
    };
    app.client.request(undefined,'api/menu','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200 && responsePayload){
        const pizzaList=responsePayload.items instanceof Array ? responsePayload.items:false
 
        if (pizzaList) {
          const tableContainerElement=document.querySelector('.scrollable-table');

          // Creating table
          const tableElement=document.createElement('table');
          const tHeadElement=document.createElement('thead');
          const tBodyElement=document.createElement('tbody');
          
          // Create header rows
          const hRowElement=document.createElement('tr');
          const hNameElement=document.createElement('th');
          hNameElement.innerText='Name'
          hNameElement.className='pizzaName';
          const hIngredientsElement=document.createElement('th');
          hIngredientsElement.innerText='Ingredients'
          hIngredientsElement.className='pizzaIngredients';
          const hPriceElement=document.createElement('th');
          hPriceElement.innerText='Price'
          hPriceElement.className='pizzaPrice';
          // Extending the table with quantity column
          const hQtyElement=document.createElement('th');
          hQtyElement.innerText='Qty'
          hQtyElement.className='pizzaQty';

          // Creating table structure
          tableContainerElement.appendChild(tableElement);
          tableElement.appendChild(tHeadElement);
          tableElement.appendChild(tBodyElement);
          tHeadElement.appendChild(hRowElement);
          hRowElement.appendChild(hNameElement);
          hRowElement.appendChild(hIngredientsElement);
          hRowElement.appendChild(hPriceElement);
          hRowElement.appendChild(hQtyElement);
          pizzaList.forEach((item) => {
            // Create a table row
            const rowElement = document.createElement('tr');
            const nameElement = document.createElement('td');
            const ingredientsElement = document.createElement('td');
            const priceElement = document.createElement('td');
            const qtyElement = document.createElement('td');
            nameElement.className='pizzaName';
            ingredientsElement.textContent = item.ingredients;
            ingredientsElement.className='pizzaIngredients';
            priceElement.className='pizzaPrice';
            qtyElement.className='pizzaQty';
         

            // Create input elements to pass data to the form
            const emailInputElement = document.createElement('input'); // for shoppingcart API to send user email
            emailInputElement.type='hidden';
            emailInputElement.name='user-email';
            emailInputElement.value=app.config.sessionToken.email;

            // Read only elements
            const nameInputElement = document.createElement('input');
            nameInputElement.type='text';
            nameInputElement.readOnly=true;
            nameInputElement.name='pizzaName'+'-'+item.name;
            nameInputElement.className='pizza-name';
            nameInputElement.value = item.name;

            const priceInputElement = document.createElement('input');
            priceInputElement.type='text';
            priceInputElement.readOnly=true;
            priceInputElement.value = item.price;
            priceInputElement.name='pizzaPrice'+'-'+item.name;
            priceInputElement.className='pizza-price';

            // Changeable by the user
            const qtyInputElement = document.createElement('input');
            qtyInputElement.type='number';
            qtyInputElement.readOnly=false;
            qtyInputElement.value = 0;
            qtyInputElement.name='pizzaQty'+'-'+item.name;
            qtyInputElement.className='pizza-qty';

            // Create table rows
            rowElement.appendChild(emailInputElement);
            rowElement.appendChild(nameElement);
            nameElement.appendChild(nameInputElement)
            rowElement.appendChild(ingredientsElement);
            rowElement.appendChild(priceElement);
            priceElement.appendChild(priceInputElement);
            rowElement.appendChild(qtyElement);
            qtyElement.appendChild(qtyInputElement);
            tBodyElement.appendChild(rowElement);
          });
        }
      } else {
        app.errorMessage("Error: "+statusCode+" - error loading menu data.");
      }
    });
  } else {
    app.errorMessage("Your email creditantial is missing.");
  }
};

app.loadAccountEditPageContent = function(){
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the menu data
    var queryStringObject = {
      email
    };
    app.client.request(undefined,'api/users','GET',queryStringObject,undefined,function(statusCode,responsePayload){

  
      if(statusCode == 200 && responsePayload){
        const userAccountData=responsePayload ? responsePayload:false
        if (userAccountData) {
          // Grabbing form elements
          const firstNameInputElement=document.querySelector('#accountEdit [name="firstName"]');
          const lasttNameInputElement=document.querySelector('#accountEdit [name="lastName"]');
          const streetInputElement=document.querySelector('#accountEdit [name="street"]');
          const emailInputElementEdit=document.querySelector('#accountEdit [name="email"]');
          const emailInputElementDelete=document.querySelector('#accountDelete [name="email"]');
          const passwordInputElement=document.querySelector('#accountEdit [name="password"]');
          firstNameInputElement.value=userAccountData.firstName;
          lasttNameInputElement.value=userAccountData.lastName;
          emailInputElementEdit.value=email;
          emailInputElementDelete.value=email;
          streetInputElement.value=userAccountData.street;
          passwordInputElement.value=''; // If user don't change his paswword it will remain empty

          // Placing the hidden method to the form to handle the PUT request
          const hiddenInputElement=document.createElement('input');
          hiddenInputElement.type='hidden';
          hiddenInputElement.name='_method';
          hiddenInputElement.value='PUT';
          const formElement=document.querySelector('#accountEdit')
          formElement.appendChild(hiddenInputElement)
        }
      } else {
        app.errorMessage("Error: "+statusCode+" - error loading user data.")
      }
    });
  } else {
    app.errorMessage("Your email creditantial is missing.")
  }
};

app.loadAccountDeletePageContent = function(){
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the user data
    var queryStringObject = {
      email
    };
   
    const emailInputElement=document.querySelector('#accountDelete [name="email"]');
    emailInputElement.value=email;
    // Placing the hidden method to the form to handle the PUT request
    const hiddenInputElement=document.createElement('input');
    hiddenInputElement.type='hidden';
    hiddenInputElement.name='_method';
    hiddenInputElement.value='DELETE';
    const formElement=document.querySelector('#accountDelete')
    formElement.appendChild(hiddenInputElement)
       
  } else {
    app.errorMessage("Your email creditantial is missing.")
  }
};

// Call the init processes after the window loads
window.onload = function () {
  app.init();
  app.getSessionToken();
};
