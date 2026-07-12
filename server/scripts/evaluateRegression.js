import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

import {
  evaluateJobDescriptionText
} from "../src/services/jdReviewService.js";

import {
  evaluateContractText
} from "../src/services/contractReviewService.js";


dotenv.config({
  quiet:
    true
});


const currentFilePath =
  fileURLToPath(
    import.meta.url
  );

const currentDirectory =
  path.dirname(
    currentFilePath
  );

const projectRoot =
  path.resolve(
    currentDirectory,
    "..",
    ".."
  );

const casesPath =
  path.join(
    projectRoot,
    "tests",
    "regression",
    "cases.json"
  );

const reportPath =
  path.join(
    projectRoot,
    "reports",
    "regression-evaluation.json"
  );


function createEmptyMetrics() {
  return {
    tp:
      0,
    fp:
      0,
    tn:
      0,
    fn:
      0
  };
}


function safeDivide(
  numerator,
  denominator
) {
  if (
    denominator
    ===
    0
  ) {
    return 0;
  }

  return numerator
    /
    denominator;
}


function roundMetric(
  value
) {
  return Number(
    value.toFixed(
      4
    )
  );
}


function calculateScores(
  metrics
) {
  const total =
    metrics.tp
    +
    metrics.fp
    +
    metrics.tn
    +
    metrics.fn;

  const accuracy =
    safeDivide(
      metrics.tp
      +
      metrics.tn,
      total
    );

  const precision =
    safeDivide(
      metrics.tp,
      metrics.tp
      +
      metrics.fp
    );

  const recall =
    safeDivide(
      metrics.tp,
      metrics.tp
      +
      metrics.fn
    );

  const f1 =
    safeDivide(
      2
      *
      precision
      *
      recall,
      precision
      +
      recall
    );

  return {
    accuracy:
      roundMetric(
        accuracy
      ),
    precision:
      roundMetric(
        precision
      ),
    recall:
      roundMetric(
        recall
      ),
    f1:
      roundMetric(
        f1
      )
  };
}


function normalizeRuleCodes(
  ruleCodes
) {
  return [
    ...new Set(
      ruleCodes
    )
  ].sort();
}


function areRuleCodesEqual(
  expectedRuleCodes,
  actualRuleCodes
) {
  return JSON.stringify(
    normalizeRuleCodes(
      expectedRuleCodes
    )
  )
  ===
  JSON.stringify(
    normalizeRuleCodes(
      actualRuleCodes
    )
  );
}


async function evaluateGroup({
  cases,
  kind,
  evaluate
}) {
  const metrics =
    createEmptyMetrics();

  const falsePositiveCases = [];
  const falseNegativeCases = [];
  const ruleMismatchCases = [];
  const evaluatedCases = [];

  for (
    const testCase
    of
    cases
  ) {
    const result =
      await evaluate(
        testCase.text
      );

    const actualRuleCodes =
      normalizeRuleCodes(
        result.findings.map(
          (
            finding
          ) => {
            return finding.ruleCode;
          }
        )
      );

    const expectedRuleCodes =
      normalizeRuleCodes(
        testCase.expectedRuleCodes
      );

    const actualRisk =
      result.findingCount
      >
      0;

    if (
      testCase.expectedRisk
      &&
      actualRisk
    ) {
      metrics.tp +=
        1;
    } else if (
      !testCase.expectedRisk
      &&
      actualRisk
    ) {
      metrics.fp +=
        1;
    } else if (
      !testCase.expectedRisk
      &&
      !actualRisk
    ) {
      metrics.tn +=
        1;
    } else {
      metrics.fn +=
        1;
    }

    const evaluatedCase = {
      id:
        testCase.id,
      kind,
      text:
        testCase.text,
      expectedRisk:
        testCase.expectedRisk,
      actualRisk,
      expectedRuleCodes,
      actualRuleCodes,
      notes:
        testCase.notes
    };

    evaluatedCases.push(
      evaluatedCase
    );

    if (
      !testCase.expectedRisk
      &&
      actualRisk
    ) {
      falsePositiveCases.push(
        evaluatedCase
      );
    }

    if (
      testCase.expectedRisk
      &&
      !actualRisk
    ) {
      falseNegativeCases.push(
        evaluatedCase
      );
    }

    if (
      !areRuleCodesEqual(
        expectedRuleCodes,
        actualRuleCodes
      )
    ) {
      ruleMismatchCases.push(
        evaluatedCase
      );
    }
  }

  return {
    sampleCount:
      cases.length,
    metrics: {
      ...metrics,
      ...calculateScores(
        metrics
      )
    },
    falsePositiveCases,
    falseNegativeCases,
    ruleMismatchCases,
    evaluatedCases
  };
}


function addMetrics(
  firstMetrics,
  secondMetrics
) {
  return {
    tp:
      firstMetrics.tp
      +
      secondMetrics.tp,
    fp:
      firstMetrics.fp
      +
      secondMetrics.fp,
    tn:
      firstMetrics.tn
      +
      secondMetrics.tn,
    fn:
      firstMetrics.fn
      +
      secondMetrics.fn
  };
}


async function main() {
  const rawCases =
    await fs.readFile(
      casesPath,
      "utf8"
    );

  const dataset =
    JSON.parse(
      rawCases
    );

  const jd =
    await evaluateGroup({
      cases:
        dataset.jdCases,
      kind:
        "jd",
      evaluate:
        async (
          text
        ) => {
          return evaluateJobDescriptionText({
            jdText:
              text
          });
        }
    });

  const contract =
    await evaluateGroup({
      cases:
        dataset.contractCases,
      kind:
        "contract",
      evaluate:
        async (
          text
        ) => {
          return evaluateContractText({
            contractText:
              text
          });
        }
    });

  const combinedBaseMetrics =
    addMetrics(
      jd.metrics,
      contract.metrics
    );

  const combined = {
    sampleCount:
      jd.sampleCount
      +
      contract.sampleCount,
    metrics: {
      ...combinedBaseMetrics,
      ...calculateScores(
        combinedBaseMetrics
      )
    }
  };

  const report = {
    metadata:
      dataset.metadata,
    generatedAt:
      new Date().toISOString(),
    note:
      "本报告基于新增人工构造回归样本，指标只反映当前回归测试集表现，不代表真实互联网数据中的最终准确率；confidence 不等于 accuracy。",
    jd,
    contract,
    combined
  };

  await fs.mkdir(
    path.dirname(
      reportPath
    ),
    {
      recursive:
        true
    }
  );

  await fs.writeFile(
    reportPath,
    JSON.stringify(
      report,
      null,
      2
    )
    +
    "\n",
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        jd: {
          sampleCount:
            jd.sampleCount,
          metrics:
            jd.metrics,
          falsePositiveCount:
            jd.falsePositiveCases.length,
          falseNegativeCount:
            jd.falseNegativeCases.length,
          ruleMismatchCount:
            jd.ruleMismatchCases.length
        },
        contract: {
          sampleCount:
            contract.sampleCount,
          metrics:
            contract.metrics,
          falsePositiveCount:
            contract.falsePositiveCases.length,
          falseNegativeCount:
            contract.falseNegativeCases.length,
          ruleMismatchCount:
            contract.ruleMismatchCases.length
        },
        combined,
        reportPath:
          path.relative(
            projectRoot,
            reportPath
          )
      },
      null,
      2
    )
  );

  process.exit(0);
}


main()
  .catch(
    (
      error
    ) => {
      console.error(
        "Regression evaluation failed:",
        error
      );

      process.exit(1);
    }
  );
