// * Frontend app. container
window.app = window.app || {};
app.inactivityTimer = null;
app.checkLoggedOutByServerTimer = null;
app.renewTokenTimer = null;

app.formatTimeStampToDate = (timestamp) => {
  const dateOfTimestamp = new Date(timestamp);
  const dateYear = dateOfTimestamp.getFullYear();
  let dateMonth = dateOfTimestamp.getMonth()+1;
  if (dateMonth.toString().length < 2) {
    dateMonth = dateMonth.toString().padStart(2, "0");
  }
  let dateDay = dateOfTimestamp.getDate();
  if (dateDay.toString().length < 2) {
    dateDay = dateDay.toString().padStart(2, "0");
  }
  const date = `${dateYear}-${dateMonth}-${dateDay}`;
  return date;
};

app.getToken = () => {
  const token = localStorage.getItem("token");
  return typeof token === "string" ? token : false;
};

app.config = {
  sessionToken: app.getToken(), // When page is reloading check the token
};

app.client = {};
app.lastInteractionTime = Date.now();
app.needsToRenewToken = true;

// * REQUEST handler
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

  // * Hidden method check for PUT and DELETE forms
  if (payload._method) {
    method = payload._method;
    delete payload._method;
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

  // * Extending requestUrl with query keys and values
  for (const key in queryStringObject) {
    if (queryStringObject.hasOwnProperty(key)) {
      counter++;
      if (counter > 1) {
        requestUrl += "&";
      }
      requestUrl += key + "=" + queryStringObject[key];
    }
  }

  // * CREATING HTTP request
  const xhr = new XMLHttpRequest();
  // * Setting up the rquest
  xhr.open(method, requestUrl, true); // true -> async request -> don't wait
  xhr.setRequestHeader("Content-Type", "application/json"); // for post requests

  // * Adding other headers if there are
  for (const headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }

  // * If there is a session token then add it to headers
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // * Setting up the request done handling
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

  // * Sending the request as we set up before
  xhr.send(payloadString);
  xhr.onerror=()=>{
    app.message('Network error occured.','error')
  };
};

// * Bind the forms: WHAT TO DO AFTER SUBMIT - CREATING form-data and FORMATTING payload according to the form
app.bindForms = function () {
  if (document.querySelector("form")) {
    var allForms = document.querySelectorAll("form");
    for (var i = 0; i < allForms.length; i++) {
      // * Assigning a function to submit event
      allForms[i].addEventListener("submit", function (e) {
        // Stop it from submitting

        e.preventDefault();
        const formId = this.id;
        const path = this.action;
        const method = this.method.toUpperCase();

        // * Turn the form inputs into a payload (form data object)
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

        // * CREATE ACCOUNT form
        if (formId == "accountCreate") {
          // Formatted payload
          payload = {
            ...payload,
            dateCreated: Date.now(), // * Extending form data with the date of signup
          };
        }

        // * CREATE ACCOUNT form
        if (formId == "accountEdit") {
          // Formatted payload
          const dateString = new Date(payload.dateCreated);
          const timeStamp = Date.parse(dateString.toString()); 
          payload = {
            ...payload,
            dateCreated: timeStamp,
          };
        }

        // * SHOPPING CART form
        if (formId == "shoppingCart") {
          // Forming the payload object according to the shopping cart API
          // Dont remove the 'hidden' methods

          if (payload._method) payload = { _method: payload._method };

          const tableBodyElement = document.querySelector(
            ".scrollable-table tbody"
          );
          const rowElements = tableBodyElement.querySelectorAll("tr");

          const pizzaOrders = [];

          rowElements.forEach((row) => {
            const nameInputElement = row.querySelector("input.pizza-name");
            const priceInputElement = row.querySelector("input.pizza-price");
            const qtyInputElement = row.querySelector("input.pizza-qty");

            if (qtyInputElement && parseInt(qtyInputElement.value) > 0) {
              const pizza = {
                name: nameInputElement.value,
                price: parseInt(priceInputElement.value),
                qty: parseInt(qtyInputElement.value),
              };
              pizzaOrders.push(pizza);
            }
          });
          const emailInputElement = document.querySelector(
            '[name="user-email"]'
          );
          // Formatted payload
          payload = {
            ...payload,
            email: emailInputElement.value,
            items: pizzaOrders,
          };
        }

        // * ORDER form
        if (formId == "order") {
          // Forming the payload object according to the order API
          // Dont remove the 'hidden' methods

          if (payload._method) payload = { _method: payload._method };

          const tableBodyElement = document.querySelector(
            ".scrollable-table tbody"
          );
          const rowElements = tableBodyElement.querySelectorAll("tr");

          const pizzaOrders = [];

          rowElements.forEach((row) => {
            const nameInputElement = row.querySelector("input.pizza-name");
            const priceInputElement = row.querySelector("input.pizza-price");
            const qtyInputElement = row.querySelector("input.pizza-qty");

            if (qtyInputElement && parseInt(qtyInputElement.value) > 0) {
              const pizza = {
                name: nameInputElement.value,
                price: parseInt(priceInputElement.value),
                qty: parseInt(qtyInputElement.value),
              };
              pizzaOrders.push(pizza);
            }
          });

          const email = document.querySelector('[name="user-email"]').value;

          const card = {
            number: document
              .querySelector("#cardNumber")
              .value.split(" ")
              .join(""),
            exp_month: parseInt(document.querySelector("#expMonth").value),
            exp_year: parseInt(document.querySelector("#expYear").value),
            cvc: document.querySelector("#cvc").value,
          };

          const currency = "AUD";

          const amount =
            parseInt(document.querySelector("#totalPrice").innerText) * 100; // convert to cents that Stripe expects
          // Formatted payload
          payload = { ...payload, email, amount, currency, card };
        }

        // * Call the appropriate API with the formatted payload
        const modifiedPayload = { ...payload };
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

              app.message(error, "error");
            } else {
              // * If the request SUCCESSFUL, send to FORM RESPONSE PROCESSOR
              app.formResponseProcessor(formId, payload, responsePayload);
            }
          }
        );
      });
    }
  }
};

