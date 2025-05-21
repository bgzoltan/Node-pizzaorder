import { pizzaServer } from "./util/server.js";
import { pizzaWorkers } from "./util/workers.js";
import { cli } from "./util/cli.js";

const app = {};

app.init = () => {
  pizzaServer.init();
  pizzaWorkers.init();
  setTimeout(()=>{
    cli.init();
  },50)
};

app.init();
