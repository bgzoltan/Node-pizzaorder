// to test and communicate with the server I used postman
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import url from "url";
import fs from "fs";
import util from "util";
import { StringDecoder } from "string_decoder";
import { handlers } from "./util/handlers.js";

let debug = util.debuglog("index");

let pizzaServer = {};
// Define __filename and __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// To provide ssl support must to create cert and key files:
// openssl req -newkey rsa:2048 -new -nodes -x509 -days 365 -keyout key.pem -out cert.pem
pizzaServer.httpsParams = {
  cert: fs.readFileSync(path.join(__dirname, "./https/cert.pem")),
  key: fs.readFileSync(path.join(__dirname, "./https/key.pem")),
  minVersion: "TLSv1.2", // Ensure at least TLS 1.2
};

pizzaServer.httpsServer = https.createServer(
  pizzaServer.httpsParams,
  (req, res) => pizzaServer.unifiedServer(req, res)
);

pizzaServer.unifiedServer = (req, res) => {
  const headers = req.headers;
  const method = req.method.toLowerCase();
  const parsedUrl = url.parse(req.url, true);
  const query = parsedUrl.query;
  const pathName = parsedUrl.pathname;
  const trimmedPath = pathName.split("/").join("");
  const decoder = new StringDecoder("utf-8");

  let payloadBuffer = "";
  req.on("data", (dataChunk) => {
    payloadBuffer = payloadBuffer + decoder.write(dataChunk);
  });

  req.on("end", () => {
    payloadBuffer += decoder.end();

    const data = {
      headers,
      pathname: pathName,
      method,
      query,
      payload: payloadBuffer,
    };

    const selectedRouter =
      typeof pizzaServer.routing[trimmedPath] !== undefined
        ? pizzaServer.routing[trimmedPath]
        : false;

    const handlerCallback = (statusCode, payload) => {
      try {
        statusCode = typeof statusCode == "number" ? statusCode : 200;
        payload = typeof payload == "object" ? payload : {};
        const payloadString = JSON.stringify(payload);
        const headers = { "content-type": "application/json" };
        res.writeHead(statusCode, headers);
        res.end(payloadString);
      } catch (error) {
        console.error("Error in response: ", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ Error: "Internal Server Error" }));
      }
    };

    if (!selectedRouter) {
      handlerCallback(404, "Error: the selected url is invalid!");
    } else {
      selectedRouter(data, handlerCallback);
    }
  });
};

pizzaServer.httpsServer.listen(3000, () =>
  console.log("Pizza server is listening on port 3000.")
);

pizzaServer.routing = {
  users: handlers.users,
  tokens: handlers.tokens,
  pizzamenu: handlers.pizzamenu,
  shoppingcart: handlers.shoppingcart,
  order: handlers.order,
};
