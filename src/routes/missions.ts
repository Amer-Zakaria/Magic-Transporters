import express from "express";
import { QUEST_STATES } from "../schemas/magicMover";
import magicMovers from "../../data/magicMovers.json";
import magicItemsData from "../../data/magicItems.json";
import missions from "../../data/missions.json";
import constructErrorResponse from "../utils/constructErrorResponse";
import fs from "fs";
import Joi from "joi";

const router = express.Router();

/**
 * @openapi
 * '/api/missions':
 *  get:
 *     tags:
 *     - Missions
 *     summary: Get the missions based on their states (You can get the missions in the loading state so you can start them)
 *     parameters:
 *       - name: state
 *         in: query
 *         description: The state of the missions
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - ON_MISSION
 *             - DONE
 *             - LOADING
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
  //validate
  const questStateSchema = Joi.string().valid(...Object.values(QUEST_STATES));
  const stateValidation = questStateSchema.validate(req.query.state);
  if (stateValidation.error) {
    return res.status(400).json(
      constructErrorResponse(new Error(), {
        message: `State should be on of (${Object.values(QUEST_STATES).join(
          " | "
        )})`,
      })
    );
  }
  const state = stateValidation.value;

  if (!state) return res.json(missions);

  res.json(missions.filter((mission) => mission.questState === state));
});

/**
 * @openapi
 * '/api/missions/{missionId}/start':
 *  patch:
 *     tags:
 *     - Missions
 *     summary: Start a mission that's in the loading state
 *     parameters:
 *      - name: missionId
 *        in: path
 *        description: The id of the mission
 *        required: true
 *     responses:
 *      201:
 *        description: Success
 *      400:
 *        description: Bad Request
 *      404:
 *        description: Not Found
 */
router.patch("/:missionId/start", async (req, res) => {
  // Check if mission exists & bring it
  const mission = missions.find(
    (mission) => mission.id === req.params.missionId
  );
  if (!mission)
    return res.status(404).send(
      constructErrorResponse(new Error(), {
        message: "Mission doesn't exist",
      })
    );

  // Mission should be loading
  if (mission.questState !== QUEST_STATES.loading)
    return res.status(400).json(
      constructErrorResponse(new Error(), {
        message: "Mission is not in the loading state",
      })
    );

  // Update mission state to onMission
  const updatedMission = {
    ...mission,
    questState: QUEST_STATES.onMission,
  };
  const newMissions = [...missions].map((m) => {
    if (m.id === mission.id) {
      m = updatedMission;
      return m;
    }
    return m;
  });
  fs.writeFileSync(
    __dirname + "/../../data/missions.json",
    JSON.stringify(newMissions)
  );

  // Make the mover onMission
  const newMovers = [...magicMovers].map((m) => {
    if (m.id === mission.moverId) {
      m.questState = QUEST_STATES.onMission;
      return m;
    }
    return m;
  });
  fs.writeFileSync(
    __dirname + "/../../data/magicMovers.json",
    JSON.stringify(newMovers)
  );

  res.json(updatedMission);
});

/**
 * @openapi
 * '/api/missions/{missionId}/end':
 *  patch:
 *     tags:
 *     - Missions
 *     summary: End a mission that's in the "ON_MISSION" state
 *     parameters:
 *      - name: missionId
 *        in: path
 *        description: The id of the mission
 *        required: true
 *     responses:
 *      201:
 *        description: Success
 *      400:
 *        description: Bad Request
 *      404:
 *        description: Not Found
 */
router.patch("/:missionId/end", async (req, res) => {
  // Check if mission exists & bring it
  const mission = missions.find(
    (mission) => mission.id === req.params.missionId
  );
  if (!mission)
    return res.status(404).send(
      constructErrorResponse(new Error(), {
        message: "Mission doesn't exist",
      })
    );

  // It should be onMission
  if (mission.questState !== QUEST_STATES.onMission)
    return res.status(400).json(
      constructErrorResponse(new Error(), {
        message: `Mission is not "${QUEST_STATES.onMission}" state`,
      })
    );

  // Update mission state to Done
  const updatedMission = {
    ...mission,
    questState: QUEST_STATES.done,
  };
  const newMissions = [...missions].map((m) => {
    if (m.id === mission.id) {
      m = updatedMission;
      return m;
    }
    return m;
  });
  fs.writeFileSync(
    __dirname + "/../../data/missions.json",
    JSON.stringify(newMissions)
  );

  // Make the items not in use
  const newItems = [...magicItemsData].map((magicItem) => {
    if (mission.itemsIds.some((itemId) => itemId === magicItem.id)) {
      magicItem.isBeingUsed = false;
      return magicItem;
    }
    return magicItem;
  });
  fs.writeFileSync(
    __dirname + "/../../data/magicItems.json",
    JSON.stringify(newItems)
  );

  // Make the mover done & add one to the completed missions count
  const newMovers = [...magicMovers].map((m) => {
    if (m.id === mission.moverId) {
      m.questState = QUEST_STATES.done;
      m.completedMissionsCount = ++m.completedMissionsCount;
      return m;
    }
    return m;
  });
  fs.writeFileSync(
    __dirname + "/../../data/magicMovers.json",
    JSON.stringify(newMovers)
  );

  res.json(updatedMission);
});

export default router;
