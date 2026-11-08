export interface OperatorBrand {
  color: string;
  logo: string | null;
}

// Full collector coverage; keep aligned with backend operatorDefinitions.
// Logo provenance is recorded in public/operators/sources.json.
export const operatorBrands: Record<string, OperatorBrand> = {
  Sosh: { color: "#0075c9", logo: "/operators/sosh.svg" },
  "RED by SFR": { color: "#00dc91", logo: "/operators/red.svg" },
  "B&You": { color: "#0055a3", logo: "/operators/byou.png" },
  "Free Mobile": { color: "#e0000a", logo: "/operators/free.svg" },
  YouPrice: { color: "#3b90f4", logo: "/operators/youprice.svg" },
  Coriolis: { color: "#4dbdc6", logo: "/operators/coriolis.svg" },
  "La Poste Mobile": { color: "#ffd300", logo: "/operators/laposte.svg" },
  "NRJ Mobile": { color: "#f00023", logo: "/operators/nrj.svg" },
  "Auchan Telecom": { color: "#d6180b", logo: "/operators/auchan.svg" },
  "Cdiscount Mobile": { color: "#3732ff", logo: "/operators/cdiscount.png" },
  "Syma Mobile": { color: "#ec1c24", logo: "/operators/syma.svg" },
  Lebara: { color: "#2d29dc", logo: "/operators/lebara.svg" },
  Lycamobile: { color: "#00d473", logo: "/operators/lyca.png" },
  Prixtel: { color: "#545fff", logo: "/operators/prixtel.svg" },
  TeleCoop: { color: "#00d566", logo: "/operators/telecoop.svg" },
  "Akeo Telecom": { color: "#91d6d2", logo: "/operators/akeo.svg" },
  Nordnet: { color: "#ff6c00", logo: "/operators/nordnet.svg" },
  "France Téléphone": { color: "#39a8d7", logo: "/operators/france.png" },
};

export const analyzedOperatorNames = Object.keys(operatorBrands);
const normalizeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const brandsByName = new Map(
  Object.entries(operatorBrands).map(([name, brand]) => [
    normalizeName(name),
    brand,
  ]),
);

export function getOperatorBrand(name: string): OperatorBrand {
  return (
    brandsByName.get(normalizeName(name)) ?? { color: "#7d7d73", logo: null }
  );
}
