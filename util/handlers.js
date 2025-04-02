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
} from "./helpers.js";
import { dataUtil } from "./dataUtils.js";
import { pizzaMenuList } from "../data/menu/menu.js";
import Stripe from "stripe";

import dotenv from "dotenv";
dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: "2025-02-24.acacia",
});
const month = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const handlers = {};

// USERS HANDLERS *****************
handlers._users = {};

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

handlers._users.delete = (data, callback) => {
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
        callback
      );
    } else {
      callback(400, { Error: "missing or invalid data." });
    }
  }
};

handlers._users.put = (data, callback) => {
  const payload = typeof data.payload == "string" ? data.payload : false;

  if (!payload) {
    callback(400, { Error: "missing data." });
  } else {
    const user = JSON.parse(payload);

    if (isValidUserData(user)) {
      const tokenId =
        typeof data.headers.token === "string" &&
        data.headers.token.length == 20
          ? data.headers.token
          : false;

      if (tokenId) {
        isValidNotExpiredToken(tokenId, user.email, function (err) {
          if (!err) {
            const hashedPassword = hash(user.password);
            //   The user cannot update his email address
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
                  // Don't send back the password
                  const { password, ...userWOPassword } = data;
                  callback(200, userWOPassword);
                } else {
                  callback(err, data);
                }
              }
            );
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

handlers.users = (data, callback) => {
  if (isAcceptableMethod(["GET", "POST", "DELETE", "PUT"], data)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// TOKENS HANDLERS *****************
handlers._tokens = {};

// LOGIN
handlers._tokens.post = (data, callback) => {
  const payload = typeof data.payload == "string" ? data.payload : false;
  if (!payload) {
    callback(400, { Error: "missing token." });
  } else {
    const token = JSON.parse(payload);
    if (isValidToken(token)) {
      const { email, password } = token;
      dataUtil.read("users", email, (err, user) => {
        if (!err && user) {
          const hashedPassword = hash(password);
          const tokenId = createRandomString(20);
          if (hashedPassword == user.password) {
            const tokenObject = {
              id: tokenId,
              email,
              expires: Date.now() + 1000 * 60 * 60,
            };
            dataUtil.create("tokens", tokenId, tokenObject, (err) => {
              if (!err) {
                callback(false, { success: "login was successfull" });
              } else {
                callback(400, { Error: "could not create the token." });
              }
            });
          } else {
            callback(400, { Error: "token is not valid." });
          }
        } else {
          callback(400, { Error: "token is not valid." });
        }
      });
    } else {
      callback(400, { Error: "missing or invalid data." });
    }
  }
};

handlers._tokens.get = (data, callback) => {
  // because of security reasons the token will be send in the headers
  const tokenId =
    typeof data.headers.token === "string" && data.headers.token.length == 20
      ? data.headers.token
      : false;
  if (tokenId) {
    dataUtil.read("tokens", tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(400, { Error: "the token does not exist." });
      }
    });
  } else {
    callback(400, { Error: "the token is missing or invalid." });
  }
};

// LOGOUT
handlers._tokens.delete = (data, callback) => {
  // because of security reasons the token will be send in the headers
  const tokenId =
    typeof data.headers.token === "string" && data.headers.token.length == 20
      ? data.headers.token
      : false;

  // to identify the user it's email will be send in the body
  const payload = typeof data.payload == "string" ? data.payload : false;
  const user = JSON.parse(payload);
  if (tokenId) {
    isValidNotExpiredToken(tokenId, user.email, function (err) {
      if (!err) {
        dataUtil.delete("tokens", tokenId, (err) => {
          if (!err) {
            callback(false, { success: "logout was successsfull." });
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
  if (isAcceptableMethod(["GET", "POST", "DELETE", "PUT"], data)) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// PIZZAMENU HANDLERS *****************

handlers._pizzamenu = {};

handlers.pizzamenu = (data, callback) => {
  if (isAcceptableMethod(["GET"], data)) {
    handlers._pizzamenu[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// LIST OF PIZZA MENU ITEMS
handlers._pizzamenu.get = (data, callback) => {
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

// SHOPPING CART HANDLERS *****************

handlers._shoppingcart = {};

handlers.shoppingcart = (data, callback) => {
  if (isAcceptableMethod(["POST", "PUT", "DELETE"], data)) {
    handlers._shoppingcart[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// CREATE SHOPPING CART
// {email: user's email,items:array of pizza names, date: timestamp}
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
            shoppingCart.items.length > 0;
          const shoppingCartDate = parseInt(Date.now());
          const modifiedShoppingCart = {
            ...shoppingCart,
            orderDate: shoppingCartDate,
          };
          if (items) {
            // Check if shopping cart already exists
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
                  // Check the orderable items.
                  anyNotAvailableItems(
                    shoppingCart,
                    (err, notAvailableItems) => {
                      if (err) {
                        callback(400, {
                          Error: `These items are not on the menu list, please change them: ${notAvailableItems}`,
                        });
                      } else {
                        // Create shopping cart
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

// MODIFY SHOPPING CART
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
            shoppingCart.items.length > 0;
          const shoppingCartModificationDate = parseInt(Date.now());
          const modifiedShoppingCart = {
            ...shoppingCart,
            date: shoppingCartModificationDate,
          };
          if (items) {
            // Check if shopping cart already exists
            dataUtil.read(
              "shopping-carts",
              shoppingCart.email,
              (err, shoppingCartData) => {
                if (!err && shoppingCartData) {
                  // Check the orderable items.
                  anyNotAvailableItems(
                    shoppingCart,
                    (err, notAvailableItems) => {
                      if (err) {
                        callback(400, {
                          Error: `These items are not on the menu list, please change them: ${notAvailableItems}`,
                        });
                      } else {
                        // Modify shopping cart
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

// DELETE SHOPPING CART
handlers._shoppingcart.delete = (data, callback) => {
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
          // Delete shopping cart
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

// ORDER AND CARD PAYMENT
handlers.order = (data, callback) => {
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

      // Checking shopping carts
      dataUtil.read("shopping-carts", email, (err, shoppingCartData) => {
        if (!err && shoppingCartData) {
          // Validating payment details
          const amount =
            typeof payment.amount == "number" &&
            payment.amount > 0 &&
            payment.amount < 1000
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
                    // Executing payment with Stripe integration
                    // createStripePaymentMethod(card, (err, paymentMethod) => {}) only necessary if I want to create a paymentMethod in live mode
                    // In test mode "pm_card_visa" is used instead of "card" details

                    const paymentObject = {
                      amount,
                      currency,
                      payment_method: "pm_card_visa", // instead of card in test mode
                      automatic_payment_methods: { enabled: true },
                      confirm: false,
                    };
                    stripe.paymentIntents
                      .create(paymentObject)
                      .then((paymentIntent) => {
                        // Hide card details in response
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

                        // Email meassage form
                        const currentDate = new Date();
                        const htmlMessage = `
                        <h1>Thank you for your order!</h1>
                        <p>Successfull payment on our NODEJS test server.</p>
                        <p>Your order #${paymentDetails.paymentId} on ${
                          currentDate.getDay() - 2
                        }th of ${
                          month[currentDate.getMonth()]
                        }.${currentDate.getFullYear()} at ${currentDate.getHours()}:${currentDate.getMinutes()}  has been confirmed.</p>
                        <p><strong>Amount: ${amount} ${currency} </strong></p>
                        <p>Card No.: ${modifiedCard.number}</p>
                        <p>You have ordered the following items: </p>
                        <p><strong>${shoppingCartData.items}<strong></p>
                        <p>Thanks,<br>Happy Pizza</p>
                      `;

                        // Sending email
                        sendEmailMessage(
                          email,
                          "Thank you for your order.",
                          htmlMessage,
                          (err, messageData) => {
                            if (!err && messageData) {
                              callback(200, {
                                Success: paymentDetails,
                              });
                            } else {
                              callback(200, { Error: err });
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
          callback(400, {
            Error: "shopping cart is empty or something went wrong: ",
            err,
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
