
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

        if (formId=='shoppingCart') {
          // Forming the payload object according to the shopping cart API
          // Dont remove the 'hidden' methods
       
          if (payload._method) payload={_method:payload._method};
    
          const tableBodyElement = document.querySelector('.scrollable-table tbody');
          const rowElements = tableBodyElement.querySelectorAll('tr');
       

          const pizzaOrders = [];

          rowElements.forEach((row) => {
            const nameInputElement = row.querySelector('input.pizza-name');
            const priceInputElement = row.querySelector('input.pizza-price');
            const qtyInputElement = row.querySelector('input.pizza-qty');

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
          payload={...payload,email:emailInputElement.value, items:pizzaOrders}
       
        };

        if (formId=='order') {
          // Forming the payload object according to the order API
          // Dont remove the 'hidden' methods

          if (payload._method) payload={_method:payload._method};

          const tableBodyElement = document.querySelector('.scrollable-table tbody');
          const rowElements = tableBodyElement.querySelectorAll('tr');
      

          const pizzaOrders = [];

          rowElements.forEach((row) => {
            const nameInputElement = row.querySelector('input.pizza-name');
            const priceInputElement = row.querySelector('input.pizza-price');
            const qtyInputElement = row.querySelector('input.pizza-qty');

            if (qtyInputElement && parseInt(qtyInputElement.value) > 0) {
              const pizza = {
                name: nameInputElement.value,
                price: parseInt(priceInputElement.value),
                qty: parseInt(qtyInputElement.value)
              };
              pizzaOrders.push(pizza);
            };
          });

          const email=document.querySelector('[name="user-email"]').value
          
          const card={
            number: document.querySelector("#cardNumber").value.split(" ").join(""),
            exp_month: parseInt(document.querySelector("#expMonth").value),
            exp_year: parseInt(document.querySelector('#expYear').value),
            cvc: document.querySelector('#cvc').value,
          }

          const currency='AUD';

          const amount=parseInt(document.querySelector('#totalPrice').innerText)*100; // convert to cents that Stripe expects
          // Formatted payload
          payload={...payload,email,amount,currency,card}
       
        };

        // Call the appropriate API
        const modifiedPayload={...payload}
        app.client.request(
          undefined,
          path,
          method,
          undefined,
          modifiedPayload,
          function (statusCode, responsePayload) {
            // Display an error on the form if needed
            if (statusCode !== 200 && statusCode !== 201) {
          
              // Try to get the error from the api, or set a default error message
              var error =
                typeof responsePayload.Error == "string"
                  ? responsePayload.Error
                  : "Error during API request.";

              app.message(error,'error');
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

// Form RESPONSE processor
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
          app.message("Sorry, an error has occured. Please try again.",'error');
        } else {
          // If successful, set the token in the local storage and redirect the user
          app.setSessionToken(newResponsePayload);
          app.message("You have signed up successfully.",'info','/action/menulist');
        }
      }
    );
  }

  // If login was successful, set the token in local storage and redirect the user
  if (formId == "login") {
    app.setSessionToken(responsePayload);
    app.message("You have logged in successfully.",'info','/action/menulist');
  }

 // Messages to the user on successfull FORM activities
   if (formId=='accountEdit') 
      app.message('Account updated successfully.','info','/')


  if(formId == 'accountDelete'){
    app.logoutProcess();
    window.location = '/account/delete';
  }

  if (formId=='shoppingCart') {
    const redirect='/action/shoppingcart'
    if (requestPayload._method=='POST') app.message('The shopping cart is created.','info',redirect)
    if (requestPayload._method=='PUT') app.message('The shopping cart is updated.','info',redirect)
    if (requestPayload._method=='DELETE') app.message('The shopping cart is deleted.','info',redirect)
  }

  if (formId=='order') {
    app.message('Your orders is succesfully accepted. Thank you.','info','/')
  };
};

// Create an info message for the user
app.message = (messageText,type,redirect='') => {
  const messageModalElement=document.querySelector('#messageModal');
  const buttonElement=document.createElement('button');
  buttonElement.className='buttonFirst';
  buttonElement.innerText='OK';
  messageModalElement.appendChild(buttonElement);

  let message = document.querySelector("#messageModal #messageInfo");
  message.innerText = messageText;

  if (type=='error') {
    messageModalElement.setAttribute('class','errorModal');
  } else {
    messageModalElement.setAttribute('class','messageModal');
  }

  buttonElement.addEventListener('click',(event)=>{
    messageModalElement.removeAttribute('class');
    message.innerText='';
    buttonElement.remove();
    if (redirect) {window.location.href=redirect};
  })
};

