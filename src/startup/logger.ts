import devLogger from "./dev-logger";
import { Logger } from "winston";

export default () => {
  let logger: Logger = devLogger();

  return logger;
};