// * FORM RESPONSE PROCESSOR
app.formResponseProcessor = function (formId, requestPayload, responsePayload) {
  const functionToCall = false;

  if (formId == "accountCreate") {
    // * Take the email and password, and use it to log the user in (create a token)
    const newPayload = {
      email: requestPayload.email,
      password: requestPayload.password,
    };

    // * Create a new token
    app.client.request(
      undefined,
      "api/tokens",
      "POST",
      undefined,
      newPayload,
      function (newStatusCode, newResponsePayload) {
        if (newStatusCode !== 200) {
          app.message(
            "Sorry, an error has occured. Please try again.",
            "error"
          );
        } else {
          // * If successful, set the token in the local storage and redirect the user
          app.setSessionToken(newResponsePayload);
          app.message(
            "You have signed up successfully.",
            "info",
            "/action/menulist"
          );
        }
      }
    );
  }

  // * MESSAGES to the user, REDIRECTS and actions according to the FORM
  if (formId == "login") {
    // * Login process
    app.setSessionToken(responsePayload);
    startInactivityTimer();
    startCheckLoggedOutByServerTimer();
    startRenewTokenTimer();
    localStorage.setItem("timersStarted", "true");
    const currentDate = new Date();
    console.log(
      `User logged in ${currentDate.getDate()}.${
        currentDate.getMonth() + 1
      }.${currentDate.getFullYear()} at ${currentDate.getHours()}:${currentDate.getMinutes()}`
    );
    app.message("You have logged in successfully.", "info", "/action/menulist");
  }

  if (formId == "accountEdit")
    app.message("Account updated successfully.", "info", "/");

  if (formId == "accountDelete") {
    app.message(
      "Your account will be deleted.",
      "info",
      "/account/delete",
      () => {
        app.logoutProcess();
      }
    );
  }

  if (formId == "shoppingCart") {
    const redirect = "/action/shoppingcart";
    if (requestPayload._method == "POST")
      app.message(
        "Your shopping cart is created. You can send your order now.",
        "info",
        redirect
      );
    if (requestPayload._method == "PUT")
      app.message(
        "Your shopping cart is updated. You can send your order now.",
        "info",
        redirect
      );
    if (requestPayload._method == "DELETE")
      app.message("Your shopping cart is deleted.", "info", redirect);
  }

  if (formId == "order") {
    app.message(
      "Your orders is succesfully accepted. We sent you a confirmation emai about Thank you.",
      "info",
      "/"
    );
  }
};

// * INFO or ERROR MESSAGE for the user
app.message = (
  messageText,
  type,
  redirect = "",
  messageCallback = () => {}
) => {
  const messageModalElement = document.querySelector("#messageModal");
  const hasButton = document.querySelector("#messageModal button");

  if (hasButton) return;
  const buttonElement = document.createElement("button");
  buttonElement.className = "buttonPrimary";
  buttonElement.innerText = "Continue";
  messageModalElement.appendChild(buttonElement);

  let message = document.querySelector("#messageModal #messageInfo");
  message.innerText = messageText;

  if (type == "error") {
    messageModalElement.setAttribute("class", "errorModal");
  } else {
    messageModalElement.setAttribute("class", "messageModal");
  }

  buttonElement.addEventListener("click", (event) => {
    messageModalElement.removeAttribute("class");
    message.innerText = "";
    buttonElement.remove();

    if (redirect) {
      window.location.href = redirect;
    }
  });
  messageCallback();
};

// * LOGOUT BUTTON controll
app.bindLogoutButton = () => {
  const logoutButton = document.querySelector("#logoutButton");
  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    app.logoutProcess();
  });
};

// * HAMBURGER MENU controll
app.bindHamburgerIcon = () => {
  const hamburgerIcon = document.querySelector("#hamburgerIcon");
  let open = false;
  hamburgerIcon.addEventListener(["click"], (event) => {
    event.preventDefault();
    const navElement = document.querySelector("nav");
    open = open ? false : true;
    if (open) {
      navElement.style = "display:flex";
    } else {
      navElement.style = "display:none";
    }
  });

  hamburgerIcon.addEventListener(["resize"], (event) => {
    event.preventDefault();
    const navElement = document.querySelector("nav");
    const viewportWidth = window.innerWidth;
    if (viewportWidth >= 600) {
      navElement.style = "display:flex";
    }
  });
};

app.logoutSteps = () => {
  // * Logout and clear unnecessary data and functions
  app.deleteSessionToken();
  app.setLoggedInClass(false);
  stopTimers();
  localStorage.removeItem("timersStarted");
};