app.bindLogoutButton = () => {
  const logoutButton = document.querySelector("#logoutButton");
  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    app.logoutProcess();
  });
};

// Control the hamburger menu in responsive mode
app.bindHamburgerIcon = () => {
  const hamburgerIcon = document.querySelector("#hamburgerIcon");
  let open=false;
  hamburgerIcon.addEventListener(["click"], (event) => {
    event.preventDefault();
    const navElement=document.querySelector('nav')
    open=open ? false:true;
    if (open ) {
      navElement.style='display:flex'
    } else {
      navElement.style='display:none'
    }
  });

  hamburgerIcon.addEventListener(["resize"], (event) => {
    event.preventDefault();
    const navElement=document.querySelector('nav')
    const viewportWidth = window.innerWidth;
    if (viewportWidth>=600) {
      navElement.style='display:flex'
    } 
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
          app.message(error,'error');
        } else {
          app.deleteSessionToken();
          app.setLoggedInClass(false);
          app.message('You have logged out successfully.','info');
          clearInterval(inactiveTime);
        }
      }
    );
  } else {
    app.message("Could not logout.","error");
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
        if (statusCode == 200) {
          // Token has renewed
          app.setSessionToken(responsePayload);
          callback(false);
        } else {
          app.message(responsePayload["Error"],"error");
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


const checkIfUserLoggedOutByServer = setInterval(() => {
  if (app.config.sessionToken){
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
          if (statusCode == 404) {
            app.message("You have logged out by the server.","info");
            localStorage.removeItem('token')
            window.location.href='/account/login'
          } else {
            if (statusCode!=200 ) {
              console.log(statusCode,'Error during logout cheking '+responsePayload['Error']);
            }
          }
        }
      );
    };
  };
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
  app.bindHamburgerIcon();

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

  // Logic for loading shoppingcart page
  if(primaryClass == 'shoppingCart'){
    app.loadShoppingCartPageContent();
  }

  // Logic for loading order page
  if(primaryClass == 'order'){
    app.loadOrderPageContent();
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
        hNameElement.innerText='Pizza name'
        hNameElement.className='pizzaName';

        const hIngredientsElement=document.createElement('th');
        hIngredientsElement.innerText='Ingredients'
        hIngredientsElement.className='pizzaIngredients';

        const hPriceElement=document.createElement('th');
        hPriceElement.innerText='Price in AUD'
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
        app.message("Error: "+statusCode+" - Something went wrong when communicating with the server.","error")
      }
    });
  } else {
    app.message("Your email creditantial is missing.","error")
  }
};

