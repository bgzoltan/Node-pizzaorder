import crypto from "crypto";

import dotenv from "dotenv"; // Loading environment variables - necessary to install with npm
import { dataUtil } from "./dataUtils.js";
import { pizzaMenuList } from "../data/menu/menu.js";
import FormData from "form-data";
import Mailgun from "mailgun.js"; // Email integration
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { globalVariables } from "./config.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(__dirname, "../");
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

export function isValidUserDataForModification(user) {
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
    
  if (email && (firstName || lastName || password || street)) {
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
    if (!availablePizzaItems.includes(cartItem.name.toLowerCase())) {
      pizzaItemsAreNotInMenuList.push(cartItem.name);
    }
  }
  if (pizzaItemsAreNotInMenuList.length > 0) {
    callback(400, pizzaItemsAreNotInMenuList);
  } else {
    callback(false, pizzaItemsAreNotInMenuList);
  }
}

export function createStripePaymentMethod(cardDetails, callback) {
  // Instead of using the card details of the user currently I use the stripe test card 'pm_card_visa'
  // *** 'pm_card_visa'
  // const card={
  //   number: "4242424242424242", // Test Visa card
  //   exp_month: 12,
  //   exp_year: 2025,
  //   cvc: "123",
  // };
  // stripe.paymentMethods
  //   .create({
  //     type: "card",
  //     card: card,
  //   })
  //   .then((paymentMethod) => {
  //     console.log("Payment method created", paymentMethod.id);
  //     callback(201, paymentMethod.id);
  //   })
  //   .catch((error) => {
  //     console.log("Something wrong", error);
  //     callback(400, error);
  //   });
}

export function isValidCard(cardData, callback) {
  if (typeof cardData == "object") {
    const onlyNumbersRegex = /^\d+$/;
    const isValidNumber =
      typeof cardData.number == "string" &&
      onlyNumbersRegex.test(cardData.number) &&
      cardData.number.length == 16;
    const isValidMonth =
      typeof cardData.exp_month == "number" &&
      cardData.exp_month >= 1 &&
      cardData.exp_month <= 12;
    const currentYear = new Date().getFullYear();
    const isValidYear =
      typeof cardData.exp_year == "number" &&
      cardData.exp_year >= currentYear &&
      cardData.exp_year <= currentYear + 10;
    const isValidCvc =
      typeof cardData.cvc == "string" && cardData.cvc.length === 3;

    if (isValidNumber && isValidMonth && isValidYear && isValidCvc) {
      callback(false);
    } else {
      callback(
        `the following card data is missing or invalid: ${
          isValidNumber ? "" : "number,"
        } ${isValidMonth ? "" : "month,"} ${isValidYear ? "" : "year,"} ${
          isValidCvc ? "" : "cvc,"
        }`
      );
    }
  } else {
    callback("missing card details.");
  }
}

export function sendEmailMessage(email, subject, htmlMessage, callback) {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_API_KEY,
  });

  mg.messages
    .create("sandbox27fa53e0eabb42609cfd27bc9421a357.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox27fa53e0eabb42609cfd27bc9421a357.mailgun.org>",
      to: [`${email}`],
      subject: subject,
      html: htmlMessage,
      tag: "test message",
    })
    .then((data) => {
      callback(false, data);
    })
    .catch((err) => {
      callback(400, err);
    });
}

export function summarizeOrderItems(items, callback) {
  let total = 0;
  let error = false;
  if (items) {
    for (const item of items) {
      const itemName =
        typeof item.name == "string" && item.name.length > 0 ? item.name : false;
      const itemQty =
        typeof item.qty == "number" && item.qty > 0 ? item.qty : false;
      const itemPrice =
        typeof item.price == "number" && item.price > 0 ? item.price : false;
      if (itemName && itemQty && itemPrice) {
        total += item.price * item.qty;
      } else {
        error = true;
      }
    }
  } else {
    error=true;
  }
  if (error) {
    callback(400, { Error: "missing or invalid data in items." });
  } else {
    callback(false, total);
  }
}

