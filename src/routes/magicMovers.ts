import express from "express";
import validateReq from "../middleware/validateReq";
import validateMagicMover, {
  QUEST_STATES,
  validateMagicMoverLoad,
} from "../schemas/magicMover";
import magicMovers from "../../data/magicMovers.json";
import magicItemsData from "../../data/magicItems.json";
import missions from "../../data/missions.json";
import { v4 as uuid } from "uuid";
import fs from "fs";
import constructErrorResponse from "../utils/constructErrorResponse";

const router = express.Router();

/**
 * @openapi
 * '/api/magic-movers':
 *  get:
 *     tags:
 *     - Magic Movers
 *     summary: Get magic movers
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
  res.json(
    magicMovers.map((m) => {
      const newM = { ...m };
      delete (newM as any).completedMissionsCount;
      return newM;
    })
  );
});

/**
 * @openapi
 * '/api/magic-movers':
 *  post:
 *     tags:
 *     - Magic Movers
 *     summary: Add a magic mover
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/CreateMagicMover'
 *     responses:
 *      201:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateMagicMoverResponse'
 *      400:
 *        description: Bad Request
 *      409:
 *        description: Conflict
 */
router.post("/", validateReq(validateMagicMover), async (req, res, next) => {
  if (magicMovers.some((magicMover) => magicMover.name === req.body.name))
    return res.status(409).json(
      constructErrorResponse(new Error(), {
        validation: { name: "The name is already used." },
      })
    );

  const magicMover = {
    id: uuid(),
    ...req.body,
    questState: QUEST_STATES.resting,
    completedMissionsCount: 0,
  };

  fs.writeFileSync(
    __dirname + "/../../data/magicMovers.json",
    JSON.stringify([...magicMovers, magicMover])
  );

  delete magicMover.completedMissionsCount;
  res.status(201).json(magicMover);
});

/**
 * @openapi
 * '/api/magic-movers/{moverId}/load':
 *  post:
 *     tags:
 *     - Magic Movers
 *     summary: Add load(s) to the mover (you can load a mover multiple times)
 *     parameters:
 *      - name: moverId
 *        in: path
 *        description: The id of the mover
 *        required: true
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/LoadMover'
 *     responses:
 *      201:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/LoadMoverResponse'
 *      400:
 *        description: Bad Request
 *      404:
 *        description: Not Found
 */
router.post(
  "/:moverId/load",
  validateReq(validateMagicMoverLoad),
  async (req, res) => {
    // Check if mover exists & bring it
    const magicMover = magicMovers.find(
      (magicMover) => magicMover.id === req.params.moverId
    );
    if (!magicMover)
      return res.status(404).json(
        constructErrorResponse(new Error(), {
          message: "Mover doesn't exist",
        })
      );

    // The mover state should't be on a mission
    if (magicMover.questState === QUEST_STATES.onMission)
      return res.status(400).json(
        constructErrorResponse(new Error(), {
          message: "The mover is on another mission.",
        })
      );

    // Bring the requested items
    const requestedMagicItemsIds = req.body.magicItemsIds as string[];
    const requestedMagicItems = magicItemsData.filter((magicItem) =>
      requestedMagicItemsIds.some((magicItemId) => magicItem.id === magicItemId)
    );

    // All items shouldn't be in use
    const itemInUse = requestedMagicItems.find(
      (magicItem) => magicItem.isBeingUsed
    );
    if (itemInUse)
      return res.status(400).json(
        constructErrorResponse(new Error(), {
          validation: {
            magicItemsIds: `Items ${itemInUse.name} is being used.`,
          },
        })
      );

    // TWO PATHS
    // Either there's no mission on the loading state for this mover
    // Or there's, so I gotta add on it the requested items
    const mission = missions.find((mission) => {
      if (
        mission.moverId === magicMover.id &&
        mission.questState === QUEST_STATES.loading
      )
        return true;
    });

    if (!mission) {
      /* THERE'S NO MISSION */
      // Check if the total weight has exceeded the mover weight limit
      const ItemsWeightSum = requestedMagicItems.reduce(
        (a, i) => a + i.weight,
        0
      );
      if (ItemsWeightSum > magicMover.weightLimit)
        return res.status(400).json(
          constructErrorResponse(new Error(), {
            message: "Items weight has exceeded the mover capacity.",
          })
        );

      // Create a mission
      const newMission = {
        id: uuid(),
        moverId: magicMover.id,
        itemsIds: requestedMagicItems.map((i) => i.id),
        questState: QUEST_STATES.loading,
      };
      fs.writeFileSync(
        __dirname + "/../../data/missions.json",
        JSON.stringify([...missions, newMission])
      );

      // Mark the requested items as in use
      const newItems = [...magicItemsData].map((magicItem) => {
        if (requestedMagicItems.some((i) => i.id === magicItem.id)) {
          magicItem.isBeingUsed = true;
          return magicItem;
        }
        return magicItem;
      });
      fs.writeFileSync(
        __dirname + "/../../data/magicItems.json",
        JSON.stringify(newItems)
      );

      // Make the requested mover state to loading
      const newMovers = [...magicMovers].map((m) => {
        if (m.id === magicMover.id) {
          m.questState = QUEST_STATES.loading;
          return m;
        }
        return m;
      });
      fs.writeFileSync(
        __dirname + "/../../data/magicMovers.json",
        JSON.stringify(newMovers)
      );

      return res.json(newMission);
      /* END: THERE'S NO MISSION */
    }

    /* THERE'S A MISSION */
    // Extract the alreadyLoadedItems
    const alreadyLoadedItems = magicItemsData.filter((magicItem) =>
      mission.itemsIds.some((itemId) => itemId === magicItem.id)
    );

    // Check if the total weight has exceeded the mover weight limit
    const totalItemsWeight = alreadyLoadedItems
      .concat(requestedMagicItems)
      .reduce((a, i) => a + i.weight, 0);
    if (totalItemsWeight > magicMover.weightLimit)
      return res.status(400).json(
        constructErrorResponse(new Error(), {
          message: "Total items weight has exceeded the mover capacity",
        })
      );

    // Overwrite the missions by adding the new items
    const updatedMission = {
      ...mission,
      itemsIds: requestedMagicItemsIds.concat(
        alreadyLoadedItems.map((i) => i.id)
      ),
    };
    const newMissions = [...missions].map((m) => {
      if ((m.id = mission.id)) {
        m = updatedMission;
        return m;
      }
      return m;
    });
    fs.writeFileSync(
      __dirname + "/../../data/missions.json",
      JSON.stringify([...newMissions])
    );

    // Mark the newly requested items as in use
    const newItems = [...magicItemsData].map((magicItem) => {
      if (requestedMagicItems.some((i) => i.id === magicItem.id)) {
        magicItem.isBeingUsed = true;
        return magicItem;
      }
      return magicItem;
    });
    fs.writeFileSync(
      __dirname + "/../../data/magicItems.json",
      JSON.stringify(newItems)
    );

    res.json(updatedMission);
  }
);

/**
 * @openapi
 * '/api/magic-movers/rank':
 *  get:
 *     tags:
 *     - Magic Movers
 *     summary: Get top 5 movers (Who completed the most missions)
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              default: []
 */
router.get("/rank", (req, res) => {
  const magicMoversOrdered = magicMovers
    .sort((a, b) => b.completedMissionsCount - a.completedMissionsCount)
    .slice(0, 20)
    .map((i, index) => ({ id: i.id, name: i.name, rank: ++index }));

  res.json(magicMoversOrdered);
});

export default router;
