
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
  method =
    typeof method == "string" &&
    ["GET", "POST", "PUT", "DELETE"].includes(method.toUpperCase())
      ? method
      : "GET";
  queryStringObject =
    typeof queryStringObject == "object" && queryStringObject !== null
      ? queryStringObject
      : {};
  payload = typeof payload == "object" && payload !== null ? payload : {};
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
    document.querySelector("form").addEventListener("submit", function (e) {
      // Stop it from submitting
      e.preventDefault();
      const formId = this.id;
      const path = this.action;
      const method = this.method.toUpperCase();

      // Hide the error message (if it's currently shown due to a previous error)
      document.querySelector("#" + formId + " .formError").style.display =
        "hidden";

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
  }
};

app.message = (messageText) => {
  let message = document.querySelector("#messageBar #messageInfo");
  message.innerText = messageText;
  setTimeout(() => {
    message.textContent = "";
  }, 1000 * 15);
};

app.errorMessage = (messageText) => {
  let errorMessage = document.querySelector("#errorBar #errorInfo");
  errorMessage.innerText = messageText;
  setTimeout(() => {
    errorMessage.textContent = "";
  }, 1000 * 15);
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
};

app.bindLogoutButton = () => {
  const logoutButton = document.querySelector("#logoutButton");
  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    app.logoutProcess();
  });
};

app.logoutProcess = () => {
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
          clearInterval(inactiveTime);
          window.location.href = "/account/logout";
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
  if (target1 && target2) {
    if (loggedIn) {
      target1.style.visibility = "hidden";
      target2.style.pointerEvents = "none";
    } else {
      target1.style.visibility = "visible";
      target2.style.pointerEvents = "auto";
    }
  }
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

  app.loadDataOnPage();
};

app.loadDataOnPage = function(){
  // Get the current page from the body class
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

  // Logic for account settings page
  if(primaryClass == 'pizzaMenu'){
    app.loadPizzaMenu();
  }
};


app.loadPizzaMenu = function(){
  // Get the phone number from the current token, or log the user out if none is there
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the user data
    var queryStringObject = {
      email
    };
    app.client.request(undefined,'api/pizzamenu','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200 && responsePayload){
        const pizzaList=responsePayload.items instanceof Array ? responsePayload.items:false
 
        if (pizzaList) {
        // Creating table
        const tableContainer=document.querySelector('.scrollable-table')
        const table=document.createElement('table');
        const tHead=document.createElement('thead');
        const tBody=document.createElement('tbody');
        
        // Create header rows
        const hRow=document.createElement('tr');
        const hName=document.createElement('th');
        hName.innerText='Name'
        hName.className='pizzaName';
        const hIngredients=document.createElement('th');
        hIngredients.innerText='Ingredients'
        hIngredients.className='pizzaIngredients';
        const hPrice=document.createElement('th');
        hPrice.innerText='Price'
        hPrice.className='pizzaPrice';

        // Creating table structure
        tableContainer.appendChild(table);
        table.appendChild(tHead);
        table.appendChild(tBody);
        tHead.appendChild(hRow);
        hRow.appendChild(hName);
        hRow.appendChild(hIngredients);
        hRow.appendChild(hPrice);
        
      
          pizzaList.forEach((item) => {
            // Create a table row
            const row = document.createElement('tr');
            const nameElement = document.createElement('td');
            const ingredientsElement = document.createElement('td');
            const priceElement = document.createElement('td');
            nameElement.textContent = item.name;
            nameElement.className='pizzaName'
            ingredientsElement.textContent = item.ingredients;
            ingredientsElement.className='pizzaIngredients'
            priceElement.textContent = item.price;
            priceElement.className='pizzaPrice'
            row.appendChild(nameElement);
            row.appendChild(ingredientsElement);
            row.appendChild(priceElement);
            row.style='background-color: tomato;';
          
       
            // const pizzaRowElement = document.querySelector('tbody');
            tBody.appendChild(row);
          });
          const tdElements=document.querySelectorAll('td')
          tdElements.forEach((td)=>{
            // td.style='padding: 2rem';
          })
        }
      } else {
        app.errorMessage("Error: "+statusCode+" - Something went wrong when communicating with the server.")
      }
    });
  } else {
    app.errorMessage("Your email creditantial is missing.")
  }
};

// Call the init processes after the window loads
window.onload = function () {
  app.init();
  app.getSessionToken();
};
