import { pizzaServer } from "./util/server.js";
import { pizzaWorkers } from "./util/workers.js";

const pizzaApp = {};

pizzaApp.init = () => {
  pizzaServer.init();
  pizzaWorkers.init();
};

pizzaApp.init();
