import readline from "readline";
import util from "util";
const debug = util.debuglog("cli");
import events from "events";
import { dataUtil } from "./dataUtils.js";
import { isValidEmail } from "./helpers.js";
import { pizzaMenuList } from "../data/menu/menu.js";
class _events extends events {}

// * Constant values;
const e = new _events();
const screenWidth = process.stdout.columns;
// * Colors
const cRed = "\x1b[31m";
const cYellow = "\x1b[33m";
const cBlue = "\x1b[32m";
const cReset = "\x1b[0m";

export const cli = {};

// * PRINTING TEXT CONTROLL
cli.getRealLength = (str) => {
  const regex = /\x1b\[[0-9;]*m/g;
  const cleanedStr = str.replace(regex, "");
  return cleanedStr.length;
};

// * Place text to specified column
cli.paddingText = (line, text, padding) => {
  let paddingText = "";
  for (let i = 0; i < padding - cli.getRealLength(line); i++) {
    paddingText += " ";
  }
  paddingText += text;
  return line + paddingText;
};

// * Create a horizontal line with a lenght of the ' number '
cli.horizontalLine = (number) => {
  let line = "";
  for (let i = 0; i < number; i++) {
    line += "-";
  }
  console.log(line);
};

// * Center the string in the width length
cli.centered = (str, width) => {
  str = typeof str == "string" && str.trim().length > 0 ? str : "";
  const padding = Math.floor((width - cli.getRealLength(str)) / 2);
  let line = "";
  for (let i = 0; i < padding; i++) {
    line += " ";
  }
  line += str;
  console.log(line);
};

// * Create number of vertical space
cli.verticalSpace = (number) => {
  number = typeof number == "number" && number > 0 ? number : 0;
  for (let i = 0; i < number; i++) {
    console.log(" ");
  }
};

// * Create title
cli.createTitle = (title, width) => {
  cli.verticalSpace(1);
  cli.horizontalLine(width);
  cli.verticalSpace(1);
  cli.centered(cYellow + title + cReset, width);
  cli.verticalSpace(1);
  cli.horizontalLine(width);
};

// * INPUT PROCESSOR

cli.processInput = (str) => {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : false;

  // * Only handle the input if the user write something
  if (str) {
    // * Codify the user's command
    const uniqueInputs = {
      man: "man",
      help: "help",
      exit: "exit",
      "list menu": "listMenu",
      "list users": "listUsers",
      "list last users": "listLastUsers",
      "more user info": "moreUserInfo",
      "list orders": "listOrders",
      "list last orders": "listLastOrders",
      "more order info": "moreOrderInfo",
    };

    let found = false;
    for (let key of Object.keys(uniqueInputs)) {
      if (str.toLowerCase() == key || str.toLowerCase().includes(key + " --")) {
        let data = "";
        if (str.toLowerCase().includes("--")) {
          data = str.toLowerCase().split("--")[1];
        }
        e.emit(uniqueInputs[key], data);
        found = true;
      }
    }
    if (!found) {
      console.log(
        cYellow + "Sorry, this is not a valid command. Try 'help' !" + cReset
      );
    }
  }
};

// * INPUT HANDLERS

e.on("man", () => {
  cli.responders.help();
});

e.on("help", () => {
  cli.responders.help();
});

e.on("exit", () => {
  cli.responders.exit();
});

e.on("listMenu", () => {
  cli.responders.listMenu();
});

e.on("listOrders", () => {
  cli.responders.listOrders();
});

e.on("listLastOrders", () => {
  cli.responders.listLastOrders();
});

e.on("moreOrderInfo", (data) => {
  cli.responders.moreOrderInfo(data);
});

e.on("listUsers", () => {
  cli.responders.listUsers();
});

e.on("listLastUsers", () => {
  cli.responders.listLastUsers();
});

e.on("moreUserInfo", (data) => {
  cli.responders.moreUserInfo(data);
});

// * RESPONDERS
cli.responders = {};

cli.responders.help = () => {
  const commands = {
    man: "Show this help page.",
    help: "Show this help page.",
    exit: "Kill the CLI and the rest of the application.",
    "list menu": "Show the current menu.",
    "list users": "Show the list of current users.",
    "list last users": "Show the users signed up in the past 24 hours.",
    "more user info --{userId}": "Show details of the specified user.",
    "list orders": "Show the current orders.",
    "list last orders": "Show the orders received in the past 24 hours.",
    "more order info --{orderId}": "Show details of the specified order.",
  };

  cli.createTitle("CLI commands", screenWidth / 2);

  for (let key in commands) {
    let line = "";
    line = cli.paddingText(line, cRed + key + cReset, 0);
    line = cli.paddingText(line, commands[key], 32);
    console.log(line);
  }

  cli.horizontalLine(screenWidth / 2);
};

cli.responders.exit = () => {
  console.log(cYellow + "EXIT from cli." + cReset);
  process.exit(0);
};

// * List the current menu items
cli.responders.listMenu = () => {
  cli.createTitle("Current menu", screenWidth / 2);
  pizzaMenuList.items.map((item) => {
    const name = cRed + "Pizza " + item.name + cReset;
    console.log(name);
    console.log(item.ingredients);
    console.log(item.price + " AUD");
    cli.verticalSpace(1);
  });
};

// * ORDER LIST - list the current orders
cli.responders.listOrders = () => {
  const paddings = [0, 25];
  let line = "";
  dataUtil.readFiles("orders", (err, orders) => {
    if (!err && orders) {
      // * Table title
      cli.createTitle("List of current orders", screenWidth / 2);

      // * Table head
      line = cli.paddingText(line, "ORDER DATE", paddings[0]);
      line = cli.paddingText(line, cRed + "ORDER ID" + cReset, paddings[1]);
      console.log(line);
      cli.horizontalLine(paddings[paddings.length - 1] + 20);

      // * Table rows
      for (let order of orders) {
        const orderId = order.slice(0, -5); // cut .json
        dataUtil.read("orders", orderId, (err, order) => {
          if (!err && order) {
            const dateOfOrder = new Date(order.date);
            const displayedDate = `${dateOfOrder.getDate()}.${
              dateOfOrder.getMonth() + 1
            }.${dateOfOrder.getFullYear()} at ${dateOfOrder.getHours()}:${dateOfOrder.getMinutes()}`;
            line = "";
            line = cli.paddingText(line, displayedDate, paddings[0]);
            line = cli.paddingText(line, cRed + orderId + cReset, paddings[1]);
            console.log(line);
          } else {
            console.log(cYellow + err + cReset, err, order);
          }
        });
      }
    } else {
      console.log(cYellow + err + cReset, orders);
    }
  });
};

// * 24h ORDER LIST - list the orders of the past 24 hours
cli.responders.listLastOrders = () => {
  const paddings = [0, 25];
  let line = "";

  dataUtil.readFiles("orders", (err, orders) => {
    let noOfRecords = orders.length;
    let isLast24HourOrder = false;
    if (!err && orders) {
      // * Table title
      cli.createTitle("Past 24 hour orders", screenWidth / 2);

      // * Table head
      line = cli.paddingText(line, "ORDER DATE", paddings[0]);
      line = cli.paddingText(line, cRed + "ORDER ID" + cReset, paddings[1]);
      console.log(line);
      cli.horizontalLine(paddings[paddings.length - 1] + 20);

      // * Table rows
      for (let order of orders) {
        const orderId = order.slice(0, -5); // cut .json
        dataUtil.read("orders", orderId, (err, order) => {
          noOfRecords--;
          if (!err && order) {
            const twentyFourHoursInMs = 1000 * 60 * 60 * 24;
            const currentDate = Date.now();
            if (order.date >= currentDate - twentyFourHoursInMs) {
              isLast24HourOrder = true;
              const dateOfOrder = new Date(order.date);
              const displayedDate = `${dateOfOrder.getDate()}.${
                dateOfOrder.getMonth() + 1
              }.${dateOfOrder.getFullYear()} at ${dateOfOrder.getHours()}:${dateOfOrder.getMinutes()}`;
              line = "";
              line = cli.paddingText(line, displayedDate, paddings[0]);
              line = cli.paddingText(
                line,
                cRed + orderId + cReset,
                paddings[1]
              );
              console.log(line);
            }
          } else {
            console.log(cYellow + err + cReset, err, order);
          }
          if (noOfRecords == 0) {
            if (!isLast24HourOrder) {
              console.log(
                cYellow + "There are no orders from the past 24 hours!" + cReset
              );
            }
          }
        });
      }
    } else {
      console.log(cYellow + err + cReset, orders);
    }
  });
};

// * ORDER DETAILS - print the details of a specific order
cli.responders.moreOrderInfo = (orderId) => {
  orderId =
    typeof orderId == "string" && isValidEmail(orderId) ? orderId : false;

  if (!orderId) {
    console.log(cYellow + "Invalid order id!" + cReset);
    return;
  }

  dataUtil.read("orders", orderId, (err, order) => {
    if (!err && order) {
      // * Order details title
      cli.createTitle("Order details", screenWidth / 2);
      const dateOfOrder = new Date(order.date);
      // * Row paddings;
      const paddings = [0, 4, 30, 38];
      let line = "";
      const { items } = order;

      // * Display order id and date
      cli.verticalSpace(1);
      orderId = cRed + `Order id: ${orderId}` + cReset;
      console.log(orderId);
      console.log(
        `Date of order: ${dateOfOrder.getDate()}.${
          dateOfOrder.getMonth() + 1
        }.${dateOfOrder.getFullYear()} at ${dateOfOrder.getHours()}:${dateOfOrder.getMinutes()}`
      );

      // * Table head
      cli.horizontalLine(paddings[paddings.length - 1] + 4);
      line = cli.paddingText(line, cRed + "QTY" + cReset, paddings[0]);
      line = cli.paddingText(line, "PIZZA NAME", paddings[1]);
      line = cli.paddingText(line, "PRICE", paddings[2]);
      line = cli.paddingText(line, cRed + "TOTAL" + cReset, paddings[3]);
      console.log(line);
      cli.horizontalLine(paddings[paddings.length - 1] + 4);

      // * Table rows - listing the items
      for (let item of items) {
        line = "";
        line = cli.paddingText(
          line,
          cRed + item.qty + "x" + cReset,
          paddings[0]
        );
        line = cli.paddingText(line, "Pizza " + item.name, paddings[1]);
        line = cli.paddingText(line, item.price, paddings[2]);
        line = cli.paddingText(
          line,
          cRed + item.price * item.qty + cReset,
          paddings[3]
        );
        console.log(line);
      }

      // * Total price
      cli.horizontalLine(paddings[paddings.length - 1] + 4);
      line = "";
      line = cli.paddingText(line, "Total in AUD:", 0);
      line = cli.paddingText(
        line,
        cRed + order.totalPrice + cReset,
        paddings[paddings.length - 1]
      );
      console.log(line);
      cli.horizontalLine(paddings[paddings.length - 1] + 4);
    } else {
      if (err == 404) {
        console.log(cYellow + "The order id does not exist!" + cReset);
      } else {
        console.log(cYellow + err + cReset, user);
      }
    }
  });
};

// * USER LIST - list the current users
cli.responders.listUsers = () => {
  // * Row paddings;
  const paddings = [0, 30, 45];
  let line = "";
  dataUtil.readFiles("users", (err, users) => {
    if (!err && users) {
      // * Table title
      cli.verticalSpace(1);
      cli.createTitle("List of current users", screenWidth / 2);

      // * Table head
      line = cli.paddingText(line, cRed + "USER ID" + cReset, paddings[0]);
      line = cli.paddingText(line, "FIRST NAME", paddings[1]);
      line = cli.paddingText(line, "LAST NAME", paddings[2]);

      console.log(line);
      cli.horizontalLine(paddings[paddings.length - 1] + 20);

      // * Table rows
      for (let user of users) {
        const userId = user.slice(0, -5); // cut .json
        dataUtil.read("users", userId, (err, user) => {
          if (!err && user) {
            line = "";
            line = cli.paddingText(line, cRed + userId + cReset, paddings[0]);
            line = cli.paddingText(line, user.firstName, paddings[1]);
            line = cli.paddingText(line, user.lastName, paddings[2]);
            console.log(line);
          } else {
            console.log(cYellow + err + cReset, user);
          }
        });
      }
    } else {
      console.log(cYellow + err + cReset, users);
    }
  });
};

// * 24h SIGNUP USERS LIST - list the users signed up in the past 24 hours
cli.responders.listLastUsers = () => {
  const paddings = [0, 25];
  let line = "";

  dataUtil.readFiles("users", (err, users) => {
    let noOfRecords = users.length;
    let isLast24HourUsers = false;
    if (!err && users) {
      // * Table title
      cli.createTitle("Past 24 hour signed up users", screenWidth / 2);

      // * Table head
      line = cli.paddingText(line, "SIGNUP DATE", paddings[0]);
      line = cli.paddingText(line, cRed + "USER ID" + cReset, paddings[1]);
      console.log(line);
      cli.horizontalLine(paddings[paddings.length - 1] + 20);

      // * Table rows
      for (let user of users) {
        const userId = user.slice(0, -5); // cut .json
        dataUtil.read("users", userId, (err, user) => {
          noOfRecords--;
          if (!err && user) {
            const twentyFourHoursInMs = 1000 * 60 * 60 * 24;
            const currentDate = Date.now();
            if (user.dateCreated >= currentDate - twentyFourHoursInMs) {
              isLast24HourUsers = true;
              const dateOfSignUp = new Date(user.dateCreated);
              const displayedDate = `${dateOfSignUp.getDate()}.${
                dateOfSignUp.getMonth() + 1
              }.${dateOfSignUp.getFullYear()} at ${dateOfSignUp.getHours()}:${dateOfSignUp.getMinutes()}`;
              line = "";
              line = cli.paddingText(line, displayedDate, paddings[0]);
              line = cli.paddingText(
                line,
                cRed + userId + cReset,
                paddings[1]
              );
              console.log(line);
            }
          } else {
            console.log(cYellow + err + cReset, err, order);
          }
          if (noOfRecords == 0) {
            if (!isLast24HourUsers) {
              console.log(
                cYellow + "There are no orders from the past 24 hours!" + cReset
              );
            }
          }
        });
      }
    } else {
      console.log(cYellow + err + cReset, orders);
    }
  });
};

// * USER DETAILS - print the details of a specific user
cli.responders.moreUserInfo = (userId) => {
  userId = typeof userId == "string" && isValidEmail(userId) ? userId : false;

  if (!userId) {
    console.log(cYellow + "Invalid user id!" + cReset);
    return;
  }
  let line = "";
  // * Row paddings;
  const paddings = [0, 15, 30];
  // * Title
  cli.createTitle("User details", screenWidth / 2);

  dataUtil.read("users", userId, (err, user) => {
    if (!err && user) {
      cli.verticalSpace(1);
      userId = cRed + `User id: ${userId}` + cReset;
      console.log(userId);

      // * Labels
      cli.horizontalLine(screenWidth / 2);
      line = cli.paddingText(line, "FIRST NAME", paddings[0]);
      line = cli.paddingText(line, "LAST NAME", paddings[1]);
      line = cli.paddingText(line, "ADDRESS", paddings[2]);
      console.log(line);
      cli.horizontalLine(screenWidth / 2);

      // * User details
      line = "";
      line = cli.paddingText(line, cRed + user.firstName, paddings[0]);
      line = cli.paddingText(line, user.lastName, paddings[1]);
      line = cli.paddingText(line, user.street + cReset, paddings[2]);
      console.log(line);
      cli.horizontalLine(screenWidth / 2);
    } else {
      if (err == 404) {
        console.log(cYellow + "The user id does not exist!" + cReset);
      } else {
        console.log(cYellow + err + cReset, user);
      }
    }
  });
};

cli.init = () => {
  console.log(cYellow + "The CLI is running." + cReset);

  const _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ">",
  });

  // * Initial prompt
  _interface.prompt();

  // * Handle each line of input separately
  _interface.on("line", (str) => {
    // * Send the input to the input processor
    cli.processInput(str);

    // * Reinitialize the prompt
    _interface.prompt();
  });

  // * User stops the cli
  _interface.on("close", () => {
    process.exit(0);
  });
};