app.loadShoppingCartPageContent = function(){
  // Get the email from the current token
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the menu data
    var queryStringObject = {
      email
    };
    app.client.request(undefined,'api/menu','GET',queryStringObject,undefined,function(statusCode,responsePayload){
 
      if(statusCode == 200 && responsePayload){
        // Checking if the user has a saved shopping cart
        app.client.request(undefined,'api/shoppingcart','GET',queryStringObject,undefined,function(statusCode,shoppingCartData){
          if(statusCode==200 || statusCode==404) {
            let totalQty=0;
            let totalPrice=0;
            if (shoppingCartData.items) {
              totalQty=shoppingCartData.items.reduce((prev,curr)=> {return prev+curr.qty},0);
              totalPrice=shoppingCartData.items.reduce((prev,curr)=> {return prev+(curr.price*curr.qty)},0);
            }
            const pizzaList=responsePayload.items instanceof Array ? responsePayload.items:false
            if (pizzaList) {
              const formElement=document.querySelector('form');
    
              // Buttons
              const buttonsContainer=document.createElement('div');
              buttonsContainer.className='buttonsContainer';
              const createShoppingCartSubmitButton=document.createElement('button');
              createShoppingCartSubmitButton.id='createCart';
              createShoppingCartSubmitButton.className=totalQty==0 ? 'buttonFirst':'buttonSecond';
              createShoppingCartSubmitButton.type='submit';
              createShoppingCartSubmitButton.innerText='Create';
              const updateShoppingCartSubmitButton=document.createElement('button');
              updateShoppingCartSubmitButton.id='updateCart';
              updateShoppingCartSubmitButton.className=totalQty!==0 ? 'buttonFirst':'buttonSecond';
              updateShoppingCartSubmitButton.type='submit';
              updateShoppingCartSubmitButton.innerText='Update';
              const deleteShoppingCartSubmitButton=document.createElement('button');
              deleteShoppingCartSubmitButton.id='deleteCart';
              deleteShoppingCartSubmitButton.className=totalQty!==0 ? 'buttonFirst':'buttonSecond';
              deleteShoppingCartSubmitButton.type='submit';
              deleteShoppingCartSubmitButton.innerText='Delete';
    
              const hiddenInputElement=document.createElement('input');
              hiddenInputElement.type='hidden';
              hiddenInputElement.name='_method';
              formElement.appendChild(hiddenInputElement);
    
              // Handling buttons
              createShoppingCartSubmitButton.addEventListener('click',(event)=>{
                hiddenInputElement.value='POST';
              });
    
              updateShoppingCartSubmitButton.addEventListener('click',(event)=>{
                hiddenInputElement.value='PUT';
              });
    
              deleteShoppingCartSubmitButton.addEventListener('click',(event)=>{
                hiddenInputElement.value='DELETE';
              });
    
              buttonsContainer.appendChild(createShoppingCartSubmitButton);
              buttonsContainer.appendChild(updateShoppingCartSubmitButton);
              buttonsContainer.appendChild(deleteShoppingCartSubmitButton);
              formElement.appendChild(buttonsContainer);
              const tableContainerElement=document.querySelector('.scrollable-table');
    
              // Creating table
              const tableElement=document.createElement('table');
              const tHeadElement=document.createElement('thead');
              const tBodyElement=document.createElement('tbody');
              
              // Create header rows
              const hRowElement=document.createElement('tr');
              const hNameElement=document.createElement('th');
              hNameElement.innerText='Pizza name'
              hNameElement.className='pizzaName';
              const hIngredientsElement=document.createElement('th');
              hIngredientsElement.innerText='Ingredients'
              hIngredientsElement.className='pizzaIngredients';
              const hPriceElement=document.createElement('th');
              hPriceElement.innerText='Price in AUD'
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

              let count=0;
              pizzaList.forEach((listItem,index) => {
                // Create a table row
                const rowElement = document.createElement('tr');
                const nameElement = document.createElement('td');
                const ingredientsElement = document.createElement('td');
                const priceElement = document.createElement('td');
                const qtyElement = document.createElement('td');
                nameElement.className='pizzaName';

                ingredientsElement.textContent = listItem.ingredients;
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
                nameInputElement.name='pizzaName'+'-'+listItem.name;
                nameInputElement.className='pizza-name';
                nameInputElement.value = listItem.name;
    
                const priceInputElement = document.createElement('input');
                priceInputElement.type='text';
                priceInputElement.readOnly=true;
                priceInputElement.value = listItem.price;
                priceInputElement.name='pizzaPrice'+'-'+listItem.name;
                priceInputElement.className='pizza-price';
    
                // QTY - Creating shoppin cart qty input - loading with values later
                const qtyInputElement = document.createElement('input');
                qtyInputElement.type='number';
                qtyInputElement.readOnly=false;
                qtyInputElement.name='pizzaQty'+'-'+listItem.name;
                qtyInputElement.className='pizza-qty';
                qtyInputElement.placeholder = '0';
                qtyInputElement.min=0;
                qtyInputElement.step=1;
                qtyInputElement.max=5;
                rowElement.setAttribute('data-index',index);

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
                
                 // Create total
                 if (count==0) {
                  count=1; // Create element just once
                  const totalContainerElement=document.createElement('div')
                  totalContainerElement.className='totalContainer'

                  const totalQtyElement=document.createElement('div');
                  totalQtyElement.className='totalQty';
                  totalQtyElement.id='totalQty';
                  totalQtyElement.innerText=totalQty;

                  const totalPriceElement=document.createElement('div');
                  totalPriceElement.innerText=totalPrice;
                  totalPriceElement.className='totalPrice';
                  totalPriceElement.id='totalPrice';

                  const totalNameElement=document.createElement('div');
                  totalNameElement.innerText='Total value and qty:';
                  totalNameElement.className='totalName';
                  totalNameElement.id='totalName';

                  const totalIngredientsElement=document.createElement('div');
                  totalIngredientsElement.innerText='';
                  totalIngredientsElement.className='totalIngredients';
                  totalIngredientsElement.id='totalIngredients';

                  totalContainerElement.appendChild(totalNameElement);  
                  totalContainerElement.appendChild(totalIngredientsElement); 
                  totalContainerElement.appendChild(totalPriceElement);
                  totalContainerElement.appendChild(totalQtyElement);
                  tableContainerElement.appendChild(totalContainerElement);
                 }
            
              // Calculating total qty and total price;
              const changeTotalValues=(prevValue,event)=>{
                currValue=event.target.value ? event.target.value:'0';
                totalQty=totalQty-parseInt(prevValue)+parseInt(currValue);
                const currentItem=pizzaList.find((item)=> item.name==nameInputElement.value )
                totalPrice=totalPrice-parseInt(prevValue)*currentItem.price+parseInt(currValue)*currentItem.price;
                const totalQtyElement=document.getElementById('totalQty');
                totalQtyElement.innerText=totalQty;
                const totalPriceElement=document.getElementById('totalPrice');
                totalPriceElement.innerText=totalPrice;
              }   
              qtyInputElement.addEventListener('keyup',(event)=>{
                const prevValue=qtyInputElement.getAttribute('prevValue') ? qtyInputElement.getAttribute('prevValue'):0;
                qtyInputElement.setAttribute('prevValue',event.target.value);
                  changeTotalValues(prevValue,event);
                })
             
              qtyInputElement.addEventListener('change',(event)=>{
                const prevValue=qtyInputElement.getAttribute('prevValue') ? qtyInputElement.getAttribute('prevValue'):0;
                qtyInputElement.setAttribute('prevValue',event.target.value);
                changeTotalValues(prevValue,event);
              })

              if (shoppingCartData.items) {
                // Loading the qty values from the shopping cart list 
                shoppingCartData.items.forEach((savedItem)=>{
                  if (savedItem.name==listItem.name) {
                    qtyInputElement.setAttribute('value',savedItem.qty);
                    // Saving the previous value for total calculation
                    qtyInputElement.setAttribute('prevValue',savedItem.qty);
                  } 
                })
              }
                
              });
              
             
            }
     
          } else {
            app.message('Error reading shoppingcart data.','error')
          }
        })
      } else {
        app.message("Error: "+statusCode+" - error loading menu data.","error");
      }
    });
  } else {
    app.message("Your email creditantial is missing.","error");
  }
};

