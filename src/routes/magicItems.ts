import express from "express";
import validateReq from "../middleware/validateReq";
import validateMagicItem from "../schemas/magicItem";
import magicItems from "../../data/magicItems.json";
import { v4 as uuid } from "uuid";
import fs from "fs";
import constructErrorResponse from "../utils/constructErrorResponse";

const router = express.Router();

/**
 * @openapi
 * '/api/magic-items':
 *  get:
 *     tags:
 *     - Magic Items
 *     summary: Get magic items
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              default: []
 */
router.get("/", async (req, res) => {
  res.json(magicItems);
});

/**
 * @openapi
 * '/api/magic-items':
 *  post:
 *     tags:
 *     - Magic Items
 *     summary: Add a magic item
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/CreateMagicItem'
 *     responses:
 *      201:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateMagicItemResponse'
 *      400:
 *        description: Bad Request
 *      409:
 *        description: Conflict
 */
router.post("/", validateReq(validateMagicItem), async (req, res, next) => {
  if (magicItems.some((magicItem) => magicItem.name === req.body.name))
    return res.status(409).send(
      constructErrorResponse(new Error(), {
        validation: { name: "The name is already used." },
      })
    );

  const magicItem = {
    id: uuid(),
    ...req.body,
    isBeingUsed: false,
  };

  fs.writeFileSync(
    __dirname + "/../../data/magicItems.json",
    JSON.stringify([...magicItems, magicItem])
  );

  res.status(201).json(magicItem);
});

export default router;
