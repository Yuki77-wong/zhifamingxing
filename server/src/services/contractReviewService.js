import crypto from "node:crypto";

import pool from "../config/database.js";


const ENGINE_VERSION =
  "contract-rule-engine-0.1.0";


const SENTENCE_BOUNDARIES =
  new Set([
    "。",
    "！",
    "？",
    "；",
    ";",
    "\n"
  ]);


const GENERIC_NEGATIVE_PATTERNS = [
  /(?:不|无须|无需|不用|不得|禁止)[^。！？；;\n]{0,12}(?:收取|缴纳|交纳|支付|交付|扣押|扣留|上交|保管|办理)[^。！？；;\n]{0,24}(?:押金|保证金|培训费|培训贷款|贷款|分期|证件|身份证|毕业证|学生证|原件|内推费|费用|财物)/gu,
  /(?:仅|只)[^。！？；;\n]{0,8}(?:核验|查验|查看)[^。！？；;\n]{0,18}(?:身份证|证件|原件)/gu,
  /(?:免费|完全免费)[^。！？；;\n]{0,12}(?:培训|内推|推荐)/gu,
  /(?:培训|岗前培训|课程)[^。！？；;\n]{0,12}(?:免费|完全免费)/gu
];


const FLEXIBLE_RULE_PATTERNS = {
  CONTRACT_UPFRONT_DEPOSIT_OR_GUARANTEE: [
    /(?:入职|上岗|实习|报到|签约)?[^。！？；;\n]{0,12}(?:须|需|需要|要求|应当)?[^。！？；;\n]{0,8}(?:缴纳|交纳|支付|交付|付清)[^。！？；;\n]{0,18}(?:押金|保证金|岗位保证金|岗位押金|财物|服装费|资料费|工牌费|设备押金)/gu,
    /(?:押金|保证金|岗位保证金|岗位押金|设备押金)[^。！？；;\n]{0,18}(?:不退|暂扣|扣除|作为担保)/gu
  ],

  CONTRACT_DOCUMENT_WITHHELD: [
    /(?:扣押|扣留|上交|留存|统一保管|长期保管)[^。！？；;\n]{0,18}(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)/gu,
    /(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)[^。！？；;\n]{0,18}(?:由公司保管|统一保管|长期保管|扣押|扣留|留存|上交)/gu
  ],

  CONTRACT_PAID_TRAINING_OR_LOAN: [
    /(?:培训|课程)[^。！？；;\n]{0,20}(?:贷款|借款|分期|分期贷款|分期付款|分期支付)/gu,
    /(?:贷款|借款|分期|分期贷款|分期付款|分期支付)[^。！？；;\n]{0,20}(?:培训|课程)/gu,
    /(?:付费|缴费|交费|支付)[^。！？；;\n]{0,16}(?:培训|课程)[^。！？；;\n]{0,16}(?:入职|上岗|就业|安排工作|安排岗位|保就业)/gu
  ],

  CONTRACT_PAID_GUARANTEED_OFFER: [
    /(?:付费|收费|缴费|交费|支付)[^。！？；;\n]{0,16}(?:保录用|保证录用|保证安排岗位|保就业|内推|内部推荐|保证拿到offer|保证拿到 offer)/giu,
    /(?:保录用|保证录用|保证安排岗位|保就业|内推|内部推荐|保证拿到offer|保证拿到 offer)[^。！？；;\n]{0,16}(?:收费|付费|服务费|费用|缴费|交费|支付)/giu
  ]
};


function parseJsonArray(
  value
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value;
  }

  if (
    Buffer.isBuffer(
      value
    )
  ) {
    return parseJsonArray(
      value.toString("utf8")
    );
  }

  if (
    value === null
    ||
    value === undefined
    ||
    value === ""
  ) {
    return [];
  }

  try {
    const parsedValue =
      JSON.parse(
        value
      );

    return Array.isArray(
      parsedValue
    )
      ?
      parsedValue
      :
      [];
  } catch (error) {
    return [];
  }
}


function normalizeContractText(
  text
) {
  return text
    .replace(
      /\r\n/g,
      "\n"
    )
    .replace(
      /\r/g,
      "\n"
    )
    .replace(
      /[ \t]+/g,
      " "
    )
    .trim();
}


function createTextHash(
  text
) {
  return crypto
    .createHash(
      "sha256"
    )
    .update(
      text,
      "utf8"
    )
    .digest(
      "hex"
    );
}


