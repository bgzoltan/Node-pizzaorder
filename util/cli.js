// to test and communicate with the server I used postman
import readline from "readline";
import util from "util";
const debug = util.debuglog("cli");
import events from "events";
class _events extends events {}
const e = new _events();

export const cli = {};

// * INPUT PROCESSOR

cli.processInput = (str) => {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : false;

  // * Only handle the input if the user write something
  if (str) {
    // Codify the user's command

    const uniqueInputs=['man','help','exit','stats','list users','more user info'];
    if (uniqueInputs.includes(str.toLowerCase())) {
        e.emit(str.toLowerCase(),str)
    } else {
        console.log('This is not a valid command.')
    }
  }
};

cli.init = () => {
  console.log("\x1b[34m%s\x1b[0m", "The CLI is running.");

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
