import {
  isValidEmail,
  isValidUserData,
  hash,
  isAcceptableMethod,
  isValidToken,
  createRandomString,
  isValidNotExpiredToken,
  anyNotAvailableItems,
  isValidCard,
  sendEmailMessage,
  summarizeOrderItems,
  formatMessage,
  getTemplate,
  addUniversalTemplates,
  getStaticAsset,
  isValidUserDataForModification,
  isValidPassword
} from "./helpers.js";
import { dataUtil } from "./dataUtils.js";
import { pizzaMenuList } from "../data/menu/menu.js";
import Stripe from "stripe";

import dotenv from "dotenv";
dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: "2025-02-24.acacia",
});

export const handlers = {};

// * FRONTEND HANDLERS FOR HTML **************

handlers.index = (data, callback) => {
  // Index page specific variables
  const templateVariables = {
    "head.title": "Pizza Order Application",
    "head.description": "Order your favourite pizzaa 0-24h on the Gold Coast",
    "body.class": "index",
    "header.title": "Pizza House Gold Coast",
    "header.text": "You can order your favourite pizza 0-24H across the Gold Coast area",
  };
  if (data.method == "get") {
    getTemplate("index", templateVariables, (err, templateData) => {
      if (!err && templateData) {
        // Add the universal header and footer
        addUniversalTemplates(
          templateData,
          templateVariables,
          function (err, str) {
            if (!err && str) {
              // Return that page as HTML
              callback(200, str, "html");
            } else {
              callback(500, undefined, "html");
            }
          }
        );
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, { Error: "method is not allowed." });
  }
};

handlers.accountCreate = (data, callback) => {
  // Index page specific variables
  const templateVariables = {
    "head.title": "Create Account",
    "head.description": "Signup is very easy",
    "body.class": "accountCreate",
    "header.title": "Create your account",
    "header.text": "You can sign up and create your account to order",
  };

  if (data.method == "get") {
    getTemplate("accountCreate", templateVariables, (err, templateData) => {
      if (!err && templateData) {
        // Add the universal header and footer
        addUniversalTemplates(
          templateData,
          templateVariables,
          function (err, str) {
            if (!err && str) {
              // Return that page as HTML
              callback(200, str, "html");
            } else {
              callback(500, undefined, "html");
            }
          }
        );
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, { Error: "method is not allowed." });
  }
};

handlers.accountEdit = (data, callback) => {
  // Page specific variables
  const templateVariables = {
    "head.title": "Edit Account",
    "head.description": "User can edit profile data",
    "body.class": "accountEdit",
    "header.title": "Edit or Delete your account",
    "header.text": "You can modify and update or delete your account here",
  };

  if (data.method == "get") {
    getTemplate("accountEdit", templateVariables, (err, templateData) => {
      if (!err && templateData) {
        // Add the universal header and footer
        addUniversalTemplates(
          templateData,
          templateVariables,
          function (err, str) {
            if (!err && str) {
              // Return that page as HTML
              callback(200, str, "html");
            } else {
              callback(500, undefined, "html");
            }
          }
        );
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, { Error: "method is not allowed." });
  }
};

handlers.accountDelete = (data, callback) => {
  // Page specific variables
  const templateVariables = {
    "head.title": "Delete Account",
    "head.description": "User can delete account",
    "body.class": "accountDelete",
    "header.title": "Deleted account",
    "header.text": "You have deleted your account",
  };

  if (data.method == "get") {
    getTemplate("accountDelete", templateVariables, (err, templateData) => {
      if (!err && templateData) {
        // Add the universal header and footer
        addUniversalTemplates(
          templateData,
          templateVariables,
          function (err, str) {
            if (!err && str) {
              // Return that page as HTML
              callback(200, str, "html");
            } else {
              callback(500, undefined, "html");
            }
          }
        );
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, { Error: "method is not allowed." });
  }
};


handlers.public = (data, callback) => {
  if (data) {
    const { method } = data;
    if (method == "get") {
      const assetFileName = data.pathName.replace("/public/", "");
      getStaticAsset(assetFileName, (err, assetData) => {
        if (!err && assetData) {
          const contentType = data.trimmedPath.split(".").pop();
          callback(200, assetData, contentType);
        } else {
          callback(err, { Error: assetData["Error"] });
        }
      });
    } else {
      callback(405, { Error: "This method is not allowed." });
    }
  } else {
    callback(400, "Missing data.");
  }
};

handlers.login = (data, callback) => {
  // Login page specific variables
  const templateVariables = {
    "head.title": "Login",
    "head.description": "Login is very easy",
    "body.class": "login",
    "header.title": "Log In to your account",
    "header.text": "You can log in here if you already signed up",
  };

  if (data.method == "get") {
    getTemplate("login", templateVariables, (err, templateData) => {
      if (!err && templateData) {
        // Add the universal header and footer
        addUniversalTemplates(
          templateData,
          templateVariables,
          function (err, str) {
            if (!err && str) {
              // Return that page as HTML
              callback(200, str, "html");
            } else {
              callback(500, undefined, "html");
            }
          }
        );
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, { Error: "method is not allowed." });
  }
};

handlers.logout = (data, callback) => {
  // Login page specific variables
  const templateVariables = {
    "logout.title": "Log Out Page",
    "logout.description": "Logout page",
    "body.class": "logout",
    "header.title": "Log Out from your account",
    "header.text": "You have logged out",
  };

  if (data.method == "get") {
    getTemplate("logout", templateVariables, (err, templateData) => {
      if (!err && templateData) {
        // Add the universal header and footer
        addUniversalTemplates(
          templateData,
          templateVariables,
          function (err, str) {
            if (!err && str) {
              // Return that page as HTML
              callback(200, str, "html");
            } else {
              callback(500, undefined, "html");
            }
          }
        );
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, { Error: "method is not allowed." });
  }
};

handlers.menulist = (data, callback) => {
  // Page specific variables
  const templateVariables = {
    "head.title": "Pizza Menu",
    "head.description": "List of our pizzas",
    "body.class": "menuList",
    "header.title": "Our pizza menu",
    "header.text": "You can see here our menu if you have logged in",
  };

  if (data.method == "get") {
    getTemplate("menuList", templateVariables, (err, templateData) => {
      if (!err && templateData) {
        // Add the universal header and footer
        addUniversalTemplates(
          templateData,
          templateVariables,
          function (err, str) {
            if (!err && str) {
              // Return that page as HTML
              callback(200, str, "html");
            } else {
              callback(500, undefined, "html");
            }
          }
        );
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, { Error: "method is not allowed." });
  }
};

handlers.shopping_cart = (data, callback) => {
  // Page specific variables
  const templateVariables = {
    "head.title": "Your shopping cart",
    "head.description": "You can select your pizza here",
    "body.class": "shoppingCart",
    "header.title": "Shopping cart",
    "header.text": "You can see here the content of your shopping cart",
  };

  if (data.method == "get") {
    getTemplate("shoppingCart", templateVariables, (err, templateData) => {
      if (!err && templateData) {
        // Add the universal header and footer
        addUniversalTemplates(
          templateData,
          templateVariables,
          function (err, str) {
            if (!err && str) {
              // Return that page as HTML
              callback(200, str, "html");
            } else {
              callback(500, undefined, "html");
            }
          }
        );
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, { Error: "method is not allowed." });
  }
};

handlers.pizza_order = (data, callback) => {
  // Page specific variables
  const templateVariables = {
    "head.title": "Your order",
    "head.description": "You can order ypur pizza here",
    "body.class": "order",
   "header.title": "Order your pizza",
    "header.text": "You can order your favourite pizza here if you are logged in",
  };

  if (data.method == "get") {
    getTemplate("order", templateVariables, (err, templateData) => {
      if (!err && templateData) {
        // Add the universal header and footer
        addUniversalTemplates(
          templateData,
          templateVariables,
          function (err, str) {
            if (!err && str) {
              // Return that page as HTML
              callback(200, str, "html");
            } else {
              callback(500, undefined, "html");
            }
          }
        );
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, { Error: "method is not allowed." });
  }
};

// * HANBDLERS FOR JSON

// * USERS HANDLERS *****************
handlers._users = {};

// * CREATE USER
// sample user payload in json:
// {
//   "firstName": "Zoltan",
//   "lastName": "B",
//   "email": "zoltan@gmail.com",
//   "street": "2 Aquastreet QLD 4215",
//   "password": "abcdefgh1#"
// }
// * to identify the user I simply used the email address
handlers._users.post = (data, callback) => {
  const payload = typeof data.payload == "string" ? data.payload : false;

  if (!payload) {
    callback(400, { Error: "missing data." });
  } else {
    const user = JSON.parse(payload);

    if (isValidUserData(user)) {
      const hashedPassword = hash(user.password);
      dataUtil.create(
        "users",
        user.email,
        { ...user, password: hashedPassword },
        (err, data) => {
          if (!err && data) {
            callback(201, data);
          } else {
            callback(err, data);
          }
        }
      );
    } else {
      callback(400, { Error: "Missing or invalid data. The password must be min. 8 char long and contain 1 special character and 1 number." });
    }
  }
};

// * READ USER DATA
// * email query and token are necessary
handlers._users.get = (data, callback) => {
  const { query } = data;
  const email =
    typeof query.email == "string" && isValidEmail(query.email)
      ? query.email
      : false;
  if (email) {
    const tokenId =
      typeof data.headers.token === "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;
    if (tokenId) {
      isValidNotExpiredToken(tokenId, email, function (err) {
        if (!err) {
          dataUtil.read("users", email, (err, data) => {
            if (!err && data) {
              const { password, ...userWOPassword } = data;
              callback(200, userWOPassword);
            } else {
              callback(err, data);
            }
          });
        } else {
          callback(403, {
            Error: err,
          });
        }
      });
    } else {
      callback(400, { Error: "missing or invalid token." });
    }
  } else {
    callback(400, { Error: "missing or invalid email." });
  }
};

// * MODIFY USER DATA
// * token and payload in json are necessary
handlers._users.put = (data, callback) => {
  const payload = typeof data.payload == "string" ? data.payload : false;

  if (!payload) {
    callback(400, { Error: "missing data." });
  } else {
    const user = JSON.parse(payload);

    if (isValidUserDataForModification(user)) {
      const tokenId =
        typeof data.headers.token === "string" &&
        data.headers.token.length == 20
          ? data.headers.token
          : false;

      if (tokenId) {
        isValidNotExpiredToken(tokenId, user.email, function (err) {
          if (!err) {

            // * Reading the original password
            dataUtil.read('users',user.email,(err,userData)=>{
              if (!err && userData) {
                let hashedPassword=userData.password;
                if (user.password.trim().length==0) {
                  // * User did not change the password because the default value is an empty string on the form
                } else {
                  // * User changed the password
                  const password =
                  typeof user.password == "string" &&
                  user.password.trim().length >= 8 &&
                  isValidPassword(user.password)
                    ? user.password
                    : false;
                  if (password) {
                    hashedPassword = hash(password);
                  } else {
                    callback(400,{Error:'invalid password.'})
                  }
                };

                // * The user cannot update his email address
                dataUtil.update(
                  "users",
                  user.email,
                  {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    street: user.street,
                    password: hashedPassword,
                  },
                  (err, data) => {
                    if (!err && data) {
                      // * Don't send back the password
                      const { password, ...userWOPassword } = data;
                      callback(200, userWOPassword);
                    } else {
                      callback(err, data);
                    }
                  }
                );
              } else {
                callback(400,{Error:'could not read user data.'})
              }
            })
          } else {
            callback(403, {
              Error: err,
            });
          }
        });
      } else {
        callback(400, { Error: "missing or invalid token." });
      }
    } else {
      callback(400, { Error: "missing or invalid data." });
    }
  }
};

// * DELETE USER DATA
// * email query and token are necessary
handlers._users.delete = (data, callback) => {
  const payload = typeof data.payload == "string" ? JSON.parse(data.payload) : false;

  const email =
    typeof payload.email == "string" && isValidEmail(payload.email)
      ? payload.email
      : false;

  if (email) {
    const tokenId =
      typeof data.headers.token === "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;
    if (tokenId) {
      isValidNotExpiredToken(tokenId, email, function (err) {
        if (!err) {
          // TODO delete shoppingcart and orders, too
          dataUtil.delete("users", email, (err, data) => {
            if (!err) {
              callback(200, data);
            } else {
              callback(err, data);
            }
          });
        } else {
          callback(403, {
            Error: err,
          });
        }
      });
    } else {
      callback(400, { Error: "missing or invalid token." });
    }
  } else {
    callback(400, { Error: "missing or invalid email." });
  }
};

handlers.users = (data, callback) => {

  if (isAcceptableMethod(["GET", "POST", "DELETE", "PUT"], data)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// * TOKENS HANDLERS *****************
handlers._tokens = {};

// * LOGIN
// sample login payload in json:
// {
//   "email":"zoltan@gmail.com",
//   "password":"abcdefgh1#" - min. 8 character and contains a special character and a number
// }
handlers._tokens.post = (data, callback) => {
  // * Time in minutes of token expiration
  const tokenExpireTime=2;
  const payload = typeof data.payload == "string" ? data.payload : false;
  if (!payload) {
    callback(400, { Error: "missing token data." });
  } else {
    const token = JSON.parse(payload);
    if (isValidToken(token)) {
      const { email, password } = token;

      dataUtil.read("users", email, (err, userData) => {
        if (!err && userData) {

          // * Checking whether the user already logged in
          // * I use loggedin folder to store the users who are logged in
          dataUtil.read("loggedin", email, (err, logData) => {
            if (err == 400) {
              callback(err, {
                Error: "login check: " + data["Error"],
              });
            }
            if (err != 404 && logData) {
              callback(409, { Error: "user already logged in." });
            } else {
              const hashedPassword = hash(password);

              // * Checking the password
              if (hashedPassword == userData.password) {
                const tokenId = createRandomString(20);
                // * Token object
                const tokenObject = {
                  id: tokenId,
                  email,
                  expires: Date.now() + 1000 * 60 * tokenExpireTime
                 };

                // * Create the token if passdword is ok
                dataUtil.create(
                  "tokens",
                  tokenId,
                  tokenObject,
                  (err, tokenData) => {
                    if (!err) {
                      // * if user is not logged in earlier and the pasword is ok then create a loggedin file
                      const loggedInTimeStamp = Date.now();
                      const loggedIn = { tokenId, date: loggedInTimeStamp };
                      dataUtil.create(
                        "loggedin",
                        email,
                        loggedIn,
                        (err, loggedInData) => {
                          if (!err && loggedInData) {
                            const currentDate = new Date();
                            console.log(
                              `${email} user has logged in: ${currentDate.getDate()}.${
                                currentDate.getMonth() + 1
                              }.${currentDate.getFullYear()} at ${currentDate.getHours()}:${currentDate.getMinutes()}`
                            );
                            callback(false, tokenData, "json");
                          } else {
                            callback(err, {
                              Error:
                                "creating logged in file: " + loggedInData["Error"],
                            });
                          }
                        }
                      );
                    } else {
                      callback(err, {
                        Error:
                          "creating token: " +tokenData["Error"],
                      });
                    }
                  }
                );
              } else {
                callback(401, { Error: "the password is invalid." });
              }
            }
          });
        } else {
          if (err == 404) {
            callback(401, {
              Error: "invalid token: " + userData["Error"],
            });
          } else {
            callback(401, {
              Error:
                "checking the user: " +
                userData["Error"],
            });
          }
        }
      });
    } else {
      callback(400, { Error: "Invalid username or password." });
    }
  }
};

// * Renew token
handlers._tokens.put = (data, callback) => {
  // * Time in minutes of then new token expiration
  const renewedTokenExpireTime=2;
  const payload = typeof data.payload == "string" ? data.payload : false;
  if (!payload) {
    callback(400, { Error: "missing token data." });
  } else {
    const token = JSON.parse(payload);
    const { email, id } = token;
    // * Checking whether the user already logged in
    dataUtil.read("loggedin", email, (err, logData) => {
      if (err != 404 && logData) {
        const tokenId =
          typeof logData.tokenId == "string" ? logData.tokenId : false;
        if (tokenId) {
          // * Checking if the token is exists.
          dataUtil.read("tokens", tokenId, (err, tokenData) => {
            let tokenObject = {};
            const currentDate = new Date();
            const expires = Date.now() + 1000 * 60 * renewedTokenExpireTime
            if (!err && tokenData.email == email) {
              tokenObject = {
                ...tokenData,
                expires,
              };
            } else {
              callback(403, { Error: "not authorized to renew the token." });
            }
            // * Renewing the token.
            dataUtil.update(
              "tokens",
              tokenId,
              tokenObject,
              (err, updatedTokenData) => {
                if (!err && updatedTokenData) {
                  console.log(
                    `Token is renewed: ${currentDate.getDate()}.${
                      currentDate.getMonth() + 1
                    }.${currentDate.getFullYear()} at ${currentDate.getHours()}:${currentDate.getMinutes()}`
                  );
                  callback(false, updatedTokenData, "json");
                } else {
                  callback(400, {
                    Error:
                      "error during renew token:" + updatedTokenData["Error"],
                  });
                }
              }
            );
          });
        } else {
          callback(400, { Error: "error with token id during renew token." });
        }
      } else {
        callback(err, {
          Error:
            "error occured during token renew login check: " + logData["Error"],
        });
      }
    });
  }
};


// * LOGOUT
handlers._tokens.delete = (data, callback) => {
  // * Because of security reasons the token will be send in the headers
  const tokenId =
    typeof data.headers.token === "string" && data.headers.token.length == 20
      ? data.headers.token
      : false;

  // * To identify the user it's email will be send in the body because of security reasons
  const payload = typeof data.payload == "string" ? data.payload : false;
  const user = JSON.parse(payload);
  if (tokenId) {
    isValidNotExpiredToken(tokenId, user.email, function (err) {
      if (!err) {
        dataUtil.delete("tokens", tokenId, (err) => {
          if (!err) {
            dataUtil.delete("loggedin", user.email, (err, loggedInData) => {
              if (!err && loggedInData) {
                const currentDate = new Date();
                console.log(
                  `User has logged out: ${currentDate.getDate()}.${
                    currentDate.getMonth() + 1
                  }.${currentDate.getFullYear()} at ${currentDate.getHours()}:${currentDate.getMinutes()}`
                );
                callback(false, { success: "logout was successsfull." });
              } else {
                callback(err, {
                  Error: "error occured during logout, " + loggedInData,
                });
              }
            });
          } else {
            callback(
              400,
              "Error: could not delete the token, logout was not successfull."
            );
          }
        });
      } else {
        callback(400, { Error: err });
      }
    });
  } else {
    callback(400, { Error: "the token is missing or invalid." });
  }
};

handlers.tokens = (data, callback) => {
  if (isAcceptableMethod(["POST", "PUT", "DELETE","GET"], data)) {
    // POST - login, DELETE - logout
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// * PIZZAMENU HANDLERS *****************

handlers._menu = {};

handlers.menu = (data, callback) => {
  if (isAcceptableMethod(["GET"], data)) {
    handlers._menu[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// * GET THE FULL PIZZA MENU
// * email query and token are necessary
handlers._menu.get = (data, callback) => {
  const { query } = data;
  const email =
    typeof query.email == "string" && isValidEmail(query.email)
      ? query.email
      : false;
  if (email) {
    const tokenId =
      typeof data.headers.token === "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;
    if (tokenId) {
      isValidNotExpiredToken(tokenId, email, function (err) {
        if (!err) {
          callback(200, pizzaMenuList);
        } else {
          callback(400, { Error: err });
        }
      });
    } else {
      callback(400, { Error: "missing or invalid token." });
    }
  } else {
    callback(400, { Error: "missing or invalid user email." });
  }
};

// * SHOPPING CART HANDLERS *****************

handlers._shoppingcart = {};

handlers.shoppingcart = (data, callback) => {
  if (isAcceptableMethod(["POST", "PUT", "DELETE","GET"], data)) {
    handlers._shoppingcart[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// * CREATE SHOPPING CART
// interface:
// {
// email: string,
// items: [{name: string
//         qty: number
//         price: number
//         }],
// }
handlers._shoppingcart.post = (data, callback) => {
  const payload = typeof data.payload == "string" ? data.payload : false;

  if (payload) {
    const shoppingCart = JSON.parse(payload);
    const tokenId =
      typeof data.headers.token === "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;

    if (tokenId) {
      isValidNotExpiredToken(tokenId, shoppingCart.email, function (err) {
        if (!err) {
          const items =
            typeof shoppingCart.items == "object" &&
            shoppingCart.items instanceof Array &&
            shoppingCart.items.length > 0
              ? shoppingCart.items
              : false;
          const shoppingCartDate = parseInt(Date.now());
          // * Summarize item prices
          summarizeOrderItems(items, (err, totalData) => {
            if (err) {
              callback(err, totalData);
            } else {
              // * Extending with total price and order date
              const modifiedShoppingCart = {
                ...shoppingCart,
                totalPrice: totalData,
                date: shoppingCartDate,
              };
              if (items) {
                // * Check if shopping cart already exists
                dataUtil.read(
                  "shopping-carts",
                  shoppingCart.email,
                  (err, shoppingCartData) => {
                    if (!err && shoppingCartData) {
                      callback(405, {
                        Error:
                          "shopping card already exists, you can modify or delete it.",
                      });
                    } else {
                      // * Check the orderable items.
                      anyNotAvailableItems(
                        shoppingCart,
                        (err, notAvailableItems) => {
                          if (err) {
                            callback(400, {
                              Error: `These items are not on the menu list, please change them: ${notAvailableItems}`,
                            });
                          } else {
                            // * Create shopping cart
                            dataUtil.create(
                              "shopping-carts",
                              shoppingCart.email,
                              modifiedShoppingCart,
                              (err) => {
                                if (!err) {
                                  callback(200, modifiedShoppingCart);
                                } else {
                                  callback(400, { Error: err });
                                }
                              }
                            );
                          }
                        }
                      );
                    }
                  }
                );
              } else {
                callback(400, { Error: "missing shopping cart items." });
              }
            }
          });
        } else {
          callback(400, { Error: err });
        }
      });
    } else {
      callback(400, { Error: "missing or invalid token." });
    }
  } else {
    callback(400, { Error: "missing shopping cart data." });
  }
};

// * MODIFY SHOPPING CART
handlers._shoppingcart.put = (data, callback) => {
  const payload = typeof data.payload == "string" ? data.payload : false;

  if (payload) {
    const shoppingCart = JSON.parse(payload);
    const tokenId =
      typeof data.headers.token === "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;
    if (tokenId) {
      isValidNotExpiredToken(tokenId, shoppingCart.email, function (err) {
        if (!err) {
          const items =
            typeof shoppingCart.items == "object" &&
            shoppingCart.items instanceof Array &&
            shoppingCart.items.length > 0
              ? shoppingCart.items
              : false;
          summarizeOrderItems(items, (err, totalData) => {
            if (err) {
              callback(err, totalData);
            } else {
              const shoppingCartModificationDate = parseInt(Date.now());
              const modifiedShoppingCart = {
                ...shoppingCart,
                totalPrice: totalData,
                date: shoppingCartModificationDate,
              };
              if (items) {
                // * Check if shopping cart already exists
                dataUtil.read(
                  "shopping-carts",
                  shoppingCart.email,
                  (err, shoppingCartData) => {
                    if (!err && shoppingCartData) {
                      // * Check the orderable items.
                      anyNotAvailableItems(
                        shoppingCart,
                        (err, notAvailableItems) => {
                          if (err) {
                            callback(400, {
                              Error: `These items are not on the menu list, please change them: ${notAvailableItems}`,
                            });
                          } else {
                            // * Modify shopping cart
                            dataUtil.update(
                              "shopping-carts",
                              shoppingCart.email,
                              modifiedShoppingCart,
                              (err) => {
                                if (!err) {
                                  callback(200, modifiedShoppingCart);
                                } else {
                                  callback(400, { Error: err });
                                }
                              }
                            );
                          }
                        }
                      );
                    } else {
                      callback(405, {
                        Error: "shopping card does not exists.",
                      });
                    }
                  }
                );
              } else {
                callback(400, { Error: "missing shopping cart items." });
              }
            }
          });
        } else {
          callback(400, { Error: err });
        }
      });
    } else {
      callback(400, { Error: "missing or invalid token." });
    }
  } else {
    callback(400, { Error: "missing shopping cart data." });
  }
};

handlers._shoppingcart.get = (data, callback) => {
  const { query } = data;
  const email =
    typeof query.email == "string" && isValidEmail(query.email)
      ? query.email
      : false;
  if (email) {
    const tokenId =
      typeof data.headers.token === "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;
    if (tokenId) {
      isValidNotExpiredToken(tokenId, email, function (err) {
        if (!err) {
          
          // * Checking whether the user already has a shopping cart
          dataUtil.read("shopping-carts", email, (err, shoppingCartData) => {
            if (!err && shoppingCartData) {
              callback(false,shoppingCartData)
            } else {
              if (err==404) {
                callback(err, {
                  Error:
                    "Shopping cart is empty."
                });
              } else {
                callback(err, {
                  Error:
                    "Shopping cart:" +
                    shoppingCartData["Error"],
                });
              }
            }
          });
        } else {
          callback(403, {
            Error: err,
          });
        }
      })
    } else {
      callback(400, { Error: "missing or invalid token." });
    }
  } else {
    callback(400, { Error: "missing data." });
  }
};

// * DELETE SHOPPING CART
handlers._shoppingcart.delete = (data, callback) => {
  const payload = typeof data.payload == "string" ? JSON.parse(data.payload) : false;

  const email =
    typeof payload.email == "string" && isValidEmail(payload.email)
      ? payload.email
      : false;

  if (email) {
    const tokenId =
      typeof data.headers.token === "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;
    if (tokenId) {
      isValidNotExpiredToken(tokenId, email, function (err) {
        if (!err) {
          // * Delete shopping cart
          dataUtil.delete("shopping-carts", email, (err) => {
            if (!err) {
              callback(200, { Success: "Shopping cart now is empty." });
            } else {
              callback(400, {
                Error: err,
              });
            }
          });
        } else {
          callback(400, { Error: err });
        }
      });
    } else {
      callback(400, { Error: "missing or invalid token." });
    }
  } else {
    callback(400, { Error: "missing user data." });
  }
};

handlers._order={};


handlers.order = (data, callback) => {
  if (isAcceptableMethod(["POST"], data)) {
    handlers._order[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};



// * ORDER AND PAYMENT BY CARD
// sample payment payload in json:
// {
//   "email": "kovacsg76@gmail.com",
//   "amount":900,
//   "currency":"AUD",
//   "card":{"number": "4242424242424242",
//     "exp_month": "12",
//     "exp_year": "2025",
//     "cvc": "123"}
// }
handlers._order.post = (data, callback) => {
  const payload = typeof data.payload == "string" ? data.payload : false;

  if (payload) {
    const payment = JSON.parse(payload);
    const tokenId =
      typeof data.headers.token === "string" && data.headers.token.length == 20
        ? data.headers.token
        : false;

    if (tokenId) {
      const email =
        typeof payment.email == "string" && isValidEmail(payment.email)
          ? payment.email
          : false;

      // * Checking whether the user already has a shopping cart
      dataUtil.read("shopping-carts", email, (err, shoppingCartData) => {
        if (!err && shoppingCartData) {
          // * Validating payment details
          const amount =
            typeof payment.amount == "number" &&
            payment.amount > 0 &&
            payment.amount <= 10000
              ? payment.amount
              : false;
          const currency =
            typeof payment.currency == "string" &&
            ["aud", "usd"].includes(payment.currency.toLowerCase())
              ? payment.currency
              : false;

          if (email && amount && currency) {
            const card = typeof payment.card == "object" ? payment.card : false;

            isValidNotExpiredToken(tokenId, email, function (err) {
              if (!err) {
                // Checking card details
                isValidCard(card, (err) => {
                  if (!err) {
                    // * Executing payment with Stripe integration
                    // * createStripePaymentMethod(card, (err, paymentMethod) => {}) only necessary if I want to create a paymentMethod in live mode
                    // * In test mode "pm_card_visa" is used instead of "card" details

                    const paymentObject = {
                      amount,
                      currency,
                      payment_method: "pm_card_visa", // * instead of card in test mode
                      automatic_payment_methods: { enabled: true },
                      confirm: false,
                    };
                    stripe.paymentIntents
                      .create(paymentObject)
                      .then((paymentIntent) => {
                        // * Hide card details in response
                        const modifiedCard = {
                          ...card,
                          number: "xxxxxxxxxxxx" + card.number.slice(12, 16),
                          exp_month: "",
                          exp_year: "",
                          cvc: "",
                        };
                        const paymentDetails = {
                          paymentId: paymentIntent.created,
                          ...{ ...payment, card: modifiedCard },
                          ...shoppingCartData,
                        };

                        // * Email meassage html form
                        // * Cent is converted back to dollar
                        const modifiedPaymentDetails={...paymentDetails,amount:amount/100};
                        const htmlMessage = formatMessage(
                          shoppingCartData,
                          modifiedPaymentDetails,
                          modifiedCard
                        );

                        // * Sending email using Mailgun integration
                        // * On my Mailgun dashboard I have created 2 verified email address to test the message sending
                        // * I can use Maligun free of charge during the next 30 days
                        sendEmailMessage(
                          email,
                          "Thank you for your order.",
                          htmlMessage,
                          (err, data) => {
                            if (!err && data) {
                              // * Moving shopping cart to orders folder to get the get the current orders later
                              dataUtil.move(
                                "shopping-carts",
                                "orders",
                                email,
                                (err) => {
                                  if (!err) {
                                    callback(200, {
                                      Success: paymentDetails,
                                    });
                                  } else {
                                    callback(400, {
                                      Error: "creating order file: " + err,
                                    });
                                  }
                                }
                              );
                            } else {
                              callback(200, { Error: data });
                            }
                          }
                        );
                      })
                      .catch((err) => {
                        callback(500, { Error: err.message });
                      });
                  } else {
                    callback(400, { Error: err });
                  }
                });
              } else {
                callback(400, { Error: err });
              }
            });
          } else {
            callback(400, {
              Error: `the following data is missing or invalid: ${
                email ? "" : "email "
              } ${amount ? "" : "amount "} ${currency ? "" : "currency."}`,
            });
          }
        } else {
          callback(err, {
            Error:
              "shopping cart is empty or something went wrong: " +
              shoppingCartData["Error"],
          });
        }
      });
    } else {
      callback(400, { Error: "missing or invalid token." });
    }
  } else {
    callback(400, { Error: "missing or invalid payment data." });
  }
};



// * LOGOUTCHECK HANDLERS *****************

handlers._logoutcheck = {};

handlers.logoutcheck = (data, callback) => {
  if (isAcceptableMethod(["GET"], data)) {
    handlers._logoutcheck[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// * Checking if the user logged out.
handlers._logoutcheck.get = (data, callback) => {
  const { query }=data;
  if (!query) {
    callback(400, { Error: "missing query data." });
  } else {
    const {email} = query;
    if (email) {
      // * Checking if the user already logged out
      dataUtil.read("loggedin", email, (err, loggedInData) => {
        if (!err && loggedInData) {
          callback(false,{})
        } else {
          callback(err, { Error: loggedInData['Error']});
        }
      });
    } else {
      callback(400, { Error: "missing query data." });
    }
  }
};