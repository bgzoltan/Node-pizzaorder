// to test and communicate with the server I used postman
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import url from "url";
import fs from "fs";
import { StringDecoder } from "string_decoder";
import { handlers } from "./handlers.js";

export const pizzaServer = {};
// Define __filename and __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// To provide ssl support must to create cert and key files:
// openssl req -newkey rsa:2048 -new -nodes -x509 -days 365 -keyout key.pem -out cert.pem
pizzaServer.httpsParams = {
  cert: fs.readFileSync(path.join(__dirname, "../https/localhost.pem")),
  key: fs.readFileSync(path.join(__dirname, "../https/localhost-key.pem")),
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
  const trimmedPath = pathName.slice(1);
  const decoder = new StringDecoder("utf-8");

  let payloadBuffer = "";
  req.on("data", (dataChunk) => {
    payloadBuffer = payloadBuffer + decoder.write(dataChunk);
  });

  req.on("end", () => {
    payloadBuffer += decoder.end();

    const data = {
      headers,
      pathName,
      trimmedPath,
      method,
      query,
      payload: payloadBuffer,
    };

    let selectedRouter = false;
    if (trimmedPath.includes("public")) {
      selectedRouter = typeof Object.keys(pizzaServer.routing).includes(
        "public"
      )
        ? pizzaServer.routing["public"]
        : false;
    } else {

      selectedRouter =
        typeof pizzaServer.routing[trimmedPath] !== undefined
          ? pizzaServer.routing[trimmedPath]
          : false;
    }

    const handlerCallback = (statusCode, payload, contentType = "json") => {
      try {
        statusCode = typeof statusCode == "number" ? statusCode : 200;
        let payloadString = "";
        let headers = { "Content-Type": "application/json" };

        if (contentType == "json") {
          payload = typeof payload == "object" ? payload : {};
          payloadString = JSON.stringify(payload);
        }


        if (payload._method) {data.method=payload._method; delete payload._method}

        if (contentType == "html") {
          headers = { "Content-Type": "text/html" };
          payload = typeof payload === "string" ? payload : "";
          payloadString = payload;
        }
        if (contentType == "js") {
          headers = { "Content-Type": "text/javascript" };
          payload = typeof Buffer.isBuffer(payload) ? payload : "";
          payloadString = payload;
        }
        if (contentType == "css") {
          headers = { "Content-Type": "text/css" };
          payload = typeof Buffer.isBuffer(payload) ? payload : "";
          payloadString = payload;
        }
        if (contentType == "jpeg") {
          headers = { "Content-Type": "image/jpeg" };
          payload = typeof Buffer.isBuffer(payload) ? payload : "";
          payloadString = payload;
        }
        if (contentType == "png") {
          headers = { "Content-Type": "image/png" };
          payload = typeof Buffer.isBuffer(payload) ? payload : "";
          payloadString = payload;
        }
        if (contentType == "ico") {
          headers = { "Content-Type": "image/x-icon" };
          payload = typeof Buffer.isBuffer(payload) ? payload : "";
          payloadString = payload;
        }

  
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

pizzaServer.routing = {
  "": handlers.index,
  "account/create": handlers.accountCreate,
  "account/edit": handlers.accountEdit,
  "account/delete": handlers.accountDelete,
  "account/login": handlers.login,
  "account/logout": handlers.logout,
  "action/menulist": handlers.menulist,
  "action/menuorder": handlers.menuorder,
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/menu": handlers.menu,
  "api/shoppingcart": handlers.shoppingcart,
  "api/order": handlers.order,
  "api/logoutcheck": handlers.logoutcheck,
  public: handlers.public,
};

pizzaServer.init = () => {
  pizzaServer.httpsServer.listen(3000, () =>
    console.log("Pizza server is listening on port 3000.")
  );
};
