import helmet from "helmet";
import express, { Express } from "express";
import compression from "compression";

export default (app: Express) => {
  app.use(express.json());
  app.use(compression());
  app.use(helmet());
};
