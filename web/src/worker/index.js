const ENGINE_VERSION = "rule-ai-hybrid-d1-0.2.0";

const SENTENCE_BOUNDARIES = new Set([
  "。",
  "！",
  "？",
  "!",
  "?",
  "；",
  ";",
  "\n"
]);

const CONTRAST_EXPRESSION = /但|但是|然而|不过|可是|却|除外|除非/u;

const FLEXIBLE_RULE_PATTERNS = {
  RECRUITMENT_UPFRONT_FEE: [
    "(?:(?:入职|上岗|报到|录用|签约|实习)[^。！？!?；;\\n]{0,12})?(?:需|须|需要|要求|先|统一)?[^。！？!?；;\\n]{0,8}(?:缴纳|交纳|支付|交付|付款|收取|收费)[^。！？!?；;\\n]{0,24}(?:押金|保证金|报名费|工号费|服装费|资料费|岗位稳定金|稳定金|设备押金|任务押金|服务费|管理费)",
    "(?:先缴后返|先交费再上岗|先付款再上岗|先付款后安排岗位|先交资料费|先付款购买工具包)"
  ],
  PAID_TRAINING_OR_TRAINING_LOAN: [
    "(?:培训|课程|训练营)[^。！？!?；;\\n]{0,24}(?:贷款|借款|分期付款|分期支付|分期|自费|自行承担)",
    "(?:贷款|借款|分期付款|分期支付|分期)[^。！？!?；;\\n]{0,24}(?:培训|课程|训练营)",
    "(?:付费|缴费|交费|支付|自费)[^。！？!?；;\\n]{0,18}(?:培训|课程|训练营)[^。！？!?；;\\n]{0,24}(?:入职|上岗|就业|安排工作|保就业|包就业)",
    "(?:培训后|课程结束后|训练营结束后)[^。！？!?；;\\n]{0,18}(?:包就业|保就业|安排工作|安排岗位|入职|上岗)"
  ],
  IDENTITY_DOCUMENT_RETENTION: [
    "(?:扣押|扣留|上交|统一保管|长期保管|留存|暂存|代管)[^。！？!?；;\\n]{0,18}(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)",
    "(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)[^。！？!?；;\\n]{0,24}(?:由公司保管|统一保管|长期保管|扣押|扣留|上交|留存|暂存|代管)"
  ],
  PAID_INTERNAL_REFERRAL: [
    "(?:付费|收费|缴费|交费|支付)[^。！？!?；;\\n]{0,18}(?:内推|内部推荐|直通面试|保录用|保offer|保证录用|保入职)",
    "(?:内推|内部推荐|直通面试|保录用|保offer|保证录用|保入职|内部名额)[^。！？!?；;\\n]{0,18}(?:收费|付费|服务费|费用)"
  ],
  VOCATIONAL_INTERNSHIP_FEE_REFERENCE: [
    "(?:实习|岗位)[^。！？!?；;\\n]{0,24}(?:缴纳|交纳|支付|收取|收费)[^。！？!?；;\\n]{0,20}(?:押金|管理费|材料费|服务费|培训费|就业服务费)"
  ]
};

const RULE_RISK_TERMS = {
  RECRUITMENT_UPFRONT_FEE: [
    "费用",
    "收费",
    "押金",
    "保证金",
    "报名费",
    "工号费",
    "服装费",
    "资料费",
    "稳定金",
    "服务费",
    "管理费"
  ],
  PAID_TRAINING_OR_TRAINING_LOAN: [
    "培训",
    "课程",
    "训练营",
    "贷款",
    "借款",
    "分期",
    "培训费",
    "课程费"
  ],
  IDENTITY_DOCUMENT_RETENTION: [
    "身份证",
    "毕业证",
    "学生证",
    "证件",
    "原件",
    "保管",
    "扣押",
    "扣留"
  ],
  PAID_INTERNAL_REFERRAL: [
    "内推",
    "内部推荐",
    "录用",
    "入职",
    "offer",
    "面试",
    "岗位"
  ],
  VOCATIONAL_INTERNSHIP_FEE_REFERENCE: [
    "实习",
    "费用",
    "押金",
    "管理费",
    "服务费",
    "培训费"
  ]
};

const GENERIC_NEGATIVE_PATTERNS = [
  "(?:不|无须|无需|不用|不必|禁止|不会|绝不|不得)[^。！？!?；;\\n]{0,16}(?:收取|缴纳|交纳|支付|付款|办理|扣押|扣留|上交|保管|收费)[^。！？!?；;\\n]{0,24}(?:任何费用|任何财物|任何证件|费用|培训费|培训费用|押金|保证金|贷款|培训贷款|身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件|内推费|内推费用)",
  "(?:免费(?:提供)?[^。！？!?；;\\n]{0,16}(?:培训|课程)|(?:培训|课程)[^。！？!?；;\\n]{0,16}免费)",
  "(?:费用|培训费用|培训费)[^。！？!?；;\\n]{0,12}(?:由公司承担|由用人单位承担|全部由公司承担)",
  "(?:仅|只)[^。！？!?；;\\n]{0,10}(?:现场)?(?:核验|查验|查看)[^。！？!?；;\\n]{0,20}(?:身份证|身份证原件|学生证|证件|证件原件)",
  "(?:核验|查验|查看)[^。！？!?；;\\n]{0,16}(?:后|完毕后)?(?:立即|当场)?(?:归还|退还)[^。！？!?；;\\n]{0,10}(?:原件|身份证|证件)"
];

function jsonResponse(body, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsedValue = JSON.parse(value);

    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }

    return [];
  } catch {
    return [];
  }
}

function normalizeInputText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeOptionalText(value, maximumLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maximumLength);
}

async function createInputHash(text) {
  const encodedText = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedText);
  const hashBytes = Array.from(new Uint8Array(hashBuffer));

  return hashBytes
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function findAllTextOccurrences(text, searchText) {
  const results = [];

  if (!searchText) {
    return results;
  }

  let searchStart = 0;

  while (searchStart < text.length) {
    const foundStart = text.indexOf(searchText, searchStart);

    if (foundStart === -1) {
      break;
    }

    results.push({
      start: foundStart,
      end: foundStart + searchText.length,
      matchedText: searchText,
      matchType: "exact"
    });

    searchStart = foundStart + Math.max(searchText.length, 1);
  }

  return results;
}

function findAllRegexOccurrences(text, regexSource) {
  const results = [];
  const regularExpression = new RegExp(regexSource, "gu");

  let currentMatch;

  while ((currentMatch = regularExpression.exec(text)) !== null) {
    const matchedText = currentMatch[0];

    results.push({
      start: currentMatch.index,
      end: currentMatch.index + matchedText.length,
      matchedText,
      matchType: "flexible"
    });

    if (matchedText.length === 0) {
      regularExpression.lastIndex += 1;
    }
  }

  return results;
}

