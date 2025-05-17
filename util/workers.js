import { dataUtil } from "./dataUtils.js";

export const pizzaWorkers = {};

pizzaWorkers.checkTokenExpiration = () => {
  // Reading loggedin files
  dataUtil.readFiles("loggedin", (err, filesData) => {
    if (!err && filesData) {
      // Reading token id from the loggedin files
      for (const file of filesData) {
        const fileName = file.slice(0, -5); // cut .json
        // Reading the token
        dataUtil.read("loggedin", fileName, (err, loggedInData) => {
          if (!err && loggedInData) {
            const { tokenId } = loggedInData;
            // Reading the token file
            dataUtil.read("tokens", tokenId, (err, tokenData) => {
              if (!err && tokenData) {
                // Checking if that token email is the same as the loggedin user's fileName
                const { email, expires } = tokenData;
                if (email == fileName) {
                  // Checking whether the token is expired or not
                  if (Date.now() > expires) {
                    // Delete token
                    dataUtil.delete(
                      "tokens",
                      tokenId,
                      (err, tokenDeleteData) => {
                        if (!err) {
                          // Delete loggedin file
                          dataUtil.delete(
                            "loggedin",
                            fileName,
                            (err, loggedInDeleteData) => {
                              if (!err) {
                                const currentDate = new Date();
                                console.log(
                                  `${fileName} token expired, user is automatically logged out: ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`
                                );
                              } else {
                                console.log(err, loggedInDeleteData);
                              }
                            }
                          );
                        } else {
                          console.log(err, tokenDeleteData);
                        }
                      }
                    );
                  } else {
                    // User's token is not expired
                  }
                } else {
                  console.log(
                    "Error when comparing loggedin data with tokendata."
                  );
                }
              } else {
                console.log(err, tokenData);
              }
            });
          } else {
            console.log(err, loggedInData);
          }
        });
      }
    } else {
      console.log(err, filesData);
    }
  });
};

pizzaWorkers.loop = () => {
  setInterval(() => {
    pizzaWorkers.checkTokenExpiration();
  }, 1000 * 15);
};

pizzaWorkers.init = () => {
  pizzaWorkers.loop();
};
