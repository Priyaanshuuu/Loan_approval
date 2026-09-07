import type { BorrowerProfile, ProductType } from "@/types/borrower";

export interface ProductRoutingResult {
  product: ProductType;
  reasons: string[];
}

export function routeProduct(profile: BorrowerProfile): ProductRoutingResult {
  if (profile.requestedProduct) {
    return {
      product: profile.requestedProduct,
      reasons: ["using the product selected by the borrower"],
    };
  }

  if (profile.purpose === "lap") {
    return {
      product: "loan-against-property",
      reasons: ["loan purpose points to a property-backed route"],
    };
  }

  if (
    profile.purpose === "business" &&
    profile.collateralValue !== undefined &&
    profile.collateralValue > 0 &&
    profile.collateralEncumbered === false
  ) {
    return {
      product: "secured-business",
      reasons: [
        "productive business purpose",
        "unencumbered collateral may support a secured route",
      ],
    };
  }

  const productByPurpose: Partial<Record<"home" | "vehicle" | "gold", ProductType>> = {
    home: "home-loan",
    vehicle: "vehicle-loan",
    gold: "gold-loan",
  };
  const product = productByPurpose[profile.purpose as "home" | "vehicle" | "gold"];

  if (product) {
    return {
      product,
      reasons: [`${profile.purpose} purpose matches the product route`],
    };
  }

  return {
    product: "personal-loan",
    reasons: ["no secured or purpose-specific route was identified"],
  };
}