function deduplicateCandidates(candidates) {
  const candidateMap = new Map();

  for (const candidate of candidates) {
    const key = [
      candidate.start,
      candidate.end,
      candidate.matchedText
    ].join(":");

    if (!candidateMap.has(key)) {
      candidateMap.set(key, candidate);
    }
  }

  return Array.from(candidateMap.values());
}

function findSentenceRange(text, evidenceStart, evidenceEnd) {
  let sentenceStart = evidenceStart;
  let sentenceEnd = evidenceEnd;

  while (sentenceStart > 0) {
    const previousCharacter = text[sentenceStart - 1];

    if (SENTENCE_BOUNDARIES.has(previousCharacter)) {
      break;
    }

    sentenceStart -= 1;
  }

  while (sentenceEnd < text.length) {
    const currentCharacter = text[sentenceEnd];

    sentenceEnd += 1;

    if (SENTENCE_BOUNDARIES.has(currentCharacter)) {
      break;
    }
  }

  return {
    start: sentenceStart,
    end: sentenceEnd,
    text: text.slice(sentenceStart, sentenceEnd).trim()
  };
}

function createContextRange(text, evidenceStart, evidenceEnd, contextWindow) {
  return {
    start: Math.max(0, evidenceStart - contextWindow),
    end: Math.min(text.length, evidenceEnd + contextWindow)
  };
}

function rangesOverlap(firstRange, secondRange) {
  return firstRange.start < secondRange.end
    && secondRange.start < firstRange.end;
}

function calculateRangeDistance(firstRange, secondRange) {
  if (rangesOverlap(firstRange, secondRange)) {
    return 0;
  }

  if (firstRange.end <= secondRange.start) {
    return secondRange.start - firstRange.end;
  }

  return firstRange.start - secondRange.end;
}

function getTextBetweenRanges(text, firstRange, secondRange) {
  const start = Math.min(firstRange.end, secondRange.end);
  const end = Math.max(firstRange.start, secondRange.start);

  if (start >= end) {
    return "";
  }

  return text.slice(start, end);
}

function hasSharedRiskTerm({ ruleCode, positiveText, negativeText }) {
  const riskTerms = RULE_RISK_TERMS[ruleCode] || [];

  return riskTerms.some((riskTerm) => {
    return positiveText.includes(riskTerm)
      && negativeText.includes(riskTerm);
  });
}

function isGenericFeeNegation({ ruleCode, negativeText }) {
  const feeRelatedRules = new Set([
    "RECRUITMENT_UPFRONT_FEE",
    "PAID_TRAINING_OR_TRAINING_LOAN",
    "PAID_INTERNAL_REFERRAL",
    "VOCATIONAL_INTERNSHIP_FEE_REFERENCE"
  ]);

  if (!feeRelatedRules.has(ruleCode)) {
    return false;
  }

  return negativeText.includes("不收取")
    || negativeText.includes("不会收取")
    || negativeText.includes("无需缴纳")
    || negativeText.includes("无需支付")
    || negativeText.includes("免费")
    || negativeText.includes("由公司承担")
    || negativeText.includes("全部由公司承担")
    || negativeText.includes("禁止向");
}

function findNegativeCandidates({ inputText, negativePatterns, contextRange }) {
  const contextText = inputText.slice(contextRange.start, contextRange.end);
  const candidates = [];

  for (const negativePattern of negativePatterns) {
    const localMatches = findAllTextOccurrences(contextText, negativePattern);

    for (const localMatch of localMatches) {
      candidates.push({
        start: contextRange.start + localMatch.start,
        end: contextRange.start + localMatch.end,
        matchedText: localMatch.matchedText,
        matchType: "rule-negative"
      });
    }
  }

  for (const regexSource of GENERIC_NEGATIVE_PATTERNS) {
    const localMatches = findAllRegexOccurrences(contextText, regexSource);

    for (const localMatch of localMatches) {
      candidates.push({
        start: contextRange.start + localMatch.start,
        end: contextRange.start + localMatch.end,
        matchedText: localMatch.matchedText,
        matchType: "generic-negative"
      });
    }
  }

  return deduplicateCandidates(candidates);
}

function isCandidateNegated({
  inputText,
  rule,
  candidate,
  contextRange,
  negativePatterns
}) {
  const negativeCandidates = findNegativeCandidates({
    inputText,
    negativePatterns,
    contextRange
  });

  for (const negativeCandidate of negativeCandidates) {
    const candidateRange = {
      start: candidate.start,
      end: candidate.end
    };

    const negativeRange = {
      start: negativeCandidate.start,
      end: negativeCandidate.end
    };

    const semanticallyRelated = hasSharedRiskTerm({
      ruleCode: rule.rule_code,
      positiveText: candidate.matchedText,
      negativeText: negativeCandidate.matchedText
    })
    || isGenericFeeNegation({
      ruleCode: rule.rule_code,
      negativeText: negativeCandidate.matchedText
    });

    if (!semanticallyRelated) {
      continue;
    }

    const negativeTextBeforeCandidate = inputText.slice(
      negativeCandidate.start,
      candidate.start
    );

    if (
      negativeCandidate.start < candidate.start
      && CONTRAST_EXPRESSION.test(negativeTextBeforeCandidate)
    ) {
      continue;
    }

    if (rangesOverlap(candidateRange, negativeRange)) {
      return true;
    }

    const distance = calculateRangeDistance(candidateRange, negativeRange);

    if (distance > 30) {
      continue;
    }

    const textBetween = getTextBetweenRanges(
      inputText,
      candidateRange,
      negativeRange
    );

    if (CONTRAST_EXPRESSION.test(textBetween)) {
      continue;
    }

    return true;
  }

  return false;
}

function calculateFindingConfidence({ matchedText, matchType, hasLegalSource }) {
  const baseConfidence = matchType === "exact" ? 0.84 : 0.8;
  const lengthBonus = Math.min(matchedText.length * 0.01, 0.12);
  const sourceBonus = hasLegalSource ? 0.02 : 0;

  return Number(
    Math.min(baseConfidence + lengthBonus + sourceBonus, 0.98).toFixed(4)
  );
}

function combineRiskScores(findings) {
  if (findings.length === 0) {
    return 0;
  }

  const remainingSafety = findings.reduce((currentSafety, finding) => {
    const riskProbability = Math.min(
      Math.max(finding.riskScore / 100, 0),
      1
    );

    return currentSafety * (1 - riskProbability);
  }, 1);

  return Number((100 * (1 - remainingSafety)).toFixed(2));
}

function calculateOverallConfidence(findings) {
  if (findings.length === 0) {
    return 0.72;
  }

  const total = findings.reduce((sum, finding) => {
    return sum + finding.confidence;
  }, 0);

  return Number((total / findings.length).toFixed(4));
}

