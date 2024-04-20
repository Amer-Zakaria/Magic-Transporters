import { Express } from "express";
import error from "../middleware/error";
import magicMovers from "../routes/magicMovers";
import magicItems from "../routes/magicItems";
import missions from "../routes/missions";
import Config from "config";

export default (app: Express) => {
  app.get("/", (req, res) =>
    res.json(`Hello from the home page of "${Config.get("name")}"`)
  );

  app.use("/api/magic-movers", magicMovers);
  app.use("/api/magic-items", magicItems);
  app.use("/api/missions", missions);

  app.use(error);
};