app.loadOrderPageContent = function(){
  // Get the email from the current token
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the menu data
    var queryStringObject = {
      email
    };
    app.client.request(undefined,'api/menu','GET',queryStringObject,undefined,function(statusCode,responsePayload){
 
      if(statusCode == 200 && responsePayload){
        // Checking if the user has a saved shopping cart
        app.client.request(undefined,'api/shoppingcart','GET',queryStringObject,undefined,function(statusCode,shoppingCartData){
          const cardContainerEelement=document.querySelector("#creditCardContainer");
          const cardContainerEelementTitle=document.querySelector("#creditCardContainerTitle");


          if(statusCode==200) {
            cardContainerEelement.style="display:grid";
            cardContainerEelementTitle.style="display: grid";
            let totalQty=0;
            let totalPrice=0;
            if (shoppingCartData.items) {
              totalQty=shoppingCartData.items.reduce((prev,curr)=> {return prev+curr.qty},0);
              totalPrice=shoppingCartData.items.reduce((prev,curr)=> {return prev+(curr.price*curr.qty)},0);
            }

            const pizzaList=responsePayload.items instanceof Array ? responsePayload.items:false
            if (pizzaList) {
              const formElement=document.querySelector('form');
    
              // Buttons
              const buttonsContainer=document.createElement('div');
              buttonsContainer.style='display: flex; gap:0.5rem';
              const orderSubmitButton=document.createElement('button');
              orderSubmitButton.id='sendOrder';
              orderSubmitButton.className='buttonFirst';
              orderSubmitButton.type='submit';
              orderSubmitButton.innerText='Send your order';
    
              const hiddenInputElement=document.createElement('input');
              hiddenInputElement.type='hidden';
              hiddenInputElement.name='_method';
              formElement.appendChild(hiddenInputElement);
    
              orderSubmitButton.addEventListener('click',(event)=>{
                hiddenInputElement.value='POST';
              });
    
              buttonsContainer.appendChild(orderSubmitButton);
              formElement.appendChild(buttonsContainer);
              const tableContainerElement=document.querySelector('.scrollable-table');
    
              // Creating table
              const tableElement=document.createElement('table');
              const tHeadElement=document.createElement('thead');
              const tBodyElement=document.createElement('tbody');
              tBodyElement.className='tBodyTotalOrder';
              
              // Create header rows
              const hRowElement=document.createElement('tr');
              const hNameElement=document.createElement('th');
              hNameElement.innerText='Pizza name'
              hNameElement.className='pizzaName';
              const hPriceElement=document.createElement('th');
              hPriceElement.innerText='Price in AUD'
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
              hRowElement.appendChild(hPriceElement);
              hRowElement.appendChild(hQtyElement);

              let count=0;

              // Listing shopping cart items
              shoppingCartData.items.forEach((listItem,index) => {
                  // Create a table row
                  const rowElement = document.createElement('tr');
                  const nameElement = document.createElement('td');
                  const priceElement = document.createElement('td');
                  const qtyElement = document.createElement('td');
                  nameElement.className='pizzaName';
                  priceElement.className='pizzaPrice';
                  qtyElement.className='pizzaQty';
              
                  // Create input elements to pass data to the form
                  const emailInputElement = document.createElement('input'); // for order API to send user email
                  emailInputElement.type='hidden';
                  emailInputElement.name='user-email';
                  emailInputElement.value=app.config.sessionToken.email;
      
                  // Read only elements
                  const nameInputElement = document.createElement('input');
                  nameInputElement.type='text';
                  nameInputElement.readOnly=true;
                  nameInputElement.name='pizzaName'+'-'+listItem.name;
                  nameInputElement.className='pizza-name';
                  nameInputElement.value = listItem.name;
      
                  const priceInputElement = document.createElement('input');
                  priceInputElement.type='text';
                  priceInputElement.readOnly=true;
                  priceInputElement.value = listItem.price;
                  priceInputElement.name='pizzaPrice'+'-'+listItem.name;
                  priceInputElement.className='pizza-price';
      
                  const qtyInputElement = document.createElement('input');
                  qtyInputElement.type='number';
                  qtyInputElement.readOnly=true;
                  qtyInputElement.name='pizzaQty'+'-'+listItem.name;
                  qtyInputElement.className='pizza-qty';
                 
                  // Create table rows
                  rowElement.appendChild(emailInputElement);
                  rowElement.appendChild(nameElement);
                  nameElement.appendChild(nameInputElement)
                  rowElement.appendChild(priceElement);
                  priceElement.appendChild(priceInputElement);
                  rowElement.appendChild(qtyElement);
                  qtyElement.appendChild(qtyInputElement);
                  tBodyElement.appendChild(rowElement); 
              
                  // Create total 
                  if (count==0) {
                    count=1; // Create element just once
                    const totalContainerElement=document.createElement('div')
                    totalContainerElement.className='totalOrderContainer'
                    const totalQtyElement=document.createElement('div');
                    totalQtyElement.className='totalOrderQty';
                    totalQtyElement.id='totalQty';
                    totalQtyElement.innerText=totalQty;
                    const totalPriceElement=document.createElement('div');
                    totalPriceElement.innerText=totalPrice;
                    totalPriceElement.className='totalOrderPrice';
                    totalPriceElement.id='totalPrice';
                    const totalTitleElement=document.createElement('div');
                    totalTitleElement.innerText='Total:';
                    totalTitleElement.className='totalOrderName';
                    totalContainerElement.appendChild(totalTitleElement);  
                    totalContainerElement.appendChild(totalPriceElement);
                    totalContainerElement.appendChild(totalQtyElement);
                    tableContainerElement.appendChild(totalContainerElement);
                  }
        
                  if (shoppingCartData.items) {
                    shoppingCartData.items.forEach((savedItem)=>{
                      if (savedItem.name==listItem.name) {
                        qtyInputElement.setAttribute('value',savedItem.qty);
                      } 
                    })
                  }
              });
            }
          } else {
            // Don't display creditcard form
            cardContainerEelement.style="display:none";
            cardContainerEelementTitle.style="display: none";
            if (statusCode==404) {
              app.message('Your shopping cart is empty.','error')
            } else {
              app.message('Error reading shoppingcart data.','error')
            }

          }
        })
      } else {
        app.message("Error: "+statusCode+" - error loading menu data.","error");
      }
    });
  } else {
    app.message("Your email creditantial is missing.","error");
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
        app.message("Error: "+statusCode+" - error loading user data.","error")
      }
    });
  } else {
    app.message("Your email creditantial is missing.","error")
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
    app.message("Your email creditantial is missing.","error")
  }
};

// Call the init processes after the window loads
window.onload = function () {
  app.init();
  app.getSessionToken();
};