function determineOverallLevel({ textLength, overallScore, findings }) {
  if (textLength < 30) {
    return "insufficient_information";
  }

  const hasCriticalFinding = findings.some((finding) => {
    return finding.severity === "critical";
  });

  if (hasCriticalFinding || overallScore >= 90) {
    return "critical";
  }

  if (overallScore >= 70) {
    return "high";
  }

  if (overallScore >= 40) {
    return "medium";
  }

  return "low";
}

function createSummary({ overallLevel, findingCount }) {
  if (overallLevel === "insufficient_information") {
    return "当前 JD 信息较少，暂时不足以完成可靠审查。";
  }

  if (findingCount === 0) {
    return "暂未发现当前规则库覆盖的明显高风险表达。该结果不代表岗位绝对安全，仍需核实薪资、工时、工作内容和用工主体。";
  }

  return `共发现 ${findingCount} 项需要关注的风险线索。`;
}

function createRuleCandidates({ inputText, rule, positivePatterns }) {
  const candidates = [];

  for (const positivePattern of positivePatterns) {
    candidates.push(
      ...findAllTextOccurrences(inputText, positivePattern)
    );
  }

  const flexiblePatterns = FLEXIBLE_RULE_PATTERNS[rule.rule_code] || [];

  for (const regexSource of flexiblePatterns) {
    candidates.push(
      ...findAllRegexOccurrences(inputText, regexSource)
    );
  }

  return deduplicateCandidates(candidates)
    .sort((firstCandidate, secondCandidate) => {
      if (firstCandidate.start !== secondCandidate.start) {
        return firstCandidate.start - secondCandidate.start;
      }

      return secondCandidate.matchedText.length - firstCandidate.matchedText.length;
    });
}

function analyzeRule({ inputText, rule }) {
  if (
    rule.rule_code === "VOCATIONAL_INTERNSHIP_FEE_REFERENCE"
    && !/(职业学校|中职|高职|技工学校|学校组织|实习管理费|实习材料费|实习服务费|实习报酬提成)/u.test(inputText)
  ) {
    return [];
  }

  const positivePatterns = parseJsonArray(rule.positive_patterns);
  const negativePatterns = parseJsonArray(rule.negative_patterns);

  const candidates = createRuleCandidates({
    inputText,
    rule,
    positivePatterns
  });

  const findings = [];
  const findingKeys = new Set();

  for (const candidate of candidates) {
    const sentenceRange = findSentenceRange(
      inputText,
      candidate.start,
      candidate.end
    );

    const contextRange = createContextRange(
      inputText,
      candidate.start,
      candidate.end,
      rule.context_window
    );

    const isNegated = isCandidateNegated({
      inputText,
      rule,
      candidate,
      contextRange,
      negativePatterns
    });

    if (isNegated) {
      continue;
    }

    const findingKey = [
      rule.id,
      sentenceRange.start,
      sentenceRange.end
    ].join(":");

    if (findingKeys.has(findingKey)) {
      continue;
    }

    findingKeys.add(findingKey);

    const legalSource = rule.legal_source_id
      ? {
          id: rule.legal_source_id,
          title: rule.legal_title,
          issuingAuthority: rule.legal_issuing_authority,
          articleNumber: rule.legal_article_number,
          sourceUrl: rule.legal_source_url
        }
      : null;

    findings.push({
      ruleId: rule.id,
      ruleCode: rule.rule_code,
      ruleName: rule.rule_name,
      riskCategory: rule.risk_category,
      severity: rule.severity,
      riskScore: Number(rule.base_score),
      matchedPattern: candidate.matchedText,
      matchType: candidate.matchType,
      evidenceText: sentenceRange.text,
      evidenceStart: sentenceRange.start,
      evidenceEnd: sentenceRange.end,
      reason: rule.rule_explanation,
      verificationAdvice: rule.verification_advice,
      confidence: calculateFindingConfidence({
        matchedText: candidate.matchedText,
        matchType: candidate.matchType,
        hasLegalSource: Boolean(legalSource)
      }),
      legalSource
    });

    if (findings.length >= 3) {
      return findings;
    }
  }

  return findings;
}

function findingsHaveOverlappingEvidence(firstFinding, secondFinding) {
  return firstFinding.evidenceStart < secondFinding.evidenceEnd
    && secondFinding.evidenceStart < firstFinding.evidenceEnd;
}

function normalizeReviewFindings(findings) {
  return findings.filter((finding, index) => {
    if (finding.ruleCode !== "VOCATIONAL_INTERNSHIP_FEE_REFERENCE") {
      return true;
    }

    return !findings.some((otherFinding, otherIndex) => {
      return otherIndex !== index
        && [
          "RECRUITMENT_UPFRONT_FEE",
          "PAID_TRAINING_OR_TRAINING_LOAN"
        ].includes(otherFinding.ruleCode)
        && findingsHaveOverlappingEvidence(finding, otherFinding);
    });
  });
}

async function loadEnabledRules(env) {
  const result = await env.zhifamingxing_db
    .prepare(
      `
        SELECT
          risk_rules.id,
          risk_rules.rule_code,
          risk_rules.rule_name,
          risk_rules.risk_category,
          risk_rules.severity,
          risk_rules.rule_type,
          risk_rules.positive_patterns,
          risk_rules.negative_patterns,
          risk_rules.context_window,
          risk_rules.base_score,
          risk_rules.legal_source_id,
          risk_rules.rule_explanation,
          risk_rules.verification_advice,
          risk_rules.rule_version,
          legal_sources.title AS legal_title,
          legal_sources.issuing_authority AS legal_issuing_authority,
          legal_sources.article_number AS legal_article_number,
          legal_sources.source_url AS legal_source_url
        FROM risk_rules
        LEFT JOIN legal_sources
          ON legal_sources.id = risk_rules.legal_source_id
        WHERE risk_rules.is_enabled = 1
        ORDER BY
          CASE risk_rules.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END,
          risk_rules.id
      `
    )
    .all();

  return result.results;
}

async function saveJdReview({
  env,
  jobTitle,
  companyName,
  inputText,
  inputHash,
  overallScore,
  overallLevel,
  overallConfidence,
  processingTimeMs,
  findings
}) {
  const reviewResult = await env.zhifamingxing_db
    .prepare(
      `
        INSERT INTO jd_reviews
        (
          job_title,
          company_name,
          input_text,
          input_hash,
          overall_score,
          overall_level,
          confidence,
          engine_version,
          processing_time_ms
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      jobTitle || null,
      companyName || null,
      inputText,
      inputHash,
      overallScore,
      overallLevel,
      overallConfidence,
      ENGINE_VERSION,
      processingTimeMs
    )
    .run();

  const reviewId = reviewResult.meta.last_row_id;

  for (const finding of findings) {
    await env.zhifamingxing_db
      .prepare(
        `
          INSERT INTO jd_review_findings
          (
            review_id,
            rule_id,
            legal_source_id,
            risk_category,
            severity,
            risk_score,
            evidence_text,
            evidence_start,
            evidence_end,
            reason,
            verification_advice,
            confidence
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        reviewId,
        finding.ruleId,
        finding.legalSource?.id || null,
        finding.riskCategory,
        finding.severity,
        finding.riskScore,
        finding.evidenceText,
        finding.evidenceStart,
        finding.evidenceEnd,
        finding.reason,
        finding.verificationAdvice,
        finding.confidence
      )
      .run();
  }

  return reviewId;
}


