import { z } from "zod";

export const justTcgVariantSchema = z.object({
  id: z.string().min(1),
  condition: z.string().min(1).nullable().optional(),
  printing: z.string().min(1).nullable().optional(),
  language: z.string().min(1).nullable().optional(),
  tcgplayerSkuId: z.string().min(1).nullable().optional(),
  price: z.number().nullable().optional(),
  lastUpdated: z.number().int().nonnegative().nullable().optional(),
  priceHistory: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  statistics: z.record(z.string(), z.unknown()).nullable().optional()
});

export const justTcgCardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  game: z.string().min(1),
  set: z.string().min(1).nullable().optional(),
  set_name: z.string().min(1).nullable().optional(),
  number: z.string().min(1).nullable().optional(),
  tcgplayerId: z.string().min(1).nullable().optional(),
  rarity: z.string().min(1).nullable().optional(),
  details: z.string().nullable().optional(),
  variants: z.array(justTcgVariantSchema).default([])
});

export const justTcgCardsResponseSchema = z.object({
  data: z.array(justTcgCardSchema).default([]),
  meta: z.record(z.string(), z.unknown()).optional(),
  _metadata: z.record(z.string(), z.unknown()).optional()
});

export type JustTcgVariant = z.infer<typeof justTcgVariantSchema>;
export type JustTcgCard = z.infer<typeof justTcgCardSchema>;
export type JustTcgCardsResponse = z.infer<typeof justTcgCardsResponseSchema>;
