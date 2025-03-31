import crypto from "crypto";

// Loading environment variables - necessary to install with npm
import dotenv from "dotenv";
import { dataUtil } from "./dataUtils.js";
import { pizzaMenuList } from "../data/menu/menu.js";
dotenv.config();

export function isValidPassword(password) {
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()\-_+=\[\]{}|;:'",.<>?/]).{8,}$/;
  return passwordRegex.test(password);
}

export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function isValidStreet(street) {
  const streetRegex = /^(?=.*\b\d+\b)(?=.*\b[A-Za-z]+\b).{2,}$/;
  return streetRegex.test(street);
}

export function hash(password) {
  const hash = crypto
    .createHmac("sha256", process.env.HASH_SECRET)
    .update(password)
    .digest("hex");
  return hash;
}

export function isValidUserData(user) {
  const firstName =
    typeof user.firstName == "string" && user.firstName.length <= 15
      ? user.firstName
      : "";
  const lastName =
    typeof user.lastName == "string" && user.lastName.length <= 20
      ? user.lastName
      : "";
  const password =
    typeof user.password == "string" &&
    user.password.trim().length >= 8 &&
    isValidPassword(user.password)
      ? user.password
      : false;

  const email =
    typeof user.email == "string" && isValidEmail(user.email)
      ? user.email
      : false;

  const street =
    typeof user.street == "string" && isValidStreet(user.street)
      ? user.street
      : false;

  if (firstName && lastName && password && email && street) {
    return true;
  } else {
    return false;
  }
}

export function isAcceptableMethod(acceptableMethods, data) {
  if (acceptableMethods.includes(data.method.toUpperCase())) {
    return true;
  } else {
    return false;
  }
}

export function isValidToken(token) {
  const email =
    typeof token.email == "string" && isValidEmail(token.email)
      ? token.email
      : false;

  const password =
    typeof token.password == "string" &&
    token.password.trim().length >= 8 &&
    isValidPassword(token.password)
      ? token.password
      : false;

  if (email && password) {
    return true;
  } else {
    return false;
  }
}

export function createRandomString(strLength) {
  strLength = typeof (strLength === "number") ? strLength : false;
  if (strLength) {
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";
    for (let i = 0; i < strLength; i++) {
      randomStr =
        randomStr +
        possibleCharacters[
          Math.floor(Math.random() * possibleCharacters.length)
        ];
    }
    return randomStr;
  } else {
    return false;
  }
}

export function isValidNotExpiredToken(tokenId, userEmail, callback) {
  dataUtil.read("tokens", tokenId, (err, token) => {
    if (!err && token) {
      if (token.email === userEmail && token.expires > Date.now()) {
        return callback(false);
      } else {
        return callback("unauthorized access or user is not logged in.");
      }
    } else {
      return callback("token does not exist or user is logged out.");
    }
  });
}

export function anyNotAvailableItems(shoppingCart, callback) {
  const pizzaItemsAreNotInMenuList = [];
  const availablePizzaItems = pizzaMenuList.items.map((item) =>
    item.name.toLowerCase()
  );
  for (const cartItem of shoppingCart.items) {
    if (!availablePizzaItems.includes(cartItem.toLowerCase())) {
      pizzaItemsAreNotInMenuList.push(cartItem);
    }
  }
  if (pizzaItemsAreNotInMenuList.length > 0) {
    callback(400, pizzaItemsAreNotInMenuList);
  } else {
    callback(false, pizzaItemsAreNotInMenuList);
  }
}