const AI_JD_MODEL = "@cf/meta/llama-3.2-1b-instruct";

const AI_SUSPICIOUS_JD_PATTERN =
  /培训|培训费|培训费用|缴费|缴纳|交费|交钱|收费|费用|押金|保证金|贷款|分期|证件|身份证|原件|无工资|没工资|无薪|无补贴|转正|保就业|包就业|内推|offer/u;

const AI_SEVERITY_SCORES = {
  critical: 92,
  high: 82,
  medium: 62,
  low: 38
};

function shouldRunJdAiReview({ inputText, findings }) {
  if (!inputText || findings.length > 0) {
    return false;
  }

  return AI_SUSPICIOUS_JD_PATTERN.test(inputText);
}

function normalizeAiSeverity(value) {
  const normalized = String(value || "").toLowerCase();

  if (["critical", "high", "medium", "low"].includes(normalized)) {
    return normalized;
  }

  return "medium";
}

function trimAiText(value, maximumLength, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed.slice(0, maximumLength);
}

function parseAiJsonResponse(responseText) {
  const text = String(responseText || "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function findSuspiciousSentence(inputText) {
  let sentenceStart = 0;

  for (let index = 0; index < inputText.length; index += 1) {
    if (!SENTENCE_BOUNDARIES.has(inputText[index])) {
      continue;
    }

    const sentenceText = inputText.slice(sentenceStart, index + 1).trim();

    if (AI_SUSPICIOUS_JD_PATTERN.test(sentenceText)) {
      return {
        start: sentenceStart,
        end: index + 1,
        text: sentenceText
      };
    }

    sentenceStart = index + 1;
  }

  const tailSentence = inputText.slice(sentenceStart).trim();

  if (tailSentence && AI_SUSPICIOUS_JD_PATTERN.test(tailSentence)) {
    return {
      start: sentenceStart,
      end: inputText.length,
      text: tailSentence
    };
  }

  return {
    start: 0,
    end: Math.min(inputText.length, 120),
    text: inputText.slice(0, 120).trim()
  };
}

function locateAiEvidence(inputText, evidenceText) {
  const normalizedEvidence = trimAiText(evidenceText, 120, "");

  if (normalizedEvidence) {
    const evidenceStart = inputText.indexOf(normalizedEvidence);

    if (evidenceStart !== -1) {
      const evidenceEnd = evidenceStart + normalizedEvidence.length;
      return findSentenceRange(inputText, evidenceStart, evidenceEnd);
    }
  }

  return findSuspiciousSentence(inputText);
}


function createAiMatchedPattern({
  rawEvidenceText,
  fallbackText
}) {
  const rawText = trimAiText(rawEvidenceText, 120, "");

  if (
    !rawText
    || rawText.includes("原文中的证据短句")
    || rawText.includes("证据短句")
    || rawText.includes("具体证据")
    || rawText.includes("占位词")
  ) {
    return fallbackText;
  }

  return rawText;
}

function normalizeAiFindings({ inputText, aiResult }) {
  if (
    !aiResult
    || aiResult.hasRisk !== true
    || !Array.isArray(aiResult.findings)
  ) {
    return [];
  }

  const findings = [];
  const findingKeys = new Set();

  for (const item of aiResult.findings) {
    const severity = normalizeAiSeverity(item.severity);
    const evidenceRange = locateAiEvidence(inputText, item.evidenceText);
    const riskCategory = trimAiText(
      item.riskCategory,
      80,
      "AI 语义识别风险"
    );

    const findingKey = [
      riskCategory,
      evidenceRange.start,
      evidenceRange.end
    ].join(":");

    if (findingKeys.has(findingKey)) {
      continue;
    }

    findingKeys.add(findingKey);

    findings.push({
      ruleId: null,
      ruleCode: "AI_SEMANTIC_JD_REVIEW",
      ruleName: "AI 语义复核风险",
      riskCategory,
      severity,
      riskScore: AI_SEVERITY_SCORES[severity] || 62,
      matchedPattern: createAiMatchedPattern({
        rawEvidenceText: item.evidenceText,
        fallbackText: evidenceRange.text
      }),
      matchType: "ai-semantic",
      evidenceText: evidenceRange.text,
      evidenceStart: evidenceRange.start,
      evidenceEnd: evidenceRange.end,
      reason: trimAiText(
        item.reason,
        300,
        "AI 语义复核认为该表达存在实习求职风险，需要进一步核实。"
      ),
      verificationAdvice: trimAiText(
        item.verificationAdvice,
        300,
        "请核实招聘主体、收费依据、合同约定、薪酬标准和实际履行方式，并保留岗位页面和沟通记录。"
      ),
      confidence: 0.76,
      legalSource: null,
      source: "ai"
    });

    if (findings.length >= 3) {
      break;
    }
  }

  return findings;
}


const JD_SEMANTIC_RISK_DETECTORS = [
  {
    ruleCode: "SEMANTIC_PAID_TRAINING_FEE",
    ruleName: "语义识别：付费培训与入职绑定",
    riskCategory: "付费培训与入职绑定",
    severity: "critical",
    riskScore: 92,
    pattern: /(?:入职前|上岗前|岗前|报到前|录用前|转正前)?[^。！？!?；;\n]{0,24}(?:培训|课程|训练营)[^。！？!?；;\n]{0,32}(?:缴纳|交纳|支付|交费|缴费|收费|自费|承担|培训费|费用)[^。！？!?；;\n]{0,20}(?:\d+\s*元)?|(?:缴纳|交纳|支付|交费|缴费|收费)[^。！？!?；;\n]{0,24}(?:培训费|培训费用|课程费)/u,
    negativePattern: /(?:免费培训|培训免费|不收取培训费|无需缴纳培训费|无需支付培训费|公司承担培训费|培训费由公司承担)/u,
    reason: "岗位信息将入职、转正或岗位机会与个人支付培训费用绑定，存在招聘收费、招转培或付费培训风险。",
    verificationAdvice: "请核实招聘主体和培训主体是否一致、收费依据、退款规则、是否承诺录用，以及是否要求签署培训贷款或分期协议。"
  },
  {
    ruleCode: "SEMANTIC_UNPAID_INTERNSHIP",
    ruleName: "语义识别：实习期间无工资或报酬缺失",
    riskCategory: "实习报酬缺失",
    severity: "medium",
    riskScore: 68,
    pattern: /(?:实习期间|实习期|实习阶段|试用期|培训期)[^。！？!?；;\n]{0,18}(?:无工资|没有工资|不发工资|无薪|无报酬|没有报酬|无补贴|没有补贴|不发补贴)|(?:无薪实习|实习无工资|实习无补贴|不发实习工资|不发实习补贴)/u,
    negativePattern: /(?:不是无工资|并非无工资|不接受无薪实习|不提供无薪实习|有实习补贴|发放实习补贴|实习补贴按月发放)/u,
    reason: "岗位信息明确表示实习期间无工资、无报酬或无补贴，存在报酬约定异常风险，需要结合实习性质和实际工作安排进一步核实。",
    verificationAdvice: "请核实实习性质、学校是否组织、工作时长、工作内容、补贴标准、转正条件和书面协议，并保留岗位页面及沟通记录。"
  }
];

function hasSimilarFinding(existingFindings, detector) {
  return existingFindings.some((finding) => {
    const combinedText = [
      finding.ruleCode,
      finding.ruleName,
      finding.riskCategory,
      finding.reason
    ].join(" ");

    if (combinedText.includes(detector.riskCategory)) {
      return true;
    }

    if (
      detector.ruleCode === "SEMANTIC_PAID_TRAINING_FEE"
      && /培训|培训费|课程费|付费培训/u.test(combinedText)
    ) {
      return true;
    }

    if (
      detector.ruleCode === "SEMANTIC_UNPAID_INTERNSHIP"
      && /无工资|无薪|无补贴|报酬缺失|实习报酬/u.test(combinedText)
    ) {
      return true;
    }

    return false;
  });
}

function createJdSemanticFallbackFindings({
  inputText,
  existingFindings
}) {
  const findings = [];

  for (const detector of JD_SEMANTIC_RISK_DETECTORS) {
    if (hasSimilarFinding(existingFindings, detector)) {
      continue;
    }

    const match = detector.pattern.exec(inputText);

    if (!match) {
      continue;
    }

    const matchedText = match[0].trim();
    const leadingTrimLength = match[0].length - match[0].trimStart().length;
    const evidenceStart = match.index + leadingTrimLength;
    const evidenceEnd = evidenceStart + matchedText.length;

    const evidenceRange = {
      start: evidenceStart,
      end: evidenceEnd,
      text: matchedText
    };

    if (detector.negativePattern.test(evidenceRange.text)) {
      continue;
    }

    findings.push({
      ruleId: null,
      ruleCode: detector.ruleCode,
      ruleName: detector.ruleName,
      riskCategory: detector.riskCategory,
      severity: detector.severity,
      riskScore: detector.riskScore,
      matchedPattern: matchedText,
      matchType: "semantic-fallback",
      evidenceText: evidenceRange.text,
      evidenceStart: evidenceRange.start,
      evidenceEnd: evidenceRange.end,
      reason: detector.reason,
      verificationAdvice: detector.verificationAdvice,
      confidence: 0.82,
      legalSource: null,
      source: "semantic"
    });
  }

  return findings;
}

async function analyzeJdWithAI({
  env,
  inputText,
  jobTitle,
  companyName
}) {
  if (!env.AI) {
    return [];
  }

  const prompt = [
    "你是大学生实习求职风险审查助手。",
    "任务：判断下面岗位 JD 是否存在实习求职风险。",
    "重点识别：入职前收费、付费培训、培训贷款、押金保证金、扣押证件、收费内推、实习无工资、转正承诺绑定收费。",
    "如果同一段文本里同时出现多个风险，例如付费培训和实习无工资，必须拆成多条 findings。",
    "要求：只返回 JSON，不要输出 Markdown，不要输出解释性段落。",
    "JSON 格式如下：",
    "{",
    "  \"hasRisk\": true,",
    "  \"overallLevel\": \"critical\",",
    "  \"findings\": [",
    "    {",
    "      \"riskCategory\": \"付费培训与入职绑定\",",
    "      \"severity\": \"critical\",",
    "      \"evidenceText\": \"必须逐字摘录 JD 原文中的具体证据，不得写占位词\",",
    "      \"reason\": \"为什么有风险\",",
    "      \"verificationAdvice\": \"用户应该如何核实\"",
    "    }",
    "  ]",
    "}",
    "没有风险时返回：{\"hasRisk\":false,\"overallLevel\":\"low\",\"findings\":[]}",
    "",
    `岗位名称：${jobTitle || "未填写"}`,
    `公司名称：${companyName || "未填写"}`,
    `JD 原文：${inputText.slice(0, 3000)}`
  ].join("\n");

  try {
    const aiResponse = await env.AI.run(
      AI_JD_MODEL,
      {
        messages: [
          {
            role: "system",
            content: "你只做风险识别和结构化输出，不提供最终法律结论。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 700
      }
    );

    const responseText =
      typeof aiResponse === "string"
        ? aiResponse
        : aiResponse?.response || aiResponse?.result?.response || "";

    const aiResult = parseAiJsonResponse(responseText);

    return normalizeAiFindings({
      inputText,
      aiResult
    });
  } catch (error) {
    console.error("JD AI semantic review failed:", error);
    return [];
  }
}

async function reviewJobDescription({
  env,
  jobTitle,
  companyName,
  jdText
}) {
  const startedAt = Date.now();
  const inputText = normalizeInputText(jdText);
  const inputHash = await createInputHash(inputText);
  const rules = await loadEnabledRules(env);

  const ruleFindings = normalizeReviewFindings(
    rules.flatMap((rule) => {
      return analyzeRule({
        inputText,
        rule
      });
    })
  );

  const semanticFindings = createJdSemanticFallbackFindings({
    inputText,
    existingFindings: ruleFindings
  });

  const deterministicFindings = normalizeReviewFindings([
    ...ruleFindings,
    ...semanticFindings
  ]);

  const aiFindings = shouldRunJdAiReview({
    inputText,
    findings: deterministicFindings
  })
    ? await analyzeJdWithAI({
        env,
        inputText,
        jobTitle,
        companyName
      })
    : [];

  const findings = normalizeReviewFindings([
    ...deterministicFindings,
    ...aiFindings
  ]);

  const overallScore = combineRiskScores(findings);

  const overallLevel = determineOverallLevel({
    textLength: inputText.length,
    overallScore,
    findings
  });

  const overallConfidence = calculateOverallConfidence(findings);
  const processingTimeMs = Date.now() - startedAt;

  const reviewId = await saveJdReview({
    env,
    jobTitle,
    companyName,
    inputText,
    inputHash,
    overallScore,
    overallLevel,
    overallConfidence,
    processingTimeMs,
    findings
  });

  return {
    reviewId,
    engineVersion: ENGINE_VERSION,
    inputLength: inputText.length,
    overallScore,
    overallLevel,
    confidence: overallConfidence,
    findingCount: findings.length,
    summary: createSummary({
      overallLevel,
      findingCount: findings.length
    }),
    findings,
    aiReviewUsed: aiFindings.length > 0,
    semanticReviewUsed: semanticFindings.length > 0,
    processingTimeMs
  };
}

async function createJdReview(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        message: "请求体格式错误，请提交 JSON 数据。"
      },
      400
    );
  }

  const {
    jobTitle,
    companyName,
    jdText
  } = body || {};

  if (typeof jdText !== "string") {
    return jsonResponse(
      {
        success: false,
        message: "请提交岗位 JD 文本。"
      },
      400
    );
  }

  const normalizedJdText = jdText.trim();

  if (normalizedJdText.length < 20) {
    return jsonResponse(
      {
        success: false,
        message: "岗位 JD 内容过少，请至少输入 20 个字符。"
      },
      400
    );
  }

  if (normalizedJdText.length > 30000) {
    return jsonResponse(
      {
        success: false,
        message: "岗位 JD 内容过长，当前最多支持 30000 个字符。"
      },
      400
    );
  }

  const result = await reviewJobDescription({
    env,
    jobTitle: normalizeOptionalText(jobTitle, 300),
    companyName: normalizeOptionalText(companyName, 300),
    jdText: normalizedJdText
  });

  return jsonResponse(
    {
      success: true,
      message: "岗位 JD 审查完成。",
      data: result
    },
    201
  );
}

