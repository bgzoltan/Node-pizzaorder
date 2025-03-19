import crypto from "crypto";

// Loading environment variables - necessary to install with npm
import dotenv from "dotenv";
dotenv.config();

export function isValidPassword(password) {
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()\-_+=\[\]{}|;:'",.<>?/]).{8,}$/;
  console.log("PSW", passwordRegex.test(password));
  return passwordRegex.test(password);
}

export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  console.log("email", emailRegex.test(email));
  return emailRegex.test(email);
}

export function isValidStreet(street) {
  const streetRegex = /^(?=.*\b\d+\b)(?=.*\b[A-Za-z]+\b).{2,}$/;
  console.log(streetRegex.test(street));
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