export function formatMessage(shoppingCartData, paymentDetails, modifiedCard) {
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

  const currentDate = new Date();

  const items = shoppingCartData.items;
  let htmlItems = `<p><strong>${"Name"}| ${"Qty"} | ${"Price"}</strong></p>`;
  for (const item of items) {
    htmlItems += `<p>${item.name} | ${item.qty} | ${item.price}<p>`;
  }
  return `
  <h1>Thank you for your order!</h1>
  <p>Successfull payment on our NODEJS test server.</p>
  <p>Your order #${paymentDetails.paymentId} on ${
    currentDate.getDay() - 2
  }th of ${
    month[currentDate.getMonth()]
  }.${currentDate.getFullYear()} at ${currentDate.getHours()}:${currentDate.getMinutes()}  has been confirmed.</p>
  <p>Amount: ${paymentDetails.amount} ${paymentDetails.currency}</p>
  <p>Card No.: ${modifiedCard.number}</p>
  <p>You have ordered the following items: </p>
  <p>${htmlItems}</p>
  <p>Total price: ${shoppingCartData.totalPrice}</p>
  <p>Thanks,<br>Happy Pizza</p>
`;
}

export function getTemplate(templateName, templateVariables, callback) {

  templateName = typeof templateName == "string" ? templateName : false;
  const templateFile = `${baseDir}/data/templates/${templateName}.html`;
  templateVariables=typeof templateVariables=='object' && templateVariables!==null ? templateVariables:false;
  if (templateName) {
    fs.readFile(templateFile, "utf-8", (err, templateFileData) => {
      if (!err && templateFileData && templateFileData.length>0) {
        // Extend the html file dynamically with global and template variables
        const updatedTemplateFileData=interpolate(templateFileData,templateVariables)
        callback(false, updatedTemplateFileData);
      } else {
        callback(400, { Error: "error when reading template file." });
      }
    });
  } else {
    callback("Missing template data or invalid data.");
  }
}

export function interpolate (templateFileData,templateVariables){
  templateFileData= typeof templateFileData == 'string' && templateFileData.length > 0 ? templateFileData : '';
  templateVariables = typeof(templateVariables) == 'object' && templateVariables !== null ? templateVariables : {};

  // Add the globalVariables.templateGlobals to the page specific templateVariables, prepending their key name with "global."
  for(var keyName in globalVariables.templateGlobals){
     if(globalVariables.templateGlobals.hasOwnProperty(keyName)){
       templateVariables['global.'+keyName] = globalVariables.templateGlobals[keyName]
     }
  }
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for(var key in templateVariables){
     if(templateVariables.hasOwnProperty(key) && typeof(templateVariables[key] == 'string')){
        var replace = templateVariables[key];
        var find = '{'+key+'}';
        templateFileData = templateFileData.replace(find,replace);
     }
  }
  return templateFileData;
};

export function addUniversalTemplates (templateData,templateVariables,callback){
  templateData = typeof(templateData) == 'string' && templateData.length > 0 ? templateData : '';
  templateVariables = typeof(templateVariables) == 'object' && templateVariables!== null ? templateVariables : {};
  getTemplate('_header',templateVariables,function(err,headerString){
    if(!err && headerString){
      getTemplate('_message',templateVariables,function(err,messageString){
        if(!err && messageString){
          getTemplate('_footer',templateVariables,function(err,footerString){
            if(!err && headerString){
              // Add header and footer to page
              var fullString = headerString+templateData+messageString+footerString;
              callback(false,fullString);
            } else {
              callback('Could not find the footer template');
            }
          });
        };
      });
    } else {
      callback('Could not find the header template');
    }
  });
};

export function getStaticAsset(assetFileName,callback){
  assetFileName=typeof(assetFileName=='string') && assetFileName.length>0 ? assetFileName:false;
  if (assetFileName) {  
    const assetFile=`${baseDir}/public/${assetFileName}`;
    fs.readFile(assetFile,(err,fileData)=>{
    if(!err && fileData) {
      callback(false,fileData)
    } else{
      callback(404,{Error:'asset file is not found.'})
    }
  })} else {
    callback(400,{Error:'asset file name is missing.'})
  }
}