const CONTRACT_ENGINE_VERSION = "contract-rule-engine-d1-0.1.0";

const CONTRACT_FLEXIBLE_RULE_PATTERNS = {
  CONTRACT_UPFRONT_DEPOSIT_OR_GUARANTEE: [
    "(?:入职|上岗|实习|报到|签约)?[^。！？；;\\n]{0,12}(?:须|需|需要|要求|应当)?[^。！？；;\\n]{0,8}(?:缴纳|交纳|支付|交付|付清)[^。！？；;\\n]{0,20}(?:押金|保证金|岗位保证金|岗位押金|财物|服装费|资料费|工牌费|设备押金)",
    "(?:押金|保证金|岗位保证金|岗位押金|设备押金)[^。！？；;\\n]{0,18}(?:不退|暂扣|扣除|作为担保)"
  ],

  CONTRACT_DOCUMENT_WITHHELD: [
    "(?:扣押|扣留|上交|留存|统一保管|长期保管)[^。！？；;\\n]{0,18}(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)",
    "(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)[^。！？；;\\n]{0,24}(?:由公司保管|统一保管|长期保管|扣押|扣留|留存|上交|暂存公司|交由公司保管|离职后归还)"
  ],

  CONTRACT_PAID_TRAINING_OR_LOAN: [
    "(?:培训|课程)[^。！？；;\\n]{0,20}(?:贷款|借款|分期|分期贷款|分期付款|分期支付)",
    "(?:贷款|借款|分期|分期贷款|分期付款|分期支付)[^。！？；;\\n]{0,20}(?:培训|课程)",
    "(?:付费|缴费|交费|支付|自费|自行承担)[^。！？；;\\n]{0,18}(?:培训|课程|培训费|课程费)",
    "(?:签署|办理|申请)[^。！？；;\\n]{0,18}(?:培训借款协议|课程分期|助学分期|培训分期|培训贷款|培训贷)"
  ],

  CONTRACT_PAID_GUARANTEED_OFFER: [
    "(?:付费|收费|缴费|交费|支付)[^。！？；;\\n]{0,18}(?:保录用|保证录用|保证安排岗位|保就业|内推|内部推荐|保证拿到offer|保证拿到 offer)",
    "(?:保录用|保证录用|保证安排岗位|保就业|内推|内部推荐|保证拿到offer|保证拿到 offer)[^。！？；;\\n]{0,18}(?:收费|付费|服务费|费用|缴费|交费|支付)"
  ]
};

