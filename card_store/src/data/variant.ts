type VariantMetadata = {
  alternate_art?: boolean | null;
  overnumbered?: boolean | null;
  signature?: boolean | null;
  metal?: boolean | null;
  starter?: boolean | null;
  gg_ez?: boolean | null;
  launch_exclusive?: boolean | null;
  ultimate?: boolean | null;
};

export type CardVariant = {
  alternate_art: boolean;
  overnumbered: boolean;
  signed: boolean;
  metal: boolean;
  starter: boolean;
  gg_ez: boolean;
  launch_exclusive: boolean;
  ultimate: boolean;
};

export type CardFinish = "nonfoil" | "foil";
export type VariantQueryFlag = "normal" | "foil" | "nonfoil" | "aa" | "on" | "signed" | "mtl" | "ult" | "ggez" | "lex" | "str";

export function deriveCardVariant(metadata: VariantMetadata): CardVariant {
  const signed = Boolean(metadata.signature);

  return {
    alternate_art: Boolean(metadata.alternate_art),
    overnumbered: signed || Boolean(metadata.overnumbered),
    signed,
    metal: Boolean(metadata.metal),
    starter: Boolean(metadata.starter),
    gg_ez: Boolean(metadata.gg_ez),
    launch_exclusive: Boolean(metadata.launch_exclusive),
    ultimate: Boolean(metadata.ultimate),
  };
}

export function normalizeVariantQuery(value: string): VariantQueryFlag | null {
  const compact = value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  switch (compact) {
    case "normal":
      return "normal";
    case "foil":
      return "foil";
    case "nonfoil":
      return "nonfoil";
    case "on":
    case "overnumbered":
      return "on";
    case "aa":
    case "altart":
    case "alternateart":
      return "aa";
    case "sig":
    case "signed":
    case "signature":
      return "signed";
    case "mtl":
    case "metal":
      return "mtl";
    case "ult":
    case "ultimate":
      return "ult";
    case "ggez":
      return "ggez";
    case "lex":
    case "launchexclusive":
      return "lex";
    case "str":
    case "starter":
      return "str";
    default:
      return null;
  }
}
