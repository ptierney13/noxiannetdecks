import type { SeededPackDefinition } from "./types.js";

function refs(setId: SeededPackDefinition["setId"], collectorNumbers: string[]) {
  return collectorNumbers.map((collectorNumber) => ({ setId, collectorNumber }));
}

export const seededPackDefinitions: SeededPackDefinition[] = [
  {
    id: "sfd-ezreal",
    setId: "SFD",
    label: "Ezreal",
    cardRefs: refs("SFD", ["199", "215", "122", "124", "066", "069", "129", "138", "067", "070", "078", "126", "077", "082", "132"])
  },
  {
    id: "sfd-renata-glasc",
    setId: "SFD",
    label: "Renata Glasc",
    cardRefs: refs("SFD", ["201", "214", "063", "064", "069", "155", "162", "070", "074", "154", "072", "171", "158", "165", "152"])
  },
  {
    id: "sfd-lucian",
    setId: "SFD",
    label: "Lucian",
    cardRefs: refs("SFD", ["183", "218", "009", "097", "108", "001", "007", "011", "016", "095", "099", "096", "107", "113", "002"])
  },
  {
    id: "sfd-reksai",
    setId: "SFD",
    label: "Rek'Sai",
    cardRefs: refs("SFD", ["187", "217", "003", "004", "018", "151", "159", "006", "010", "015", "156", "157", "161", "164", "170"])
  },
  {
    id: "sfd-jax",
    setId: "SFD",
    label: "Jax",
    cardRefs: refs("SFD", ["193", "213", "033", "040", "041", "042", "095", "098", "102", "107", "037", "093", "054", "092", "035"])
  },
  {
    id: "sfd-irelia",
    setId: "SFD",
    label: "Irelia",
    cardRefs: refs("SFD", ["195", "220", "124", "034", "036", "045", "130", "038", "039", "133", "048", "125", "137", "141", "127"])
  },
  {
    id: "unl-ivern",
    setId: "UNL",
    label: "Ivern",
    cardRefs: refs("UNL", ["195", "217", "051", "046", "032", "159", "036", "155", "154", "156", "044", "033", "166", "160", "167"])
  },
  {
    id: "unl-master-yi",
    setId: "UNL",
    label: "Master Yi",
    cardRefs: refs("UNL", ["191", "213", "113", "039", "031", "038", "107", "040", "094", "043", "047", "034", "108", "091", "100"])
  },
  {
    id: "unl-jhin",
    setId: "UNL",
    label: "Jhin",
    cardRefs: refs("UNL", ["181", "211", "022", "074", "013", "061", "065", "009", "004", "017", "073", "062", "069", "064", "005"])
  },
  {
    id: "unl-khazix",
    setId: "UNL",
    label: "Kha'Zix",
    cardRefs: refs("UNL", ["201", "214", "143", "136", "095", "092", "124", "127", "096", "101", "097", "102", "135", "129", "126"])
  },
  {
    id: "unl-diana",
    setId: "UNL",
    label: "Diana",
    cardRefs: refs("UNL", ["197", "205", "079", "134", "131", "065", "063", "072", "075", "125", "071", "121", "122", "130", "066"])
  },
  {
    id: "unl-vi",
    setId: "UNL",
    label: "Vi",
    cardRefs: refs("UNL", ["187", "218", "176", "007", "002", "153", "006", "155", "152", "017", "163", "160", "012", "001", "018"])
  }
];