// * LOGOUT the user
app.logoutProcess = (logoutByServer = false) => {
  const currentDate = new Date();
  console.log(
    `Logout process started in: ${currentDate.getDate()}.${
      currentDate.getMonth() + 1
    }.${currentDate.getFullYear()} at ${currentDate.getHours()}:${currentDate.getMinutes()}`
  );

  if (logoutByServer) {
    app.message(
      "You have logged out by the server, because your token is expired.",
      "info",
      "/account/login",
      () => {
        app.logoutSteps();
      }
    );
  } else {
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
          if (statusCode !== 200 && statusCode !== 201) {
            // Try to get the error from the api, or set a default error message
            var error =
              typeof responsePayload.Error == "string"
                ? responsePayload.Error
                : "Error during API request.";
            app.message(error, "error");
          } else {
            app.message("You logged out.", "info", "/account/login", () => {
              app.logoutSteps();
            });
          }
        }
      );
    } else {
      app.message("Error occured. Could not logout.", "error");
    }
  }
};

// * Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function (loggedIn) {
  let target1 = document.querySelector(".showHide");
  let target2 = document.querySelector(".switchDisabled a");
  let hideWhenLogout = document.querySelector(".hideWhenLogout");

  if (loggedIn) {
    if (target1) target1.style.visibility = "hidden";
    if (target2) target2.style.pointerEvents = "none";
    if (hideWhenLogout) hideWhenLogout.style.visibility = "visible";
  } else {
    if (target1) target1.style.visibility = "visible";
    if (target2) target2.style.pointerEvents = "auto";
    if (hideWhenLogout) hideWhenLogout.style.visibility = "hidden";
  }
};

// * GET the session TOKEN from localstorage and set it in the app.config object
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

// * SET the session TOKEN in the app.config object as well as localstorage
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

// * Renew the token
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
    // * Update the token with a new expiration
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
          app.message(responsePayload["Error"], "error");
          callback(true);
        }
      }
    );
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// * Renew token timer
const startRenewTokenTimer = () => {
  // * Renew token before expiration
  const renewTokenBeforeExpirationMinute = 1;
  if (!app.renewTokenTimer) {
    app.renewTokenTimer = setInterval(function () {
      if (app.config.sessionToken) {
        const currentTime = Date.now();
        if (
          currentTime >
          app.config.sessionToken.expires -
            renewTokenBeforeExpirationMinute * 10000
        ) {
          app.renewToken(function (err) {
            if (err) {
              console.log("Error occured during token renew.");
            } else {
              const currentDate = new Date();
              console.log(
                `Token is renewed ${currentDate.getDate()}.${
                  currentDate.getMonth() + 1
                }.${currentDate.getFullYear()} at ${currentDate.getHours()}:${currentDate.getMinutes()}`
              );
            }
          });
        }
      }
    }, 1000 * 10);
  }
};

// * Start the inactivity timer
const startInactivityTimer = () => {
  if (!app.inactivityTimer) {
    // * If timer is not running yet then start it
    app.inactivityTimer = setInterval(() => {
      const now = Date.now();
      const minutesInactive = (now - app.lastInteractionTime) / 1000 / 60;
      if (minutesInactive >= 10) {
        app.message(
          "You are inactive over 10 minutes. Logout is started.",
          "info",
          "/account/login",
          (param) => {
            app.logoutProcess();
          }
        );
      }
    }, 1000 * 30);
  }
};

// * Start to check if the user is logged out by the server
const startCheckLoggedOutByServerTimer = () => {
  if (!app.checkLoggedOutByServerTimer) {
    // * If timer is not running yet then start it
    app.checkLoggedOutByServerTimer = setInterval(() => {
      if (app.config.sessionToken) {
        const email =
          typeof app.config.sessionToken.email == "string"
            ? app.config.sessionToken.email
            : false;

        if (email) {
          const queryStringObject = {
            email,
          };
          app.client.request(
            undefined,
            "api/logoutcheck",
            "GET",
            queryStringObject,
            undefined,
            function (statusCode, responsePayload) {
              if (statusCode == 404) {
                app.logoutProcess(true);
              } else {
                if (statusCode != 200) {
                  console.log(
                    statusCode,
                    "Error during logout cheking " + responsePayload["Error"]
                  );
                }
              }
            }
          );
        }
      }
    }, 1000 * 1);
  }
};

const stopTimers = () => {
  if (app.inactivityTimer) {
    clearInterval(app.checkLoggedOutByServerTimer);
    app.checkLoggedOutByServerTimer = null;
    clearInterval(app.inactivityTimer);
    app.inactivityTimer = null;
    clearInterval(app.renewTokenTimer);
    app.renewTokenTimer = null;
  }
};

