import express from "express";
import "express-async-errors";
import Config from "config";
import makeLogger from "./startup/logger";
import makeMiddlewares from "./startup/middlewares";
import makeRoutes from "./startup/routes";
import swaggerDocs from "./utils/swagger";

const app = express();

//Startups
export const logger = makeLogger();
makeMiddlewares(app);
makeRoutes(app);

logger.info(`App Name: ${Config.get("name")}`);

//Publishing
const port = Config.get("port") as number;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    logger.info(`\n🚀 Start listing at port ${port}, any incoming requests?!`);

    swaggerDocs(app, port);
  });
}

export default app;
