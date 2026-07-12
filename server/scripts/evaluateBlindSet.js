import crypto from "node:crypto";
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
  quiet: true
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


const jdCasesPath =
  path.join(
    projectRoot,
    "tests",
    "blind",
    "jd-cases.json"
  );


const contractCasesPath =
  path.join(
    projectRoot,
    "tests",
    "blind",
    "contract-cases.json"
  );


const reportPath =
  path.join(
    projectRoot,
    "reports",
    "blind-evaluation.json"
  );


const frozenServiceFiles = [
  path.join(
    projectRoot,
    "server",
    "src",
    "services",
    "jdReviewService.js"
  ),

  path.join(
    projectRoot,
    "server",
    "src",
    "services",
    "contractReviewService.js"
  )
];


function createEmptyMetrics() {
  return {
    tp: 0,
    fp: 0,
    tn: 0,
    fn: 0
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


  return (
    numerator
    /
    denominator
  );
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
  return Array
    .from(
      new Set(
        Array.isArray(
          ruleCodes
        )
          ?
          ruleCodes
            .filter(
              (
                ruleCode
              ) => {
                return (
                  typeof ruleCode
                  ===
                  "string"
                  &&
                  ruleCode.trim()
                    .length
                  >
                  0
                );
              }
            )
            .map(
              (
                ruleCode
              ) => {
                return ruleCode
                  .trim()
                  .toUpperCase();
              }
            )
          :
          []
      )
    )
    .sort();
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


async function readJsonFile(
  filePath
) {
  const rawText =
    await fs.readFile(
      filePath,
      "utf8"
    );


  return JSON.parse(
    rawText
  );
}


async function calculateSha256(
  filePath
) {
  const fileBuffer =
    await fs.readFile(
      filePath
    );


  return crypto
    .createHash(
      "sha256"
    )
    .update(
      fileBuffer
    )
    .digest(
      "hex"
    );
}


async function captureFrozenFileHashes() {
  const entries = [];


  for (
    const filePath
    of
    frozenServiceFiles
  ) {
    entries.push({
      path:
        path.relative(
          projectRoot,
          filePath
        ),

      sha256:
        await calculateSha256(
          filePath
        )
    });
  }


  return entries;
}


function validateDataset(
  dataset,
  datasetName
) {
  if (
    !dataset
    ||
    !Array.isArray(
      dataset.cases
    )
  ) {
    throw new Error(
      `${datasetName} 缺少 cases 数组。`
    );
  }


  const ids =
    new Set();


  for (
    const testCase
    of
    dataset.cases
  ) {
    if (
      typeof testCase.id
      !==
      "string"
      ||
      testCase.id.trim()
        .length
      ===
      0
    ) {
      throw new Error(
        `${datasetName} 存在无效 id。`
      );
    }


    if (
      ids.has(
        testCase.id
      )
    ) {
      throw new Error(
        `${datasetName} 存在重复 id：${testCase.id}`
      );
    }


    ids.add(
      testCase.id
    );


    if (
      typeof testCase.text
      !==
      "string"
      ||
      testCase.text.trim()
        .length
      ===
      0
    ) {
      throw new Error(
        `${datasetName} 的 ${testCase.id} 缺少有效 text。`
      );
    }


    if (
      typeof testCase.expectedRisk
      !==
      "boolean"
    ) {
      throw new Error(
        `${datasetName} 的 ${testCase.id} 缺少布尔型 expectedRisk。`
      );
    }


    if (
      !Array.isArray(
        testCase.expectedRuleCodes
      )
    ) {
      throw new Error(
        `${datasetName} 的 ${testCase.id} 缺少 expectedRuleCodes 数组。`
      );
    }
  }
}


async function evaluateDataset({
  dataset,
  datasetType,
  evaluateText
}) {
  const metrics =
    createEmptyMetrics();


  const evaluatedCases = [];

  const falsePositiveCases = [];

  const falseNegativeCases = [];

  const ruleMismatchCases = [];


  for (
    const testCase
    of
    dataset.cases
  ) {
    const result =
      await evaluateText(
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


    const ruleCodesMatch =
      areRuleCodesEqual(
        expectedRuleCodes,
        actualRuleCodes
      );


    const caseSummary = {
      id:
        testCase.id,

      text:
        testCase.text,

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

      ruleCodesMatch,

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
      !ruleCodesMatch
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


  const ruleExactMatchRate =
    roundMetric(
      safeDivide(
        evaluatedCases.length
        -
        ruleMismatchCases.length,
        evaluatedCases.length
      )
    );


  return {
    datasetType,

    sampleCount:
      evaluatedCases.length,

    metrics: {
      ...metrics,
      ...scores
    },

    ruleExactMatchRate,

    falsePositiveCount:
      falsePositiveCases.length,

    falseNegativeCount:
      falseNegativeCases.length,

    ruleMismatchCount:
      ruleMismatchCases.length,

    falsePositiveCases,

    falseNegativeCases,

    ruleMismatchCases,

    evaluatedCases
  };
}


async function main() {
  const frozenHashesBefore =
    await captureFrozenFileHashes();


  const jdDataset =
    await readJsonFile(
      jdCasesPath
    );


  const contractDataset =
    await readJsonFile(
      contractCasesPath
    );


  validateDataset(
    jdDataset,
    "JD 冻结留出测试集"
  );


  validateDataset(
    contractDataset,
    "合同冻结留出测试集"
  );


  const jdResult =
    await evaluateDataset({
      dataset:
        jdDataset,

      datasetType:
        "jd-review",

      evaluateText:
        async (
          text
        ) => {
          return evaluateJobDescriptionText({
            jdText:
              text
          });
        }
    });


  const contractResult =
    await evaluateDataset({
      dataset:
        contractDataset,

      datasetType:
        "contract-review",

      evaluateText:
        async (
          text
        ) => {
          return evaluateContractText({
            contractText:
              text
          });
        }
    });


  const frozenHashesAfter =
    await captureFrozenFileHashes();


  const frozenFilesUnchanged =
    JSON.stringify(
      frozenHashesBefore
    )
    ===
    JSON.stringify(
      frozenHashesAfter
    );


  const report = {
    metadata: {
      reportName:
        "Review engines frozen holdout evaluation",

      generatedAt:
        new Date()
          .toISOString(),

      disclaimer:
        "本报告基于人工编写的冻结留出样本。结果仅反映当前数据集表现，不代表真实互联网岗位或真实合同场景中的最终准确率。",

      serviceFilesFrozen:
        true,

      frozenFilesUnchanged
    },

    frozenFileHashes: {
      before:
        frozenHashesBefore,

      after:
        frozenHashesAfter
    },

    jd:
      jdResult,

    contract:
      contractResult
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
        frozenFilesUnchanged,

        jd: {
          sampleCount:
            jdResult.sampleCount,

          metrics:
            jdResult.metrics,

          ruleExactMatchRate:
            jdResult.ruleExactMatchRate,

          falsePositiveCount:
            jdResult.falsePositiveCount,

          falseNegativeCount:
            jdResult.falseNegativeCount,

          ruleMismatchCount:
            jdResult.ruleMismatchCount
        },

        contract: {
          sampleCount:
            contractResult.sampleCount,

          metrics:
            contractResult.metrics,

          ruleExactMatchRate:
            contractResult.ruleExactMatchRate,

          falsePositiveCount:
            contractResult.falsePositiveCount,

          falseNegativeCount:
            contractResult.falseNegativeCount,

          ruleMismatchCount:
            contractResult.ruleMismatchCount
        },

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


  if (
    !frozenFilesUnchanged
  ) {
    process.exitCode =
      1;
  }
}


main()
  .catch(
    (
      error
    ) => {
      console.error(
        "冻结留出评测失败："
      );


      console.error(
        error
      );


      process.exitCode =
        1;
    }
  );
