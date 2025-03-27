import {
  isValidEmail,
  isValidUserData,
  hash,
  isAcceptableMethod,
  isValidToken,
  createRandomString,
  isValidNotExpiredToken,
} from "./helpers.js";
import { dataUtil } from "./dataUtils.js";

export const handlers = {};

// USERS *****************
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
            error: err,
          });
        }
      });
    } else {
      callback(400, { error: "missing or invalid token." });
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
  if (isAcceptableMethod(data)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};

// TOKENS *****************
handlers._tokens = {};

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
                callback(200);
              } else {
                callback(400, { error: "could not create the token." });
              }
            });
          } else {
            callback(400, { error: "token is not valid." });
          }
        } else {
          callback(400, { error: "token is not valid." });
        }
      });
    } else {
      callback(400, { Error: "missing or invalid data." });
    }
  }
};

handlers._tokens.get = (data, callback) => {
  const { query } = data;
  const tokenId =
    typeof query.id == "string" && query.id.length == 20 ? query.id : false;
  if (tokenId) {
    dataUtil.read("tokens", tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(400, { error: "the token does not exist." });
      }
    });
  } else {
    callback(400, { error: "the token is missing or invalid." });
  }
};

handlers.tokens = (data, callback) => {
  if (isAcceptableMethod(data)) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405, { Error: "this request method is not allowed." });
  }
};