function findAllTextOccurrences(
  text,
  searchText
) {
  const results = [];

  if (!searchText) {
    return results;
  }

  let searchStart =
    0;

  while (
    searchStart
    <
    text.length
  ) {
    const foundStart =
      text.indexOf(
        searchText,
        searchStart
      );

    if (
      foundStart
      ===
      -1
    ) {
      break;
    }

    results.push({
      start:
        foundStart,

      end:
        foundStart
        +
        searchText.length,

      matchedText:
        searchText,

      matchType:
        "exact"
    });

    searchStart =
      foundStart
      +
      Math.max(
        searchText.length,
        1
      );
  }

  return results;
}


function findAllRegexOccurrences(
  text,
  regularExpression
) {
  const results = [];

  regularExpression.lastIndex =
    0;

  let currentMatch;

  while (
    (
      currentMatch =
      regularExpression.exec(
        text
      )
    )
    !==
    null
  ) {
    const matchedText =
      currentMatch[0];

    results.push({
      start:
        currentMatch.index,

      end:
        currentMatch.index
        +
        matchedText.length,

      matchedText,

      matchType:
        "flexible"
    });

    if (
      matchedText.length
      ===
      0
    ) {
      regularExpression.lastIndex +=
        1;
    }
  }

  return results;
}


function deduplicateCandidates(
  candidates
) {
  const candidateMap =
    new Map();

  for (
    const candidate
    of
    candidates
  ) {
    const candidateKey =
      [
        candidate.start,
        candidate.end,
        candidate.matchedText
      ].join(":");

    if (
      !candidateMap.has(
        candidateKey
      )
    ) {
      candidateMap.set(
        candidateKey,
        candidate
      );
    }
  }

  return Array.from(
    candidateMap.values()
  );
}


function findClauseRange(
  text,
  evidenceStart,
  evidenceEnd
) {
  let clauseStart =
    evidenceStart;

  let clauseEnd =
    evidenceEnd;

  while (
    clauseStart
    >
    0
  ) {
    const previousCharacter =
      text[
        clauseStart
        -
        1
      ];

    if (
      SENTENCE_BOUNDARIES.has(
        previousCharacter
      )
    ) {
      break;
    }

    clauseStart -=
      1;
  }

  while (
    clauseEnd
    <
    text.length
  ) {
    const currentCharacter =
      text[
        clauseEnd
      ];

    clauseEnd +=
      1;

    if (
      SENTENCE_BOUNDARIES.has(
        currentCharacter
      )
    ) {
      break;
    }
  }

  return {
    start:
      clauseStart,

    end:
      clauseEnd,

    text:
      text
        .slice(
          clauseStart,
          clauseEnd
        )
        .trim()
  };
}


function createContextText({
  text,
  start,
  end
}) {
  const contextStart =
    Math.max(
      0,
      start
      -
      45
    );

  const contextEnd =
    Math.min(
      text.length,
      end
      +
      45
    );

  return text.slice(
    contextStart,
    contextEnd
  );
}


function hasNegativeExpression({
  contextText,
  negativePatterns
}) {
  for (
    const negativePattern
    of
    negativePatterns
  ) {
    if (
      contextText.includes(
        negativePattern
      )
    ) {
      return true;
    }
  }

  for (
    const regularExpression
    of
    GENERIC_NEGATIVE_PATTERNS
  ) {
    regularExpression.lastIndex =
      0;

    if (
      regularExpression.test(
        contextText
      )
    ) {
      return true;
    }
  }

  return false;
}


function calculateFindingConfidence({
  matchedText,
  matchType,
  hasLegalSource
}) {
  const baseConfidence =
    matchType
    ===
    "exact"
      ?
      0.86
      :
      0.82;

  const lengthBonus =
    Math.min(
      matchedText.length
      *
      0.008,
      0.1
    );

  const sourceBonus =
    hasLegalSource
      ?
      0.03
      :
      0;

  return Number(
    Math.min(
      baseConfidence
      +
      lengthBonus
      +
      sourceBonus,
      0.98
    )
      .toFixed(
        4
      )
  );
}


function combineRiskScores(
  findings
) {
  if (
    findings.length
    ===
    0
  ) {
    return 0;
  }

  const remainingSafety =
    findings.reduce(
      (
        currentSafety,
        finding
      ) => {
        const riskProbability =
          Math.min(
            Math.max(
              finding.riskScore
              /
              100,
              0
            ),
            1
          );

        return (
          currentSafety
          *
          (
            1
            -
            riskProbability
          )
        );
      },
      1
    );

  return Number(
    (
      100
      *
      (
        1
        -
        remainingSafety
      )
    )
      .toFixed(
        2
      )
  );
}


