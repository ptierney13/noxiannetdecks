import { z } from "zod";

const nullableString = z.string().nullable();
const nullableNumber = z.number().int().nullable();
const collectorNumberSchema = z.union([z.string().min(1), z.number().int()]).transform(String).nullable();
const finishSchema = z.enum(["nonfoil", "foil"]);

export const cardRecordSchema = z.object({
  id: z.string().min(1),
  riot_name: z.string().min(1),
  clean_name: nullableString,
  riftbound_id: nullableString,
  tcgplayer_id: nullableString,
  collector_number: collectorNumberSchema,
  language: z.string().min(2),
  rarity: nullableString,
  variant: z.object({
    alternate_art: z.boolean(),
    overnumbered: z.boolean(),
    signed: z.boolean(),
    metal: z.boolean(),
    starter: z.boolean(),
    gg_ez: z.boolean(),
    launch_exclusive: z.boolean(),
    ultimate: z.boolean(),
  }),
  finishes: z.array(finishSchema).min(1),
  attributes: z.object({
    cost: z.string().nullable(),
    energy: nullableNumber,
    might: nullableNumber,
    power: nullableNumber,
    domain: z.array(z.string().min(1))
  }),
  type: z.object({
    cardtype: nullableString,
    supertype: nullableString,
    tags: z.array(z.string().min(1)),
    typeline: z.string()
  }),
  text: z.object({
    rich: z.string(),
    plain: z.string(),
    flavour: nullableString,
    keywords: z.array(z.string().min(1))
  }),
  set: z.object({
    set_id: z.string().min(1),
    label: z.string().min(1)
  }),
  media: z.object({
    image_url: nullableString,
    artist: nullableString,
    accessibility_text: nullableString,
    layout: z.string().min(1)
  })
}).superRefine((card, context) => {
  if (new Set(card.finishes).size !== card.finishes.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["finishes"],
      message: "finishes must not contain duplicate values"
    });
  }

  if (card.variant.signed && !card.variant.overnumbered) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["variant", "overnumbered"],
      message: "signed treatments must also be overnumbered"
    });
  }
});

export const cardDatabaseSchema = z.array(cardRecordSchema);

export type CardRecord = z.infer<typeof cardRecordSchema>;
export type CardDatabase = z.infer<typeof cardDatabaseSchema>;
