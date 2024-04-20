import Joi from "joi";

/**
 * @openapi
 * components:
 *  schemas:
 *    CreateMagicItem:
 *      type: object
 *      required:
 *        - name
 *        - weightLimit
 *        - energy
 *      properties:
 *        name:
 *          type: string
 *          default: item 7
 *        weight:
 *          type: number
 *          default: 50
 *    CreateMagicItemResponse:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        name:
 *          type: string
 *        weightLimit:
 *          type: number
 *        isBeingUsed:
 *          type: boolean
 */
export default function validateMagicItem(
  magicItem: any
): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    weight: Joi.number().integer().positive().max(500).required(),
  });

  return schema.validate(magicItem, { abortEarly: false });
}