const CONTRACT_GENERIC_NEGATIVE_PATTERNS = [
  "(?:不|无须|无需|不用|不得|禁止|不会|不需要)[^。！？；;\\n]{0,16}(?:收取|缴纳|交纳|支付|交付|扣押|扣留|上交|保管|办理)[^。！？；;\\n]{0,28}(?:押金|保证金|培训费|培训贷款|贷款|分期|证件|身份证|毕业证|学生证|原件|内推费|费用|财物)",
  "(?:仅|只)[^。！？；;\\n]{0,8}(?:核验|查验|查看)[^。！？；;\\n]{0,18}(?:身份证|证件|原件)",
  "(?:免费|完全免费)[^。！？；;\\n]{0,12}(?:培训|内推|推荐)",
  "(?:培训|岗前培训|课程)[^。！？；;\\n]{0,12}(?:免费|完全免费)",
  "(?:无|没有|不涉及|不包含|不含)[^。！？；;\\n]{0,12}(?:保证金|押金|培训贷款|贷款|收费|费用|证件扣押|扣押证件)"
];

function normalizeContractText(text) {
  return normalizeInputText(text);
}

function hasContractNegativeExpression({
  inputText,
  candidate,
  negativePatterns
}) {
  const contextRange = createContextRange(
    inputText,
    candidate.start,
    candidate.end,
    55
  );

  const contextText = inputText.slice(
    contextRange.start,
    contextRange.end
  );

  for (const negativePattern of negativePatterns) {
    if (
      negativePattern
      &&
      contextText.includes(negativePattern)
    ) {
      return true;
    }
  }

  for (const regexSource of CONTRACT_GENERIC_NEGATIVE_PATTERNS) {
    const regularExpression = new RegExp(regexSource, "u");

    if (regularExpression.test(contextText)) {
      return true;
    }
  }

  return false;
}

function calculateContractFindingConfidence({
  matchedText,
  matchType,
  hasLegalSource
}) {
  const baseConfidence = matchType === "exact" ? 0.86 : 0.82;
  const lengthBonus = Math.min(matchedText.length * 0.008, 0.1);
  const sourceBonus = hasLegalSource ? 0.03 : 0;

  return Number(
    Math.min(baseConfidence + lengthBonus + sourceBonus, 0.98).toFixed(4)
  );
}

function calculateContractOverallConfidence(findings) {
  if (findings.length === 0) {
    return 0.68;
  }

  const total = findings.reduce((sum, finding) => {
    return sum + finding.confidence;
  }, 0);

  return Number((total / findings.length).toFixed(4));
}

function determineContractOverallLevel({
  overallScore,
  findings
}) {
  const hasCriticalFinding = findings.some((finding) => {
    return finding.riskLevel === "critical";
  });

  if (hasCriticalFinding) {
    return "critical";
  }

  if (overallScore >= 75) {
    return "high";
  }

  if (overallScore >= 40) {
    return "medium";
  }

  return "low";
}