app.init = function () {
  const menuLinksH = document.querySelectorAll(".menuLink a");
  const currentPath = window.location.pathname;

  // * Change the appearance of the active link
  Array.from(menuLinksH).forEach((link) => {
    if (
      link.getAttribute("href") === currentPath ||
      (link.getAttribute("id") === "logoutButton" &&
        currentPath == "/account/logout")
    ) {
      link.classList.add("active");
    }
  });

  // * Bind all form submissions
  app.bindForms();
  app.bindLogoutButton();
  app.bindHamburgerIcon();

  // * Get the token from localstorage
  app.getSessionToken();

  // * Check user interaction
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

app.loadDataOnPage = function () {
  // * Get the current page according to the body class
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof bodyClasses[0] == "string" ? bodyClasses[0] : false;

  // Logic for loading menu list page
  if (primaryClass == "menuList") {
    app.loadMenuListPageContent();
  }

  // Logic for loading shoppingcart page
  if (primaryClass == "shoppingCart") {
    app.loadShoppingCartPageContent();
  }

  // Logic for loading order page
  if (primaryClass == "order") {
    app.loadOrderPageContent();
  }

  // Logic for loading account edit page
  if (primaryClass == "accountEdit") {
    app.loadAccountEditPageContent();
  }

  if (primaryClass == "accountDelete") {
    app.loadAccountDeletePageContent();
  }
};

// * Loading MENU LIST page content
app.loadMenuListPageContent = function () {
  // Get the email
  var email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  if (email) {
    // * Fetch the menu data
    var queryStringObject = {
      email,
    };
    app.client.request(
      undefined,
      "api/menu",
      "GET",
      queryStringObject,
      undefined,
      function (statusCode, responsePayload) {
        if (statusCode == 200 && responsePayload) {
          const pizzaList =
            responsePayload.items instanceof Array
              ? responsePayload.items
              : false;

          if (pizzaList) {
            // * Creating table
            const tableContainerElement =
              document.querySelector(".scrollable-table");
            const tableElement = document.createElement("table");
            const tColGroupElement = document.createElement("colGroup");
            const tHeadElement = document.createElement("thead");
            const tBodyElement = document.createElement("tbody");

            // * Create header rows
            const hRowElement = document.createElement("tr");
            const hNameElement = document.createElement("th");
            hNameElement.innerText = "Pizza name";

            const hIngredientsElement = document.createElement("th");
            hIngredientsElement.innerText = "Ingredients";

            const hPriceElement = document.createElement("th");
            hPriceElement.innerText = "Price in AUD";

            // * Creating table structure
            tableContainerElement.appendChild(tableElement);
            tableElement.appendChild(tColGroupElement);
            tableElement.appendChild(tHeadElement);
            tableElement.appendChild(tBodyElement);
            tHeadElement.appendChild(hRowElement);
            hRowElement.appendChild(hNameElement);
            hRowElement.appendChild(hIngredientsElement);
            hRowElement.appendChild(hPriceElement);

            // * Creating colGroup elements to provide consistent column style
            const colName = document.createElement("col");
            const colIngredients = document.createElement("col");
            const colPrice = document.createElement("col");
            tColGroupElement.appendChild(colName);
            tColGroupElement.appendChild(colIngredients);
            tColGroupElement.appendChild(colPrice);
            colName.className = "cartName";
            colIngredients.className = "cartIngredients";
            colPrice.className = "cartPrice";

            pizzaList.forEach((item) => {
              // * Create a table row
              const rowElement = document.createElement("tr");
              const nameElement = document.createElement("td");
              const ingredientsElement = document.createElement("td");
              const priceElement = document.createElement("td");
              nameElement.className = "pizza-name textWrap";
              nameElement.textContent = item.name;
              ingredientsElement.textContent = item.ingredients;
              ingredientsElement.className = "text-wrap";
              priceElement.textContent = item.price;
              priceElement.className = "pizza-price";

              rowElement.appendChild(nameElement);
              rowElement.appendChild(ingredientsElement);
              rowElement.appendChild(priceElement);
              tBodyElement.appendChild(rowElement);
            });
          }
        } else {
          app.message(
            "Error: " +
              statusCode +
              " - Something went wrong. Maybe you are logged out by the server.",
            "error"
          );
        }
      }
    );
  } else {
    app.message("You are not logged in.", "error");
  }
};

// * Loading SHOPPING CART PAGE content
app.loadShoppingCartPageContent = function () {
  // Get the email from the current token
  var email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  if (email) {
    var queryStringObject = {
      email,
    };
    // * Fetch the menu list data
    app.client.request(
      undefined,
      "api/menu",
      "GET",
      queryStringObject,
      undefined,
      function (statusCode, responsePayload) {
        if (statusCode == 200 && responsePayload) {
          // * Checking if the user has a saved shopping cart
          app.client.request(
            undefined,
            "api/shoppingcart",
            "GET",
            queryStringObject,
            undefined,
            function (statusCode, shoppingCartData) {
              if (statusCode == 200 || statusCode == 404) {
                let totalQty = 0;
                let totalPrice = 0;
                if (shoppingCartData.items) {
                  totalQty = shoppingCartData.items.reduce((prev, curr) => {
                    return prev + curr.qty;
                  }, 0);
                  totalPrice = shoppingCartData.items.reduce((prev, curr) => {
                    return prev + curr.price * curr.qty;
                  }, 0);
                }
                const pizzaList =
                  responsePayload.items instanceof Array
                    ? responsePayload.items
                    : false;
                if (pizzaList) {
                  const wrapperElement = document.querySelector("main");
                  const formElement = document.querySelector("form");

                  // * Creating BUTTONS
                  const buttonsContainer = document.createElement("div");
                  buttonsContainer.className = "buttonsContainer";
                  const createShoppingCartSubmitButton =
                    document.createElement("button");
                  createShoppingCartSubmitButton.id = "createCart";
                  createShoppingCartSubmitButton.className =
                    totalQty == 0 ? "buttonPrimary" : "buttonSecondary";
                  createShoppingCartSubmitButton.type = "submit";
                  createShoppingCartSubmitButton.innerText = "Create";
                  createShoppingCartSubmitButton.setAttribute(
                    "form",
                    "shoppingCart"
                  );
                  const updateShoppingCartSubmitButton =
                    document.createElement("button");
                  updateShoppingCartSubmitButton.id = "updateCart";
                  updateShoppingCartSubmitButton.className =
                    totalQty !== 0 ? "buttonPrimary" : "buttonSecondary";
                  updateShoppingCartSubmitButton.type = "submit";
                  updateShoppingCartSubmitButton.setAttribute(
                    "form",
                    "shoppingCart"
                  );
                  updateShoppingCartSubmitButton.innerText = "Update";

                  const deleteShoppingCartSubmitButton =
                    document.createElement("button");
                  deleteShoppingCartSubmitButton.id = "deleteCart";
                  deleteShoppingCartSubmitButton.className =
                    totalQty !== 0 ? "buttonPrimary" : "buttonSecondary";
                  deleteShoppingCartSubmitButton.type = "submit";
                  deleteShoppingCartSubmitButton.innerText = "Delete";
                  deleteShoppingCartSubmitButton.setAttribute(
                    "form",
                    "shoppingCart"
                  );

                  // * Handling BUTTONS with hidden input
                  const hiddenInputElement = document.createElement("input");
                  hiddenInputElement.type = "hidden";
                  hiddenInputElement.name = "_method";
                  formElement.appendChild(hiddenInputElement);

                  createShoppingCartSubmitButton.addEventListener(
                    "click",
                    (event) => {
                      hiddenInputElement.value = "POST";
                    }
                  );

                  updateShoppingCartSubmitButton.addEventListener(
                    "click",
                    (event) => {
                      hiddenInputElement.value = "PUT";
                    }
                  );

                  deleteShoppingCartSubmitButton.addEventListener(
                    "click",
                    (event) => {
                      hiddenInputElement.value = "DELETE";
                    }
                  );

                  // * Creating table elements
                  const tableContainerElement =
                    document.querySelector(".scrollable-table");
                  const tableElement = document.createElement("table");
                  const tColGroupElement = document.createElement("colGroup");
                  const tHeadElement = document.createElement("thead");
                  const tBodyElement = document.createElement("tbody");
                  const tFootElement = document.createElement("tfoot");

                  // * Create head columns
                  const hRowElement = document.createElement("tr");
                  const hNameElement = document.createElement("th");
                  hNameElement.innerText = "Pizza name";
                  const hIngredientsElement = document.createElement("th");
                  hIngredientsElement.innerText = "Ingredients";
                  const hPriceElement = document.createElement("th");
                  hPriceElement.innerText = "Price in AUD";
                  const hQtyElement = document.createElement("th");
                  hQtyElement.innerText = "Qty";

                  // * Creating table structure
                  tableContainerElement.appendChild(tableElement);
                  tableElement.appendChild(tColGroupElement);
                  tableElement.appendChild(tHeadElement);
                  tableElement.appendChild(tBodyElement);
                  tableElement.appendChild(tFootElement);

                  // * Adding buttons
                  buttonsContainer.appendChild(createShoppingCartSubmitButton);
                  buttonsContainer.appendChild(updateShoppingCartSubmitButton);
                  buttonsContainer.appendChild(deleteShoppingCartSubmitButton);
                  wrapperElement.appendChild(buttonsContainer);

                  // * Creating colGroup elements to provide consistent column style
                  const colName = document.createElement("col");
                  const colIngredients = document.createElement("col");
                  const colPrice = document.createElement("col");
                  const colQty = document.createElement("col");
                  tColGroupElement.appendChild(colName);
                  tColGroupElement.appendChild(colIngredients);
                  tColGroupElement.appendChild(colPrice);
                  tColGroupElement.appendChild(colQty);
                  colName.className = "cartName";
                  colIngredients.className = "cartIngredients";
                  colPrice.className = "cartPrice";
                  colQty.className = "cartQty";

                  // * Adding row elements to the head
                  tHeadElement.appendChild(hRowElement);
                  hRowElement.appendChild(hNameElement);
                  hRowElement.appendChild(hIngredientsElement);
                  hRowElement.appendChild(hPriceElement);
                  hRowElement.appendChild(hQtyElement);

                  let count = 0;

                  // * Get the pizza list from the menu and extend it with the user's shopping cart quantities if have
                  pizzaList.forEach((listItem, index) => {
                    // * Create a table row element
                    const rowElement = document.createElement("tr");
                    const nameElement = document.createElement("td");
                    const ingredientsElement = document.createElement("td");
                    const priceElement = document.createElement("td");
                    const qtyElement = document.createElement("td");

                    ingredientsElement.textContent = listItem.ingredients;

                    // * Create hidden email input element to pass user email to the API
                    const emailInputElement = document.createElement("input");
                    emailInputElement.type = "hidden";
                    emailInputElement.name = "user-email";
                    emailInputElement.value = app.config.sessionToken.email;

                    // * Read only input API required elements / input element is necessary to send data to the API
                    const nameInputElement = document.createElement("input");
                    nameInputElement.type = "text";
                    nameInputElement.readOnly = true;
                    nameInputElement.name = "pizzaName" + "-" + listItem.name;
                    nameInputElement.className = "pizza-name textWrap";
                    nameInputElement.value = listItem.name;
                    nameInputElement.type = "hidden"; // * Hidden because of the issue below

                    // * I have created this cell because I could not fix the issue to wrap long text in the input element. This cell just displays the pizza name
                    const nameCellElement = document.createElement("div");
                    nameCellElement.type = "text";
                    nameCellElement.name = "pizzaName" + "-" + listItem.name;
                    nameCellElement.className = "pizza-name textWrap";
                    nameCellElement.innerText = listItem.name;

                    const priceInputElement = document.createElement("input");
                    priceInputElement.type = "text";
                    priceInputElement.readOnly = true;
                    priceInputElement.value = listItem.price;
                    priceInputElement.name = "pizzaPrice" + "-" + listItem.name;
                    priceInputElement.className = "pizza-price";

                    ingredientsElement.className = "pizza-ingredients";

                    // * QTY - Creating shoppin cart qty input - loading with values later
                    const qtyInputElement = document.createElement("input");
                    qtyInputElement.type = "number";
                    qtyInputElement.readOnly = false;
                    qtyInputElement.name = "pizzaQty" + "-" + listItem.name;
                    qtyInputElement.className = "pizza-qty";
                    qtyInputElement.placeholder = "0";
                    qtyInputElement.min = 0;
                    qtyInputElement.step = 1;
                    qtyInputElement.max = 5;
                    rowElement.setAttribute("data-index", index);

                    // * Create table rows
                    rowElement.appendChild(emailInputElement);
                    rowElement.appendChild(nameElement);
                    nameElement.appendChild(nameInputElement);
                    nameElement.appendChild(nameCellElement);
                    rowElement.appendChild(ingredientsElement);
                    rowElement.appendChild(priceElement);
                    priceElement.appendChild(priceInputElement);
                    rowElement.appendChild(qtyElement);
                    qtyElement.appendChild(qtyInputElement);
                    tBodyElement.appendChild(rowElement);

                    // * Create total elements as tablefoot
                    if (count == 0) {
                      count = 1; // Create element just once
                      const totalRowElement = document.createElement("tr");
                      totalRowElement.className = "totalContainer";
                      tFootElement.appendChild(totalRowElement);

                      const totalQtyElement = document.createElement("td");
                      totalQtyElement.id = "totalQty";
                      totalQtyElement.innerText = totalQty;

                      const totalPriceElement = document.createElement("td");
                      totalPriceElement.innerText = totalPrice;
                      totalPriceElement.id = "totalPrice";

                      const totalNameElement = document.createElement("td");
                      totalNameElement.innerText = "Total";
                      totalNameElement.id = "totalName";

                      const totalIngredientsElement =
                        document.createElement("td");
                      totalIngredientsElement.innerText = "";

                      totalRowElement.appendChild(totalNameElement);
                      totalRowElement.appendChild(totalIngredientsElement);
                      totalRowElement.appendChild(totalPriceElement);
                      totalRowElement.appendChild(totalQtyElement);
                      tFootElement.appendChild(totalRowElement);
                    }

                    // * Calculating total qty and total price;
                    const changeTotalValues = (prevValue, event) => {
                      const currValue = event.target.value
                        ? event.target.value
                        : "0";
                      totalQty =
                        totalQty - parseInt(prevValue) + parseInt(currValue);
                      const currentItem = pizzaList.find(
                        (item) => item.name == nameInputElement.value
                      );
                      totalPrice =
                        totalPrice -
                        parseInt(prevValue) * currentItem.price +
                        parseInt(currValue) * currentItem.price;
                      // * Place total values in total row
                      const totalQtyElement =
                        document.getElementById("totalQty");
                      totalQtyElement.innerText = totalQty;
                      const totalPriceElement =
                        document.getElementById("totalPrice");
                      totalPriceElement.innerText = totalPrice;
                    };

                    // * Checking of change of the quantity
                    qtyInputElement.addEventListener("keyup", (event) => {
                      const prevValue = qtyInputElement.getAttribute(
                        "prevValue"
                      )
                        ? qtyInputElement.getAttribute("prevValue")
                        : 0;
                      qtyInputElement.setAttribute(
                        "prevValue",
                        event.target.value
                      );
                      changeTotalValues(prevValue, event);
                    });

                    qtyInputElement.addEventListener("change", (event) => {
                      const prevValue = qtyInputElement.getAttribute(
                        "prevValue"
                      )
                        ? qtyInputElement.getAttribute("prevValue")
                        : 0;

                      qtyInputElement.setAttribute(
                        "prevValue",
                        event.target.value
                      );
                      changeTotalValues(prevValue, event);
                    });

                    if (shoppingCartData.items) {
                      // * Loading the quantity values from the user's shopping cart list

                      shoppingCartData.items.forEach((savedItem) => {
                        if (savedItem.name == listItem.name) {
                          qtyInputElement.setAttribute("value", savedItem.qty);
                          // * Saving the previous value for total calculation
                          qtyInputElement.setAttribute(
                            "prevValue",
                            savedItem.qty
                          );
                        }
                      });
                    }
                  });
                }
              } else {
                app.message("Error reading shoppingcart data.", "error");
              }
            }
          );
        } else {
          app.message(
            "Error: " + statusCode + " - error loading menu data.",
            "error"
          );
        }
      }
    );
  } else {
    app.message("Your are not logged in.", "error");
  }
};

// * Loading ORDER PAGE content
app.loadOrderPageContent = function () {
  // Get the email from the current token
  var email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  if (email) {
    // * Fetch the menu data
    var queryStringObject = {
      email,
    };
    app.client.request(
      undefined,
      "api/menu",
      "GET",
      queryStringObject,
      undefined,
      function (statusCode, responsePayload) {
        if (statusCode == 200 && responsePayload) {
          // * Checking if the user has a saved shopping cart
          app.client.request(
            undefined,
            "api/shoppingcart",
            "GET",
            queryStringObject,
            undefined,
            function (statusCode, shoppingCartData) {
              const cardContainerEelement = document.querySelector(
                "#creditCardContainer"
              );
              const cardContainerEelementTitle = document.querySelector(
                "#creditCardContainerTitle"
              );

              if (statusCode == 200) {
                cardContainerEelement.style = "display:grid";
                cardContainerEelementTitle.style = "display: grid";
                let totalQty = 0;
                let totalPrice = 0;
                if (shoppingCartData.items) {
                  totalQty = shoppingCartData.items.reduce((prev, curr) => {
                    return prev + curr.qty;
                  }, 0);
                  totalPrice = shoppingCartData.items.reduce((prev, curr) => {
                    return prev + curr.price * curr.qty;
                  }, 0);
                }

                const pizzaList =
                  responsePayload.items instanceof Array
                    ? responsePayload.items
                    : false;
                if (pizzaList) {
                  const orderWrapperElement =
                    document.querySelector("#orderWrapper");

                  // * Creating buttons
                  const buttonsContainer = document.createElement("div");
                  buttonsContainer.style = "display: flex; gap:0.5rem";
                  const orderSubmitButton = document.createElement("button");
                  orderSubmitButton.id = "sendOrder";
                  orderSubmitButton.className = "buttonPrimary";
                  orderSubmitButton.type = "submit";
                  orderSubmitButton.innerText = "Send your order";

                  const hiddenInputElement = document.createElement("input");
                  hiddenInputElement.type = "hidden";
                  hiddenInputElement.name = "_method";
                  orderWrapperElement.appendChild(hiddenInputElement);

                  orderSubmitButton.addEventListener("click", (event) => {
                    hiddenInputElement.value = "POST";
                  });

                  buttonsContainer.appendChild(orderSubmitButton);
                  orderWrapperElement.appendChild(buttonsContainer);
                  const tableContainerElement =
                    document.querySelector(".scrollable-table");

                  // * Creating table elements
                  const tColGroupElement = document.createElement("colGroup");
                  const tableElement = document.createElement("table");
                  const tHeadElement = document.createElement("thead");
                  const tBodyElement = document.createElement("tbody");
                  tBodyElement.className = "tBodyTotalOrder";
                  const tFootElement = document.createElement("tfoot");

                  // * Creating header rows
                  const hRowElement = document.createElement("tr");
                  const hNameElement = document.createElement("th");
                  hNameElement.innerText = "Pizza name";
                  hNameElement.className = "pizzaName";
                  const hPriceElement = document.createElement("th");
                  hPriceElement.innerText = "Price in AUD";
                  hPriceElement.className = "pizzaPrice";

                  // * Extending the table with quantity column
                  const hQtyElement = document.createElement("th");
                  hQtyElement.innerText = "Qty";
                  hQtyElement.className = "pizzaQty";

                  // * Creating table structure
                  tableContainerElement.appendChild(tableElement);
                  tableElement.appendChild(tColGroupElement);
                  tableElement.appendChild(tHeadElement);
                  tableElement.appendChild(tBodyElement);
                  tHeadElement.appendChild(hRowElement);
                  hRowElement.appendChild(hNameElement);
                  hRowElement.appendChild(hPriceElement);
                  hRowElement.appendChild(hQtyElement);
                  tableElement.appendChild(tFootElement);

                  // * Creating colGroup elements to provide consistent column style
                  const colName = document.createElement("col");
                  const colPrice = document.createElement("col");
                  const colQty = document.createElement("col");
                  tColGroupElement.appendChild(colName);
                  tColGroupElement.appendChild(colPrice);
                  tColGroupElement.appendChild(colQty);
                  colName.className = "cartName";
                  colPrice.className = "cartPrice";
                  colQty.className = "cartQty";

                  let count = 0;

                  // * Listing shopping cart items
                  shoppingCartData.items.forEach((listItem, index) => {
                    // * Creating a table rows
                    const rowElement = document.createElement("tr");
                    const nameElement = document.createElement("td");
                    const priceElement = document.createElement("td");
                    const qtyElement = document.createElement("td");
                    nameElement.className = "pizza-name";
                    priceElement.className = "pizza-price";
                    qtyElement.className = "pizza-qty";

                    // * Creating input elements to pass data to the form
                    const emailInputElement = document.createElement("input"); // for order API to send user email
                    emailInputElement.type = "hidden";
                    emailInputElement.name = "user-email";
                    emailInputElement.value = app.config.sessionToken.email;

                    // * Read only elements
                    const nameInputElement = document.createElement("input");
                    nameInputElement.type = "text";
                    nameInputElement.readOnly = true;
                    nameInputElement.name = "pizzaName" + "-" + listItem.name;
                    nameInputElement.className = "pizza-name";
                    nameInputElement.value = listItem.name;

                    const priceInputElement = document.createElement("input");
                    priceInputElement.type = "text";
                    priceInputElement.readOnly = true;
                    priceInputElement.value = listItem.price;
                    priceInputElement.name = "pizzaPrice" + "-" + listItem.name;
                    priceInputElement.className = "pizza-price";

                    const qtyInputElement = document.createElement("input");
                    qtyInputElement.type = "number";
                    qtyInputElement.readOnly = true;
                    qtyInputElement.name = "pizzaQty" + "-" + listItem.name;
                    qtyInputElement.className = "pizza-qty";

                    // * Creating table rows
                    rowElement.appendChild(emailInputElement);
                    rowElement.appendChild(nameElement);
                    nameElement.appendChild(nameInputElement);
                    rowElement.appendChild(priceElement);
                    priceElement.appendChild(priceInputElement);
                    rowElement.appendChild(qtyElement);
                    qtyElement.appendChild(qtyInputElement);
                    tBodyElement.appendChild(rowElement);

                    // * Creating total
                    if (count == 0) {
                      count = 1; // Create element just once
                      const totalRowElement = document.createElement("tr");
                      totalRowElement.className = "totalContainer";
                      tFootElement.appendChild(totalRowElement);

                      const totalQtyElement = document.createElement("td");
                      totalQtyElement.id = "totalQty";
                      totalQtyElement.innerText = totalQty;

                      const totalPriceElement = document.createElement("td");
                      totalPriceElement.innerText = totalPrice;
                      totalPriceElement.id = "totalPrice";

                      const totalNameElement = document.createElement("td");
                      totalNameElement.innerText = "Total";
                      totalNameElement.id = "totalName";

                      totalRowElement.appendChild(totalNameElement);
                      totalRowElement.appendChild(totalPriceElement);
                      totalRowElement.appendChild(totalQtyElement);
                      tFootElement.appendChild(totalRowElement);
                    }

                    if (shoppingCartData.items) {
                      shoppingCartData.items.forEach((savedItem) => {
                        if (savedItem.name == listItem.name) {
                          qtyInputElement.setAttribute("value", savedItem.qty);
                        }
                      });
                    }
                  });
                }
              } else {
                // * Don't display creditcard form
                cardContainerEelement.style = "display:none";
                cardContainerEelementTitle.style = "display: none";
                if (statusCode == 404) {
                  app.message("Your shopping cart is empty.", "error");
                } else {
                  app.message("Error reading shoppingcart data.", "error");
                }
              }
            }
          );
        } else {
          app.message(
            "Error: " + statusCode + " - error loading menu data.",
            "error"
          );
        }
      }
    );
  } else {
    app.message("You are not logged in.", "error");
  }
};

// * Loading ACCOUNT EDIT PAGE content
app.loadAccountEditPageContent = function () {
  var email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  if (email) {
    // * Fetch the menu data
    var queryStringObject = {
      email,
    };
    app.client.request(
      undefined,
      "api/users",
      "GET",
      queryStringObject,
      undefined,
      function (statusCode, responsePayload) {
        if (statusCode == 200 && responsePayload) {
          const userAccountData = responsePayload ? responsePayload : false;
          if (userAccountData) {
            // * Grabbing form elements
            const firstNameInputElement = document.querySelector(
              '#accountEdit [name="firstName"]'
            );
            const lasttNameInputElement = document.querySelector(
              '#accountEdit [name="lastName"]'
            );
            const streetInputElement = document.querySelector(
              '#accountEdit [name="street"]'
            );
            const emailInputElementEdit = document.querySelector(
              '#accountEdit [name="email"]'
            );
            const emailInputElementDelete = document.querySelector(
              '#accountDelete [name="email"]'
            );
            const passwordInputElement = document.querySelector(
              '#accountEdit [name="password"]'
            );
            const dateCreatedInputElement = document.querySelector(
              '#accountEdit [name="dateCreated"]'
            );
            firstNameInputElement.value = userAccountData.firstName;
            lasttNameInputElement.value = userAccountData.lastName;
            emailInputElementEdit.value = email;
            emailInputElementDelete.value = email;
            streetInputElement.value = userAccountData.street;
            passwordInputElement.value = ""; // * If user don't change his password it will remain empty
            const dateOfSignup = app.formatTimeStampToDate(
              userAccountData.dateCreated
            );
            dateCreatedInputElement.value = dateOfSignup;
            dateCreatedInputElement.setAttribute("disabled", true);

            // * Placing the hidden method to the form to handle the PUT request
            const hiddenInputElement = document.createElement("input");
            hiddenInputElement.type = "hidden";
            hiddenInputElement.name = "_method";
            hiddenInputElement.value = "PUT";
            const formElement = document.querySelector("#accountEdit");
            formElement.appendChild(hiddenInputElement);
          }
        } else {
          app.message(
            "Error: " + statusCode + " - error loading user data.",
            "error"
          );
        }
      }
    );
  } else {
    app.message("You are not logged in.", "error");
  }
};

// * Loading ACCOUNT DELETE PAGE content
app.loadAccountDeletePageContent = function () {
  var email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  if (email) {
    // * Fetch the user data
    var queryStringObject = {
      email,
    };

    const emailInputElement = document.querySelector(
      '#accountDelete [name="email"]'
    );
    emailInputElement.value = email;
    // * Placing the hidden method to the form to handle the PUT request
    const hiddenInputElement = document.createElement("input");
    hiddenInputElement.type = "hidden";
    hiddenInputElement.name = "_method";
    hiddenInputElement.value = "DELETE";
    const formElement = document.querySelector("#accountDelete");
    formElement.appendChild(hiddenInputElement);
  } else {
    app.message("You are not logged in.", "error");
  }
};

// * Call the init processes after the window loads
window.onload = function () {
  const isTimersStarted = localStorage.getItem("timersStarted") === "true";
  if (isTimersStarted && app.config.sessionToken) {
    // *Timers were active in a previous session, starting now (onload).
    startInactivityTimer();
    startCheckLoggedOutByServerTimer();
    startRenewTokenTimer();
  }
  app.init();
  app.getSessionToken();
};
