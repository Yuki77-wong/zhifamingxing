import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

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
    "contract-review",
    "cases.json"
  );

const reportPath =
  path.join(
    projectRoot,
    "reports",
    "contract-review-evaluation.json"
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

  const metrics =
    createEmptyMetrics();

  const falsePositiveCases = [];
  const falseNegativeCases = [];
  const ruleMismatchCases = [];
  const evaluatedCases = [];

  for (
    const testCase
    of
    dataset.cases
  ) {
    const result =
      await evaluateContractText({
        contractText:
          testCase.text
      });

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

    const caseSummary = {
      id:
        testCase.id,
      expectedRisk:
        testCase.expectedRisk,
      actualRisk,
      expectedRuleCodes,
      actualRuleCodes,
      findingCount:
        result.findingCount,
      overallScore:
        result.overallScore,
      overallLevel:
        result.overallLevel,
      notes:
        testCase.notes
    };

    evaluatedCases.push(
      caseSummary
    );

    if (
      !testCase.expectedRisk
      &&
      actualRisk
    ) {
      falsePositiveCases.push(
        caseSummary
      );
    }

    if (
      testCase.expectedRisk
      &&
      !actualRisk
    ) {
      falseNegativeCases.push(
        caseSummary
      );
    }

    if (
      !areRuleCodesEqual(
        expectedRuleCodes,
        actualRuleCodes
      )
    ) {
      ruleMismatchCases.push(
        caseSummary
      );
    }
  }

  const scores =
    calculateScores(
      metrics
    );

  const report = {
    metadata:
      dataset.metadata,
    generatedAt:
      new Date().toISOString(),
    sampleCount:
      dataset.cases.length,
    note:
      "本报告基于人工构造测试样本，指标只反映当前测试集表现，不代表真实互联网数据中的最终准确率；confidence 不等于 accuracy。",
    metrics: {
      ...metrics,
      ...scores
    },
    falsePositiveCases,
    falseNegativeCases,
    ruleMismatchCases,
    evaluatedCases
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
        sampleCount:
          report.sampleCount,
        metrics:
          report.metrics,
        falsePositiveCount:
          falsePositiveCases.length,
        falseNegativeCount:
          falseNegativeCases.length,
        ruleMismatchCount:
          ruleMismatchCases.length,
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
        "Contract review evaluation failed:",
        error
      );

      process.exit(1);
    }
  );