function createContractSummary({
  findingCount
}) {
  if (findingCount === 0) {
    return "暂未发现当前合同规则库覆盖的明显高风险条款。该结果不代表合同绝对安全，仍需结合完整文本、实际履行和法律关系进一步核实。";
  }

  return `共发现 ${findingCount} 项需要关注的合同风险线索。`;
}

function createContractRuleCandidates({
  inputText,
  rule,
  patterns
}) {
  const candidates = [];

  for (const pattern of patterns) {
    candidates.push(
      ...findAllTextOccurrences(inputText, pattern)
    );
  }

  const flexiblePatterns =
    CONTRACT_FLEXIBLE_RULE_PATTERNS[rule.rule_code] || [];

  for (const regexSource of flexiblePatterns) {
    candidates.push(
      ...findAllRegexOccurrences(inputText, regexSource)
    );
  }

  return deduplicateCandidates(candidates)
    .sort((firstCandidate, secondCandidate) => {
      if (firstCandidate.start !== secondCandidate.start) {
        return firstCandidate.start - secondCandidate.start;
      }

      return secondCandidate.matchedText.length - firstCandidate.matchedText.length;
    });
}

function analyzeContractRule({
  inputText,
  rule
}) {
  const patterns = parseJsonArray(rule.patterns);
  const negativePatterns = parseJsonArray(rule.negative_patterns);

  const candidates = createContractRuleCandidates({
    inputText,
    rule,
    patterns
  });

  const findings = [];
  const findingKeys = new Set();

  for (const candidate of candidates) {
    if (
      hasContractNegativeExpression({
        inputText,
        candidate,
        negativePatterns
      })
    ) {
      continue;
    }

    const sentenceRange = findSentenceRange(
      inputText,
      candidate.start,
      candidate.end
    );

    const findingKey = [
      rule.id,
      sentenceRange.start,
      sentenceRange.end
    ].join(":");

    if (findingKeys.has(findingKey)) {
      continue;
    }

    findingKeys.add(findingKey);

    const legalSource = {
      id: rule.legal_source_id,
      title: rule.legal_title,
      issuingAuthority: rule.legal_issuing_authority,
      documentNumber: rule.legal_document_number,
      articleNumber: rule.legal_article_number,
      sourceType: rule.legal_source_type,
      sourceUrl: rule.legal_source_url,
      citationText: rule.legal_citation_text
    };

    findings.push({
      ruleId: rule.id,
      ruleCode: rule.rule_code,
      ruleName: rule.rule_name,
      riskCategory: rule.risk_category,
      riskLevel: rule.risk_level,
      riskScore: Number(rule.risk_score),
      matchedText: candidate.matchedText,
      matchType: candidate.matchType,
      evidenceText: sentenceRange.text,
      reason: rule.reason,
      advice: rule.advice,
      applicabilityNote: rule.applicability_note,
      confidence: calculateContractFindingConfidence({
        matchedText: candidate.matchedText,
        matchType: candidate.matchType,
        hasLegalSource: true
      }),
      legalSource
    });

    if (findings.length >= 2) {
      break;
    }
  }

  return findings;
}

