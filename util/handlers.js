import { isValidEmail, isValidUserData, hash } from "./helpers.js";
import { dataUtil } from "./dataUtils.js";

export const handlers = {};
const acceptableMethods = ["GET", "POST", "DELETE", "PUT"];

// USERS *****************
handlers._users = {};

handlers._users.get = (data, callback) => {
  const { query } = data;
  const email =
    typeof query.email == "string" && isValidEmail(query.email)
      ? query.email
      : false;

  if (email) {
    dataUtil.read("users", email, (err, data) => {
      if (!err && data) {
        const { password, ...userWOPassword } = data;
        callback(200, userWOPassword);
      } else {
        callback(err, data);
      }
    });
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
    dataUtil.delete("users", email, (err, data) => {
      if (!err) {
        callback(200, data);
      } else {
        callback(err, data);
      }
    });
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
        callback
      );
    } else {
      callback(400, { Error: "missing or invalid data." });
    }
  }
};

handlers.users = (data, callback) => {
  if (acceptableMethods.includes(data.method.toUpperCase())) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};
