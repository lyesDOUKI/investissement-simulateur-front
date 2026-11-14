import type {
  InvestmentComparison,
  Operation,
  ScenarioInput,
} from "@/domain/models/operation";
import { validateInvestmentInput } from "@/domain/rules/validate-investment-input";
import { ValueInvestment } from "./value-investment";

export class CompareInvestment {
  constructor(private readonly valueInvestment: ValueInvestment) {}

  async execute(
    original: Operation,
    scenario: ScenarioInput,
  ): Promise<InvestmentComparison> {
    validateInvestmentInput({
      kind: original.kind,
      amount: scenario.amount,
      date: original.date,
      allocations: scenario.allocations,
      executionDay: original.executionDay,
      delayBusinessDays: original.delayBusinessDays,
    });
    const alternative: Operation = {
      ...original,
      id: `${original.id}:scenario`,
      amount: scenario.amount,
      allocations: scenario.allocations,
    };
    const [baseValuation, alternativeValuation] = await Promise.all([
      this.valueInvestment.execute(original, scenario.valuationDate),
      this.valueInvestment.execute(alternative, scenario.valuationDate),
    ]);
    return {
      original: baseValuation,
      alternative: alternativeValuation,
      difference: {
        invested: alternativeValuation.invested - baseValuation.invested,
        value: alternativeValuation.value - baseValuation.value,
        gain: alternativeValuation.gain - baseValuation.gain,
      },
    };
  }
}
