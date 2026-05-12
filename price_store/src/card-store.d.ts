declare module "@noxiannet/card-store" {
  export type CardRecord = {
    id: string;
    riot_name: string;
    clean_name: string | null;
    riftbound_id: string | null;
    tcgplayer_id: string | null;
    collector_number: string | null;
    language: string;
    rarity: string | null;
    variant: {
      alternate_art: boolean;
      overnumbered: boolean;
      signed: boolean;
    };
    finishes: Array<"nonfoil" | "foil">;
    attributes: {
      cost: string | null;
      energy: number | null;
      might: number | null;
      power: number | null;
      domain: string[];
    };
    type: {
      cardtype: string | null;
      supertype: string | null;
      tags: string[];
      typeline: string;
    };
    text: {
      rich: string;
      plain: string;
      flavour: string | null;
      keywords: string[];
    };
    set: {
      set_id: string;
      label: string;
    };
    media: {
      image_url: string | null;
      artist: string | null;
      accessibility_text: string | null;
      layout: string;
    };
  };

  export function loadCards(): Promise<CardRecord[]>;
}