async function loadEnabledContractRules(env) {
  const result = await env.zhifamingxing_db
    .prepare(
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
          legal_sources.title AS legal_title,
          legal_sources.issuing_authority AS legal_issuing_authority,
          legal_sources.document_number AS legal_document_number,
          legal_sources.article_number AS legal_article_number,
          legal_sources.source_type AS legal_source_type,
          legal_sources.source_url AS legal_source_url,
          legal_sources.citation_text AS legal_citation_text
        FROM contract_rules
        INNER JOIN legal_sources
          ON legal_sources.id = contract_rules.legal_source_id
        WHERE
          contract_rules.review_status = 'reviewed'
          AND contract_rules.is_enabled = 1
          AND legal_sources.source_status = 'current'
        ORDER BY
          CASE contract_rules.risk_level
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END,
          contract_rules.id ASC
      `
    )
    .all();

  return result.results;
}

async function saveContractReview({
  env,
  contractTitle,
  contractText,
  overallScore,
  overallLevel,
  overallConfidence,
  findings,
  processingTimeMs
}) {
  const reviewResult = await env.zhifamingxing_db
    .prepare(
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      contractTitle || null,
      contractText,
      overallScore,
      overallLevel,
      overallConfidence,
      CONTRACT_ENGINE_VERSION,
      findings.length,
      processingTimeMs
    )
    .run();

  const reviewId = reviewResult.meta.last_row_id;

  for (const finding of findings) {
    await env.zhifamingxing_db
      .prepare(
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
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
      )
      .run();
  }

  return reviewId;
}

async function reviewContract({
  env,
  contractTitle,
  contractText
}) {
  const startedAt = Date.now();
  const normalizedContractText = normalizeContractText(contractText);
  const rules = await loadEnabledContractRules(env);

  const findings = rules.flatMap((rule) => {
    return analyzeContractRule({
      inputText: normalizedContractText,
      rule
    });
  });

  const overallScore = combineRiskScores(findings);

  const overallLevel = determineContractOverallLevel({
    overallScore,
    findings
  });

  const overallConfidence = calculateContractOverallConfidence(findings);
  const processingTimeMs = Date.now() - startedAt;

  const reviewId = await saveContractReview({
    env,
    contractTitle,
    contractText: normalizedContractText,
    overallScore,
    overallLevel,
    overallConfidence,
    findings,
    processingTimeMs
  });

  return {
    reviewId,
    engineVersion: CONTRACT_ENGINE_VERSION,
    overallScore,
    overallLevel,
    confidence: overallConfidence,
    confidenceNote: "confidence 仅代表当前规则匹配的置信提示，不代表经过人工标注测试得到的真实准确率。",
    findingCount: findings.length,
    summary: createContractSummary({
      findingCount: findings.length
    }),
    processingTimeMs,
    findings: findings.map((finding) => {
      return {
        ruleCode: finding.ruleCode,
        ruleName: finding.ruleName,
        riskCategory: finding.riskCategory,
        riskLevel: finding.riskLevel,
        riskScore: finding.riskScore,
        matchedText: finding.matchedText,
        evidenceText: finding.evidenceText,
        reason: finding.reason,
        advice: finding.advice,
        applicabilityNote: finding.applicabilityNote,
        confidence: finding.confidence,
        legalSource: finding.legalSource
      };
    })
  };
}

async function createContractReview(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        message: "请求体格式错误，请提交 JSON 数据。"
      },
      400
    );
  }

  const {
    contractTitle,
    contractText
  } = body || {};

  if (typeof contractText !== "string") {
    return jsonResponse(
      {
        success: false,
        message: "请提交合同文本。"
      },
      400
    );
  }

  const normalizedContractText = contractText.trim();

  if (normalizedContractText.length < 20) {
    return jsonResponse(
      {
        success: false,
        message: "合同文本内容过少，请至少输入 20 个字符。"
      },
      400
    );
  }

  if (normalizedContractText.length > 50000) {
    return jsonResponse(
      {
        success: false,
        message: "合同文本内容过长，当前最多支持 50000 个字符。"
      },
      400
    );
  }

  const result = await reviewContract({
    env,
    contractTitle: normalizeOptionalText(contractTitle, 300),
    contractText: normalizedContractText
  });

  return jsonResponse(
    {
      success: true,
      message: "合同审核完成。",
      data: result
    },
    201
  );
}

function normalizeLegalSource(row) {
  return {
    id: row.id,
    title: row.title,
    issuingAuthority: row.issuing_authority,
    documentNumber: row.document_number,
    articleNumber: row.article_number,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    publishedDate: row.published_date,
    effectiveDate: row.effective_date,
    retrievedAt: row.retrieved_at,
    citationText: row.citation_text,
    sourceStatus: row.source_status
  };
}

function normalizeRightsGuide(row) {
  return {
    id: row.id,
    title: row.title,
    guideCode: row.guide_code,
    problemType: row.problem_type,
    riskLevel: row.risk_level,
    summary: row.summary,
    applicabilityNote: row.applicability_note,
    firstAction: row.first_action,
    evidenceItems: parseJsonArray(row.evidence_items),
    actionSteps: parseJsonArray(row.action_steps),
    officialChannels: parseJsonArray(row.official_channels),
    cautionText: row.caution_text,
    sourceReviewedAt: row.source_reviewed_at,
    reviewStatus: row.review_status,
    isEnabled: Boolean(row.is_enabled),
    updatedAt: row.updated_at
  };
}

async function databaseHealth(env) {
  const result = await env.zhifamingxing_db
    .prepare(
      `
        SELECT
          (SELECT COUNT(*) FROM legal_sources) AS legalSourceCount,
          (SELECT COUNT(*) FROM rights_guides) AS rightsGuideCount,
          (SELECT COUNT(*) FROM risk_rules) AS riskRuleCount,
          (SELECT COUNT(*) FROM jd_reviews) AS jdReviewCount,
          (SELECT COUNT(*) FROM contract_rules) AS contractRuleCount,
          (SELECT COUNT(*) FROM contract_reviews) AS contractReviewCount
      `
    )
    .first();

  return jsonResponse({
    success: true,
    message: "Cloudflare D1 数据库连接正常。",
    data: {
      databaseName: "zhifamingxing-db",
      currentUser: "zhifamingxing_db",
      mysqlVersion: "Cloudflare D1 / SQLite-compatible",
      legalSourceCount: result.legalSourceCount,
      rightsGuideCount: result.rightsGuideCount,
      riskRuleCount: result.riskRuleCount,
      jdReviewCount: result.jdReviewCount,
      contractRuleCount: result.contractRuleCount,
      contractReviewCount: result.contractReviewCount
    }
  });
}

async function listLegalSources(env) {
  const result = await env.zhifamingxing_db
    .prepare(
      `
        SELECT
          id,
          title,
          issuing_authority,
          document_number,
          article_number,
          source_type,
          source_url,
          published_date,
          effective_date,
          retrieved_at,
          citation_text,
          source_status
        FROM legal_sources
        WHERE source_status = 'current'
        ORDER BY
          published_date DESC,
          id DESC
      `
    )
    .all();

  const items = result.results.map(normalizeLegalSource);

  return jsonResponse({
    success: true,
    message: "官方依据读取成功。",
    data: {
      total: items.length,
      items
    }
  });
}

async function listRightsGuides(env) {
  const result = await env.zhifamingxing_db
    .prepare(
      `
        SELECT
          id,
          title,
          guide_code,
          problem_type,
          risk_level,
          summary,
          applicability_note,
          first_action,
          evidence_items,
          action_steps,
          official_channels,
          caution_text,
          source_reviewed_at,
          review_status,
          is_enabled,
          updated_at
        FROM rights_guides
        WHERE
          review_status = 'reviewed'
          AND is_enabled = 1
        ORDER BY
          CASE risk_level
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END,
          id ASC
      `
    )
    .all();

  const items = result.results.map(normalizeRightsGuide);

  return jsonResponse({
    success: true,
    message: "维权指引读取成功。",
    data: {
      total: items.length,
      items
    }
  });
}

async function getRightsGuideByCode(env, guideCode) {
  const normalizedGuideCode = decodeURIComponent(guideCode || "")
    .trim()
    .toUpperCase();

  if (!normalizedGuideCode) {
    return jsonResponse(
      {
        success: false,
        message: "请提供维权指引编号。"
      },
      400
    );
  }

  const result = await env.zhifamingxing_db
    .prepare(
      `
        SELECT
          id,
          title,
          guide_code,
          problem_type,
          risk_level,
          summary,
          applicability_note,
          first_action,
          evidence_items,
          action_steps,
          official_channels,
          caution_text,
          source_reviewed_at,
          review_status,
          is_enabled,
          updated_at
        FROM rights_guides
        WHERE
          review_status = 'reviewed'
          AND is_enabled = 1
          AND guide_code = ?
        LIMIT 1
      `
    )
    .bind(normalizedGuideCode)
    .first();

  if (!result) {
    return jsonResponse(
      {
        success: false,
        message: "未找到对应的维权指引。"
      },
      404
    );
  }

  return jsonResponse({
    success: true,
    message: "维权指引读取成功。",
    data: normalizeRightsGuide(result)
  });
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/contract-reviews") {
    if (request.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          message: "合同审核接口仅支持 POST 请求。"
        },
        405
      );
    }

    return createContractReview(request, env);
  }

  if (url.pathname === "/api/jd-reviews") {
    if (request.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          message: "岗位审查接口仅支持 POST 请求。"
        },
        405
      );
    }

    return createJdReview(request, env);
  }

  if (request.method !== "GET") {
    return jsonResponse(
      {
        success: false,
        message: "当前接口暂不支持该请求方法。"
      },
      405
    );
  }

  if (url.pathname === "/api/health") {
    return jsonResponse({
      success: true,
      message: "智法明行 Cloudflare Worker API 运行正常。"
    });
  }

  if (url.pathname === "/api/health/database") {
    return databaseHealth(env);
  }

  if (url.pathname === "/api/legal-sources") {
    return listLegalSources(env);
  }

  if (url.pathname === "/api/rights-guides") {
    return listRightsGuides(env);
  }

  if (url.pathname.startsWith("/api/rights-guides/")) {
    const guideCode = url.pathname.replace("/api/rights-guides/", "");

    return getRightsGuideByCode(env, guideCode);
  }

  return jsonResponse(
    {
      success: false,
      message: "未找到对应接口。"
    },
    404
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/")) {
        return await handleApiRequest(request, env);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          message: "服务暂时不可用，请稍后重试。",
          errorName: error?.name || "Error",
          errorMessage: error?.message || "Unknown error"
        },
        500
      );
    }
  }
};
