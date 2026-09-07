import {
  COLLATERAL_ASSUMPTIONS,
  ELIGIBILITY_ASSUMPTIONS,
  PRODUCT_ASSUMPTIONS,
} from "@/data/assumptions";
import { calculatePrincipalFromEmi } from "@/lib/engine/loanMath";
import type {
  BorrowerProfile,
  NumericRange,
  ProductType,
} from "@/types/borrower";
import type { AffordabilityResult } from "@/lib/engine/affordability";
import type { RateAssessment } from "@/lib/engine/rates";

export interface EligibilityAssessment {
  lenderRange: NumericRange;
  constraints: string[];
}

export function estimateLenderRange(
  profile: BorrowerProfile,
  affordability: AffordabilityResult,
  rates: RateAssessment,
  product: ProductType,
): EligibilityAssessment {
  if (affordability.newEmiCapacity <= 0) {
    return {
      lenderRange: { min: 0, max: 0 },
      constraints: ["existing debt leaves no base EMI capacity"],
    };
  }

  const productAssumption = PRODUCT_ASSUMPTIONS[product];
  const affordabilityMaximum = calculatePrincipalFromEmi(
    affordability.newEmiCapacity,
    rates.rate.max,
    productAssumption.maximumTenureMonths,
  );
  let maximum = affordabilityMaximum;
  const constraints = ["modeled from base debt-service capacity"];

  if (
    productAssumption.secured &&
    typeof profile.collateralValue === "number" &&
    profile.collateralValue > 0 &&
    profile.collateralEncumbered === false
  ) {
    maximum = Math.min(
      maximum,
      profile.collateralValue * COLLATERAL_ASSUMPTIONS.maximumLoanToValue,
    );
    constraints.push("limited by the modeled collateral LTV");
  }

  maximum = Math.max(0, maximum);
  const minimum =
    maximum * ELIGIBILITY_ASSUMPTIONS.lenderRangeFloorRatio;

  return {
    lenderRange: {
      min: minimum,
      max: maximum,
    },
    constraints,
  };
}