function calculateOverallConfidence(
  findings
) {
  if (
    findings.length
    ===
    0
  ) {
    return 0.68;
  }

  const confidenceTotal =
    findings.reduce(
      (
        total,
        finding
      ) => {
        return (
          total
          +
          finding.confidence
        );
      },
      0
    );

  return Number(
    (
      confidenceTotal
      /
      findings.length
    )
      .toFixed(
        4
      )
  );
}


function determineOverallLevel({
  overallScore,
  findings
}) {
  if (
    findings.some(
      (
        finding
      ) => {
        return (
          finding.riskLevel
          ===
          "critical"
        );
      }
    )
  ) {
    return "critical";
  }

  if (
    overallScore
    >=
    75
  ) {
    return "high";
  }

  if (
    overallScore
    >=
    40
  ) {
    return "medium";
  }

  return "low";
}


async function loadEnabledContractRules(
  connection
) {
  const [
    rows
  ] =
    await connection.query(
      `
        SELECT
          contract_rules.id,
          contract_rules.rule_code,
          contract_rules.rule_name,
          contract_rules.risk_category,
          contract_rules.risk_level,
          contract_rules.risk_score,
          contract_rules.match_type,
          contract_rules.patterns,
          contract_rules.negative_patterns,
          contract_rules.reason,
          contract_rules.advice,
          contract_rules.legal_source_id,
          contract_rules.applicability_note,

          legal_sources.title
            AS legal_title,

          legal_sources.issuing_authority
            AS legal_issuing_authority,

          legal_sources.document_number
            AS legal_document_number,

          legal_sources.article_number
            AS legal_article_number,

          legal_sources.source_type
            AS legal_source_type,

          legal_sources.source_url
            AS legal_source_url,

          legal_sources.citation_text
            AS legal_citation_text

        FROM contract_rules

        INNER JOIN legal_sources
          ON legal_sources.id =
          contract_rules.legal_source_id

        WHERE
          contract_rules.review_status =
          'reviewed'

          AND

          contract_rules.is_enabled =
          TRUE

          AND

          legal_sources.source_status =
          'current'

        ORDER BY
          FIELD(
            contract_rules.risk_level,
            'critical',
            'high',
            'medium',
            'low'
          ),
          contract_rules.id ASC
      `
    );

  return rows;
}


function createRuleCandidates({
  inputText,
  rule,
  patterns
}) {
  const candidates = [];

  for (
    const pattern
    of
    patterns
  ) {
    candidates.push(
      ...
      findAllTextOccurrences(
        inputText,
        pattern
      )
    );
  }

  const flexiblePatterns =
    FLEXIBLE_RULE_PATTERNS[
      rule.rule_code
    ]
    ||
    [];

  for (
    const regularExpression
    of
    flexiblePatterns
  ) {
    candidates.push(
      ...
      findAllRegexOccurrences(
        inputText,
        regularExpression
      )
    );
  }

  return deduplicateCandidates(
    candidates
  )
    .sort(
      (
        firstCandidate,
        secondCandidate
      ) => {
        if (
          firstCandidate.start
          !==
          secondCandidate.start
        ) {
          return (
            firstCandidate.start
            -
            secondCandidate.start
          );
        }

        return (
          secondCandidate
            .matchedText
            .length
          -
          firstCandidate
            .matchedText
            .length
        );
      }
    );
}


