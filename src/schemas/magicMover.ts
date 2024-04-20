import Joi from "joi";

export const QUEST_STATES = {
  resting: "RESTING",
  loading: "LOADING",
  onMission: "ON_MISSION",
  done: "DONE",
};

/**
 * @openapi
 * components:
 *  schemas:
 *    CreateMagicMover:
 *      type: object
 *      required:
 *        - name
 *        - weightLimit
 *        - energy
 *      properties:
 *        name:
 *          type: string
 *          default: mover 7
 *        weightLimit:
 *          type: number
 *          default: 50
 *        energy:
 *          type: number
 *          default: 4
 *    CreateMagicMoverResponse:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        name:
 *          type: string
 *        weightLimit:
 *          type: number
 *        energy:
 *          type: number
 *        questState:
 *          type: string
 */
export default function validateMagicMover(
  magicMover: any
): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    weightLimit: Joi.number().positive().max(500).integer().required(),
    energy: Joi.number().positive().max(500).integer().required(),
  });

  return schema.validate(magicMover, { abortEarly: false });
}

/**
 * @openapi
 * components:
 *  schemas:
 *    LoadMover:
 *      type: object
 *      required:
 *        - magicItemsIds
 *      properties:
 *        magicItemsIds:
 *          type: array
 *          items:
 *            type: string
 *          default: ["14983d67-8096-4c3d-a50b-af67a491ea84"]
 *    LoadMoverResponse:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        magicItemsIds:
 *          type: array
 *          default: ["14983d67-8096-4c3d-a50b-af67a491ea84"]
 *        moverId:
 *          type: string
 *        questState:
 *          type: string
 */
export function validateMagicMoverLoad(magicMover: any): Joi.ValidationResult {
  const schema = Joi.object({
    magicItemsIds: Joi.array().items(Joi.string()).min(1),
  });

  return schema.validate(magicMover, { abortEarly: false });
}
