import { NextFunction, Request, Response } from "express";
import extractErrorMessagesJOI from "../utils/extractErrorMessagesJOI";
import constructErrorResponse from "../utils/constructErrorResponse";

export default function validateReq(validationFunction: Function) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    const result = validationFunction(req.body);
    if (result.error) {
      return res.status(400).json(
        constructErrorResponse(result.error, {
          validation: extractErrorMessagesJOI(result.error),
        })
      );
    }

    next();
  };
}