function analyzeRule({
  inputText,
  rule
}) {
  const patterns =
    parseJsonArray(
      rule.patterns
    );

  const negativePatterns =
    parseJsonArray(
      rule.negative_patterns
    );

  const candidates =
    createRuleCandidates({
      inputText,
      rule,
      patterns
    });

  const findings = [];

  const findingKeys =
    new Set();

  for (
    const candidate
    of
    candidates
  ) {
    const clauseRange =
      findClauseRange(
        inputText,
        candidate.start,
        candidate.end
      );

    const contextText =
      createContextText({
        text:
          inputText,

        start:
          candidate.start,

        end:
          candidate.end
      });

    if (
      hasNegativeExpression({
        contextText,
        negativePatterns
      })
    ) {
      continue;
    }

    const findingKey =
      [
        rule.id,
        clauseRange.start,
        clauseRange.end
      ].join(":");

    if (
      findingKeys.has(
        findingKey
      )
    ) {
      continue;
    }

    findingKeys.add(
      findingKey
    );

    const legalSource = {
      id:
        rule.legal_source_id,

      title:
        rule.legal_title,

      issuingAuthority:
        rule.legal_issuing_authority,

      documentNumber:
        rule.legal_document_number,

      articleNumber:
        rule.legal_article_number,

      sourceType:
        rule.legal_source_type,

      sourceUrl:
        rule.legal_source_url,

      citationText:
        rule.legal_citation_text
    };

    findings.push({
      ruleId:
        rule.id,

      ruleCode:
        rule.rule_code,

      ruleName:
        rule.rule_name,

      riskCategory:
        rule.risk_category,

      riskLevel:
        rule.risk_level,

      riskScore:
        Number(
          rule.risk_score
        ),

      matchedText:
        candidate.matchedText,

      evidenceText:
        clauseRange.text,

      reason:
        rule.reason,

      advice:
        rule.advice,

      applicabilityNote:
        rule.applicability_note,

      confidence:
        calculateFindingConfidence({
          matchedText:
            candidate.matchedText,

          matchType:
            candidate.matchType,

          hasLegalSource:
            true
        }),

      legalSource
    });

    if (
      findings.length
      >=
      2
    ) {
      break;
    }
  }

  return findings;
}


async function saveReview({
  connection,
  contractTitle,
  contractText,
  overallScore,
  overallLevel,
  overallConfidence,
  findings,
  processingTimeMs
}) {
  const [
    reviewResult
  ] =
    await connection.execute(
      `
        INSERT INTO contract_reviews
        (
          contract_title,
          contract_text,
          overall_score,
          overall_level,
          confidence,
          engine_version,
          finding_count,
          processing_time_ms
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        contractTitle
        ||
        null,

        contractText,

        overallScore,

        overallLevel,

        overallConfidence,

        ENGINE_VERSION,

        findings.length,

        processingTimeMs
      ]
    );

  const reviewId =
    reviewResult.insertId;

  for (
    const finding
    of
    findings
  ) {
    await connection.execute(
      `
        INSERT INTO contract_review_findings
        (
          review_id,
          rule_id,
          risk_category,
          risk_level,
          risk_score,
          matched_text,
          evidence_text,
          reason,
          advice,
          legal_source_id
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        reviewId,
        finding.ruleId,
        finding.riskCategory,
        finding.riskLevel,
        finding.riskScore,
        finding.matchedText,
        finding.evidenceText,
        finding.reason,
        finding.advice,
        finding.legalSource.id
      ]
    );
  }

  return reviewId;
}


export async function reviewContract({
  contractTitle,
  contractText
}) {
  const startedAt =
    Date.now();

  const normalizedContractText =
    normalizeContractText(
      contractText
    );

  createTextHash(
    normalizedContractText
  );

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const rules =
      await loadEnabledContractRules(
        connection
      );

    const findings =
      rules.flatMap(
        (
          rule
        ) => {
          return analyzeRule({
            inputText:
              normalizedContractText,

            rule
          });
        }
      );

    const overallScore =
      combineRiskScores(
        findings
      );

    const overallLevel =
      determineOverallLevel({
        overallScore,
        findings
      });

    const overallConfidence =
      calculateOverallConfidence(
        findings
      );

    const processingTimeMs =
      Date.now()
      -
      startedAt;

    const reviewId =
      await saveReview({
        connection,
        contractTitle,
        contractText:
          normalizedContractText,
        overallScore,
        overallLevel,
        overallConfidence,
        findings,
        processingTimeMs
      });

    await connection.commit();

    return {
      reviewId,
      engineVersion:
        ENGINE_VERSION,
      overallScore,
      overallLevel,
      confidence:
        overallConfidence,
      confidenceNote:
        "confidence 仅代表当前规则匹配的置信提示，不代表经过人工标注测试得到的真实准确率。",
      findingCount:
        findings.length,
      processingTimeMs,
      findings:
        findings.map(
          (
            finding
          ) => {
            return {
              ruleCode:
                finding.ruleCode,
              ruleName:
                finding.ruleName,
              riskCategory:
                finding.riskCategory,
              riskLevel:
                finding.riskLevel,
              riskScore:
                finding.riskScore,
              matchedText:
                finding.matchedText,
              evidenceText:
                finding.evidenceText,
              reason:
                finding.reason,
              advice:
                finding.advice,
              applicabilityNote:
                finding.applicabilityNote,
              legalSource:
                finding.legalSource
            };
          }
        )
    };
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}
