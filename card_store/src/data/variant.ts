type VariantMetadata = {
  alternate_art?: boolean | null;
  overnumbered?: boolean | null;
  signature?: boolean | null;
};

export type CardVariant = {
  alternate_art: boolean;
  overnumbered: boolean;
  signed: boolean;
};

export type CardFinish = "nonfoil" | "foil";
export type VariantQueryFlag = "normal" | "foil" | "nonfoil" | "aa" | "on" | "signed";

export function deriveCardVariant(metadata: VariantMetadata): CardVariant {
  const signed = Boolean(metadata.signature);

  return {
    alternate_art: Boolean(metadata.alternate_art),
    overnumbered: signed || Boolean(metadata.overnumbered),
    signed
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
    default:
      return null;
  }
}
