const ENGINE_VERSION = "gemini-jd-review-1.0.0";

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

function createSummary({
  overallLevel,
  findingCount,
  reviewUnavailable = false
}) {
  if (reviewUnavailable) {
    return "智能审查服务暂未完成有效判断，请稍后重试。请勿依据本次结果认定岗位安全。";
  }

  if (overallLevel === "insufficient_information") {
    return "当前 JD 信息不足，暂时无法形成可靠判断。请补充招聘主体、岗位职责、薪资待遇、工作时间及收费说明。";
  }

  if (findingCount === 0) {
    return "本次智能审查暂未发现明显高风险表达。该结果不代表岗位绝对安全，仍需进一步核实招聘主体、薪资待遇、工作内容和协议条款。";
  }

  return `本次智能审查共发现 ${findingCount} 项需要关注的风险线索。`;
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



function sanitizeFindingForD1(finding) {
  return {
    ruleId: finding?.ruleId ?? null,
    ruleCode: finding?.ruleCode ?? "UNKNOWN_RULE",
    ruleName: finding?.ruleName ?? "未命名风险",
    riskCategory: finding?.riskCategory ?? "未分类风险",
    severity: finding?.severity ?? "medium",
    riskScore: finding?.riskScore ?? 62,
    matchedPattern: finding?.matchedPattern ?? finding?.evidenceText ?? "",
    matchType: finding?.matchType ?? "semantic",
    evidenceText: finding?.evidenceText ?? "",
    evidenceStart: finding?.evidenceStart ?? 0,
    evidenceEnd: finding?.evidenceEnd ?? 0,
    reason: finding?.reason ?? "系统识别到该表达可能存在实习求职风险，需要进一步核实。",
    verificationAdvice: finding?.verificationAdvice ?? "建议核实招聘主体、收费依据、合同条款和沟通记录。",
    confidence: finding?.confidence ?? 0.8,
    legalSource: finding?.legalSource ?? null,
    source: finding?.source ?? "gemini"
  };
}

function sanitizeFindingsForD1(findings) {
  return Array.isArray(findings)
    ? findings.map(sanitizeFindingForD1)
    : [];
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
  /培训费|培训费用|缴费|缴纳|交费|交钱|收费|费用|押金|保证金|贷款|分期|证件|身份证|原件|无工资|没工资|无薪|无补贴|保就业|包就业|内推|offer/u;

const JD_CLEAR_SAFE_PATTERNS = [
  /(?:无需|无须|不需|不须|不用|不需要|不必|不收取|不会收取|免收|不得收取|禁止收取)[^。！？!?；;\n]{0,24}(?:培训费|培训费用|课程费|费用|押金|保证金|贷款|分期|内推费|服务费)/u,
  /(?:培训费|培训费用|课程费|费用|押金|保证金|贷款|分期|内推费|服务费)[^。！？!?；;\n]{0,24}(?:无需|无须|不需|不须|不用|不需要|不必|不收取|不会收取|免收|不得收取|禁止收取)/u,
  /(?:免费培训|培训免费|岗前培训免费|免收培训费|培训费用由公司承担|公司承担培训费|公司承担培训费用)/u,
  /(?:实习期间|实习期|实习阶段)[^。！？!?；;\n]{0,20}(?:有工资|发工资|有薪|有补贴|发放补贴|提供补贴|\d+\s*元\s*\/\s*月|\d+\s*\/\s*月)/u,
  /(?:转正后|转正薪资|转正工资)[^。！？!?；;\n]{0,20}(?:\d+\s*元\s*\/\s*月|\d+\s*\/\s*月|有五险一金|缴纳五险一金)/u
];

function removeClearlySafeJdExpressions(inputText) {
  return JD_CLEAR_SAFE_PATTERNS.reduce((text, pattern) => {
    return text.replace(pattern, "");
  }, inputText);
}

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


function hasClearSafeJdExpression(text) {
  if (!text) {
    return false;
  }

  return JD_CLEAR_SAFE_PATTERNS.some((pattern) => {
    return pattern.test(text);
  });
}

function hasPositiveSalaryExpression(text) {
  return /(?:实习期间|实习期|实习阶段)?[^。！？!?；;\n]{0,16}(?:\d+\s*元\s*\/\s*月|\d+\s*\/\s*月|月薪\s*\d+|薪资\s*\d+|补贴\s*\d+|有工资|有薪|有补贴|发放工资|发放补贴)/u.test(text);
}

function isPlaceholderAiText(text) {
  return /必须逐字摘录|不得写占位词|用户应该如何核实|为什么有风险|证据短句|具体证据/u.test(String(text || ""));
}

function isUnsupportedAiJdFinding({
  inputText,
  item,
  evidenceText
}) {
  const combinedText = [
    item.riskCategory,
    item.severity,
    item.evidenceText,
    item.reason,
    item.verificationAdvice,
    evidenceText
  ].join(" ");

  const evidenceContext = evidenceText || "";

  if (
    isPlaceholderAiText(item.reason)
    || isPlaceholderAiText(item.verificationAdvice)
  ) {
    return true;
  }

  if (
    hasClearSafeJdExpression(evidenceContext)
    || hasClearSafeJdExpression(inputText)
  ) {
    const hasHardRisk =
      /(?:需要|需|须|必须|要求|应当|请|先|入职前|上岗前|报到前|录用前)[^。！？!?；;\n]{0,24}(?:缴纳|交纳|支付|交费|缴费|自费|自行承担|办理|申请)[^。！？!?；;\n]{0,28}(?:培训费|培训费用|课程费|押金|保证金|贷款|分期|内推费|服务费)/u.test(inputText)
      || /(?:无工资|没有工资|不发工资|无薪|无报酬|没有报酬|无补贴|没有补贴|不发补贴)/u.test(inputText)
      || /(?:扣押|扣留|上交|长期保管|统一保管)[^。！？!?；;\n]{0,20}(?:身份证|证件原件|学生证|毕业证|原件)/u.test(inputText);

    if (!hasHardRisk) {
      return true;
    }
  }

  if (
    /无工资|无薪|无报酬|无补贴|实习报酬缺失/u.test(combinedText)
    && hasPositiveSalaryExpression(evidenceContext)
    && !/(?:无工资|没有工资|不发工资|无薪|无报酬|没有报酬|无补贴|没有补贴|不发补贴)/u.test(evidenceContext)
  ) {
    return true;
  }

  if (
    /付费培训|培训费|培训费用|课程费|培训贷款|培训贷|培训分期/u.test(combinedText)
    && /(?:无需|无须|不需|不须|不用|不需要|不必|不收取|不会收取|免收|不得收取|禁止收取)[^。！？!?；;\n]{0,24}(?:培训费|培训费用|课程费|费用|贷款|分期)/u.test(evidenceContext)
  ) {
    return true;
  }

  return false;
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

    if (
      isUnsupportedAiJdFinding({
        inputText,
        item,
        evidenceText: evidenceRange.text
      })
    ) {
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
    negativePattern: /(?:免费培训|培训免费|不收取培训费|不需缴纳培训费|不需支付培训费|不需要缴纳培训费|不需要支付培训费|不用缴纳培训费|不用支付培训费|免收培训费|无需缴纳培训费|无需支付培训费|公司承担培训费|培训费由公司承担)/u,
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

    const sentenceRange = findSentenceRange(
      inputText,
      evidenceStart,
      evidenceEnd
    );

    const contextRange = createContextRange(
      inputText,
      evidenceStart,
      evidenceEnd,
      40
    );

    const contextText = inputText.slice(
      contextRange.start,
      contextRange.end
    );

    if (
      detector.negativePattern.test(evidenceRange.text)
      || detector.negativePattern.test(sentenceRange.text)
      || detector.negativePattern.test(contextText)
      || JD_CLEAR_SAFE_PATTERNS.some((pattern) => pattern.test(sentenceRange.text))
      || JD_CLEAR_SAFE_PATTERNS.some((pattern) => pattern.test(contextText))
    ) {
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



const GEMINI_JD_MODEL = "gemini-3.5-flash-lite";

function shouldRunGeminiJdReview({ inputText }) {
  return typeof inputText === "string" && inputText.trim().length >= 10;
}

function createGeminiJdPrompt({ inputText, jobTitle, companyName, deterministicFindings }) {
  const candidateSummary = deterministicFindings.length > 0
    ? deterministicFindings.slice(0, 6).map((finding, index) => {
        return [
          "候选风险 " + (index + 1) + "：",
          "类别：" + (finding.riskCategory || finding.ruleName || "未分类"),
          "等级：" + (finding.severity || "medium"),
          "证据：" + (finding.evidenceText || ""),
          "原因：" + (finding.reason || "")
        ].join("\n");
      }).join("\n\n")
    : "无规则候选风险。";

  const noRiskSchema = [
    "{",
    "  \"hasRisk\": false,",
    "  \"overallLevel\": \"low\",",
    "  \"findings\": [],",
    "  \"safeSignals\": [",
    "    {",
    "      \"type\": \"NO_FEE\",",
    "      \"evidenceText\": \"必须逐字摘录 JD 原文\",",
    "      \"reason\": \"为什么说明没有风险\"",
    "    }",
    "  ]",
    "}"
  ].join("\n");

  const riskSchema = [
    "{",
    "  \"hasRisk\": true,",
    "  \"overallLevel\": \"critical\",",
    "  \"findings\": [",
    "    {",
    "      \"riskCategory\": \"付费培训与入职绑定\",",
    "      \"severity\": \"critical\",",
    "      \"evidenceText\": \"必须逐字摘录 JD 原文中的风险证据\",",
    "      \"reason\": \"为什么有风险\",",
    "      \"verificationAdvice\": \"用户应该如何核实\"",
    "    }",
    "  ],",
    "  \"safeSignals\": []",
    "}"
  ].join("\n");

  return [
    "你是大学生实习岗位 JD 风险语义裁决器。",
    "你的任务不是做开放式法律咨询，而是判断原文中是否真的存在实习求职风险行为。",
    "重点识别：入职前收费、培训费、服务费、设备费、押金保证金、培训贷款、扣押证件、收费内推、实习无工资、转正机会与付费绑定。",
    "特别重要：如果原文明确表达不收费、不收押金、不扣押证件、培训免费、费用由公司承担，则不能因为出现风险词就判风险。",
    "必须区分：'不会以培训费、押金等名义收取任何费用' 是安全承诺，不是收费风险。",
    "必须区分：'仅核验身份证，不扣押原件' 是安全承诺，不是证件扣押风险。",
    "不得编造原文没有的信息。",
    "evidenceText 必须逐字来自 JD 原文，不能改写，不能概括。",
    "一个 finding 只能表示一种独立风险；收费、扣押证件和报酬缺失必须分别输出。",
    "同一句中存在多种风险时，必须拆分成多条 findings，不得合并。",
    "不得使用违法、违规、诈骗、涉嫌违反等确定性法律定性。",
    "reason 应使用存在风险线索、需要进一步核实等审慎措辞。",
    "verificationAdvice 不得直接命令用户举报或作出绝对判断。",
    "建议应优先包括暂停付款、核实主体与协议、保留证据，必要时咨询学校就业部门、当地人力资源社会保障部门或专业人士。",
    "如果没有风险，必须返回 hasRisk:false 且 findings 为空数组。",
    "只返回 JSON，不要 Markdown，不要解释性段落。",
    "",
    "无风险 JSON 格式：",
    noRiskSchema,
    "",
    "有风险 JSON 格式：",
    riskSchema,
    "",
    "岗位名称：" + (jobTitle || "未填写"),
    "公司名称：" + (companyName || "未填写"),
    "",
    "规则引擎候选结果：",
    candidateSummary,
    "",
    "JD 原文：",
    inputText.slice(0, 5000)
  ].join("\n");
}

function extractGeminiResponseText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || [];

  return parts
    .map((part) => part?.text || "")
    .join("")
    .trim();
}

function findExactEvidenceRange(inputText, evidenceText) {
  const evidence = String(evidenceText || "").trim();

  if (!evidence) {
    return null;
  }

  const start = inputText.indexOf(evidence);

  if (start === -1) {
    return null;
  }

  return {
    text: evidence,
    start,
    end: start + evidence.length
  };
}

function normalizeGeminiJdFindings({ inputText, geminiResult }) {
  if (!geminiResult || !Array.isArray(geminiResult.findings)) {
    return [];
  }

  return geminiResult.findings
    .slice(0, 5)
    .map((finding, index) => {
      const evidenceRange = findExactEvidenceRange(inputText, finding?.evidenceText);

      if (!evidenceRange) {
        return null;
      }

      let severity = normalizeAiSeverity(
        finding?.severity || finding?.riskLevel
      );

      const riskCategory = trimAiText(
        finding?.riskCategory,
        40,
        "Gemini 语义识别风险"
      );

      const severityContext =
        riskCategory + " " + evidenceRange.text;

      const isUnpaidInternship =
        /(无薪实习|实习报酬缺失|无工资|无报酬|无补贴)/u.test(
          severityContext
        );

      const includesOtherCriticalBehavior =
        /(缴纳|交纳|支付|收取|收费|培训费|贷款|押金|保证金|扣押证件)/u.test(
          severityContext
        );

      if (isUnpaidInternship && !includesOtherCriticalBehavior) {
        severity = "medium";
      }

      return {
        ruleId: null,
        ruleCode: "GEMINI_JD_SEMANTIC_" + String(index + 1).padStart(2, "0"),
        ruleName: riskCategory,
        riskCategory,
        severity,
        riskScore: AI_SEVERITY_SCORES[severity] || 62,
        matchedPattern: evidenceRange.text,
        matchType: "gemini-semantic",
        evidenceText: evidenceRange.text,
        evidenceStart: evidenceRange.start,
        evidenceEnd: evidenceRange.end,
        reason: trimAiText(
          finding?.reason,
          160,
          "Gemini 语义裁决认为该表达可能构成实习求职风险。"
        ),
        verificationAdvice: trimAiText(
          finding?.verificationAdvice || finding?.advice,
          160,
          "建议核实招聘主体、收费依据、合同条款和退款规则，避免先付款后入职。"
        ),
        confidence: 0.88,
        legalSource: null,
        source: "gemini"
      };
    })
    .filter(Boolean);
}

async function analyzeJdWithGemini({
  env,
  inputText,
  jobTitle,
  companyName,
  deterministicFindings
}) {
  const emptyResult = {
    used: false,
    hasDecision: false,
    hasRisk: false,
    findings: [],
    error: "not_run",
    errorDetail: null
  };

  if (!env.GEMINI_API_KEY) {
    return {
      ...emptyResult,
      error: "missing_api_key"
    };
  }

  if (!shouldRunGeminiJdReview({ inputText, deterministicFindings })) {
    return {
      ...emptyResult,
      error: "skipped_by_policy"
    };
  }

  const prompt = createGeminiJdPrompt({
    inputText,
    jobTitle,
    companyName,
    deterministicFindings
  });

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/"
    + GEMINI_JD_MODEL
    + ":generateContent?key="
    + encodeURIComponent(env.GEMINI_API_KEY);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 900,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Gemini JD review failed:", response.status, errorText.slice(0, 300));

      return {
        ...emptyResult,
        used: true,
        error: "http_" + response.status,
        errorDetail: errorText.slice(0, 500)
      };
    }

    const payload = await response.json();
    const responseText = extractGeminiResponseText(payload);
    const geminiResult = parseAiJsonResponse(responseText);

    if (!geminiResult || typeof geminiResult.hasRisk !== "boolean") {
      return {
        ...emptyResult,
        used: true,
        error: "json_parse_failed"
      };
    }

    if (geminiResult.hasRisk === false) {
      return {
        used: true,
        hasDecision: true,
        hasRisk: false,
        findings: [],
        error: "none"
      };
    }

    const findings = normalizeGeminiJdFindings({
      inputText,
      geminiResult
    });

    if (findings.length === 0) {
      return {
        ...emptyResult,
        used: true,
        error: "no_valid_evidence_or_empty_findings"
      };
    }

    return {
      used: true,
      hasDecision: true,
      hasRisk: true,
      findings,
      error: "none"
    };
  } catch (error) {
    console.error("Gemini JD semantic review failed:", error);

    return {
      ...emptyResult,
      used: true,
      error: "fetch_exception"
    };
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

  const semanticFindings = [];
  const deterministicFindings = [];

  const geminiReview = await analyzeJdWithGemini({
    env,
    inputText,
    jobTitle,
    companyName,
    deterministicFindings
  });

  const useGeminiDecision = geminiReview.hasDecision;

  const aiFindings = [];

  const findings = useGeminiDecision
    ? normalizeReviewFindings(geminiReview.hasRisk ? geminiReview.findings : [])
    : [];

  const geminiReviewUnavailable = geminiReview.used && !useGeminiDecision;

  const overallScore = geminiReviewUnavailable
    ? 0
    : combineRiskScores(findings);

  const overallLevel = geminiReviewUnavailable
    ? "insufficient_information"
    : determineOverallLevel({
        textLength: inputText.length,
        overallScore,
        findings
      });

  const overallConfidence = geminiReviewUnavailable
    ? 0
    : calculateOverallConfidence(findings);
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
    findings: sanitizeFindingsForD1(findings)
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
      findingCount: findings.length,
      reviewUnavailable: geminiReviewUnavailable
    }),
    findings,
    reviewStatus: geminiReviewUnavailable
      ? "unavailable"
      : "completed",
    reviewProvider: "gemini",
    reviewModel: GEMINI_JD_MODEL,
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

const CONTRACT_ENGINE_VERSION = "contract-ai-hybrid-d1-0.2.0";

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


const CONTRACT_AI_SUSPICIOUS_PATTERN =
  /押金|保证金|岗位保证金|实习押金|服装费|资料费|工牌费|设备押金|扣押|扣留|上交|统一保管|身份证|证件原件|毕业证|学生证|培训费|培训贷款|培训贷|分期|课程费|保录用|保就业|内推|服务费|违约金|赔偿/u;

const CONTRACT_SEMANTIC_RISK_DETECTORS = [
  {
    baseRuleCode: "CONTRACT_UPFRONT_DEPOSIT_OR_GUARANTEE",
    riskCategory: "入职前押金或财物担保",
    pattern: /(?:甲方|公司|用人单位)?[^。！？!?；;\n]{0,12}(?:要求|需|须|应当|必须)?[^。！？!?；;\n]{0,8}(?:乙方|实习生|学生)?[^。！？!?；;\n]{0,8}(?:缴纳|交纳|支付|交付|付清)[^。！？!?；;\n]{0,20}(?:押金|保证金|岗位保证金|岗位押金|实习押金|服装费|资料费|工牌费|设备押金)|(?:押金|保证金|岗位保证金|岗位押金|实习押金)[^。！？!?；;\n]{0,24}(?:不退|暂扣|扣除|作为担保)/u,
    negativePattern: /(?:不收取|无需缴纳|不需要缴纳|不得收取|禁止收取|不涉及|不包含)[^。！？!?；;\n]{0,20}(?:押金|保证金|费用|财物)/u,
    reason: "合同条款将入职、实习或履约与押金、保证金、服装费、资料费等个人付费或财物担保绑定，存在收费或担保风险。",
    advice: "请核实收费主体、收费依据、退款条件和是否为入职前必要条件；不要轻易支付押金、保证金或所谓工装资料费用。"
  },
  {
    baseRuleCode: "CONTRACT_DOCUMENT_WITHHELD",
    riskCategory: "证件原件扣押或长期保管",
    pattern: /(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)[^。！？!?；;\n]{0,24}(?:由甲方保管|由公司保管|统一保管|长期保管|暂存公司|交由公司保管|上交|扣押|扣留|离职后归还)|(?:扣押|扣留|上交|留存|统一保管|长期保管|暂存|代管)[^。！？!?；;\n]{0,20}(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)/u,
    negativePattern: /(?:仅|只)[^。！？!?；;\n]{0,8}(?:核验|查验|查看)[^。！？!?；;\n]{0,18}(?:身份证|证件|原件)|(?:核验|查验|查看)[^。！？!?；;\n]{0,18}(?:后|完毕后)?(?:立即|当场)?(?:归还|退还)/u,
    reason: "合同条款涉及证件原件上交、扣押或长期保管，可能影响学生人身和求职自由，应作为重点风险核实。",
    advice: "证件原件通常只应现场核验，不宜交由对方长期保管；请保留合同条款、沟通记录并要求对方说明依据。"
  },
  {
    baseRuleCode: "CONTRACT_PAID_TRAINING_OR_LOAN",
    riskCategory: "付费培训或培训贷款",
    pattern: /(?:培训|课程|岗前培训)[^。！？!?；;\n]{0,24}(?:贷款|培训贷|分期|分期贷款|分期付款|分期支付|自费|自行承担|缴纳|交纳|支付|培训费|课程费)|(?:贷款|培训贷|分期|分期贷款|分期付款|分期支付)[^。！？!?；;\n]{0,24}(?:培训|课程|岗前培训)|(?:签署|办理|申请)[^。！？!?；;\n]{0,18}(?:培训借款协议|课程分期|助学分期|培训分期|培训贷款|培训贷)/u,
    negativePattern: /(?:免费培训|培训免费|培训费用由公司承担|公司承担培训费用|不收取培训费|无需缴纳培训费|不办理培训贷款)/u,
    reason: "合同条款将培训、课程、上岗或转正与个人付费、分期或贷款绑定，存在付费培训或培训贷风险。",
    advice: "请核实培训是否为入职必要条件、是否承诺录用、是否存在贷款或分期协议、退款规则和违约责任。"
  },
  {
    baseRuleCode: "CONTRACT_PAID_GUARANTEED_OFFER",
    riskCategory: "付费保录用或收费内推",
    pattern: /(?:付费|收费|缴费|交费|支付)[^。！？!?；;\n]{0,20}(?:保录用|保证录用|保证安排岗位|保就业|内推|内部推荐|保证拿到offer|保证拿到 offer)|(?:保录用|保证录用|保证安排岗位|保就业|内推|内部推荐|保证拿到offer|保证拿到 offer)[^。！？!?；;\n]{0,20}(?:收费|付费|服务费|费用|缴费|交费|支付)/u,
    negativePattern: /(?:不收取|无需支付|免费|不提供)[^。！？!?；;\n]{0,18}(?:内推费|服务费|保录用费用|费用)/u,
    reason: "合同条款将岗位、内推、录用或 offer 与服务费、内推费等个人付费绑定，存在收费保录用风险。",
    advice: "请核实服务主体、收费依据、退款条件和承诺录用的真实性；不要轻信付费保 offer 或付费内推。"
  }
];

function createContractLegalSourceFromRule(rule) {
  return {
    id: rule.legal_source_id,
    title: rule.legal_title,
    issuingAuthority: rule.legal_issuing_authority,
    documentNumber: rule.legal_document_number,
    articleNumber: rule.legal_article_number,
    sourceType: rule.legal_source_type,
    sourceUrl: rule.legal_source_url,
    citationText: rule.legal_citation_text
  };
}

function findContractRuleByCode(rules, ruleCode) {
  return rules.find((rule) => rule.rule_code === ruleCode) || rules[0] || null;
}

function hasSimilarContractFinding(existingFindings, detector) {
  return existingFindings.some((finding) => {
    const combinedText = [
      finding.ruleCode,
      finding.ruleName,
      finding.riskCategory,
      finding.reason,
      finding.advice
    ].join(" ");

    if (finding.ruleCode === detector.baseRuleCode) {
      return true;
    }

    if (combinedText.includes(detector.riskCategory)) {
      return true;
    }

    return false;
  });
}

function createContractSemanticFallbackFindings({
  inputText,
  rules,
  existingFindings
}) {
  const findings = [];

  for (const detector of CONTRACT_SEMANTIC_RISK_DETECTORS) {
    if (hasSimilarContractFinding(existingFindings, detector)) {
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

    const sentenceRange = findSentenceRange(
      inputText,
      evidenceStart,
      evidenceEnd
    );

    if (detector.negativePattern.test(sentenceRange.text)) {
      continue;
    }

    const sourceRule = findContractRuleByCode(
      rules,
      detector.baseRuleCode
    );

    if (!sourceRule) {
      continue;
    }

    findings.push({
      ruleId: sourceRule.id,
      ruleCode: sourceRule.rule_code,
      ruleName: sourceRule.rule_name,
      riskCategory: detector.riskCategory || sourceRule.risk_category,
      riskLevel: sourceRule.risk_level,
      riskScore: Number(sourceRule.risk_score),
      matchedText,
      matchType: "semantic-fallback",
      evidenceText: sentenceRange.text,
      reason: detector.reason || sourceRule.reason,
      advice: detector.advice || sourceRule.advice,
      applicabilityNote: sourceRule.applicability_note,
      confidence: 0.82,
      legalSource: createContractLegalSourceFromRule(sourceRule),
      source: "semantic"
    });
  }

  return findings;
}

function shouldRunContractAiReview({
  inputText,
  findings
}) {
  if (!inputText || findings.length > 0) {
    return false;
  }

  return CONTRACT_AI_SUSPICIOUS_PATTERN.test(inputText);
}

function normalizeContractAiRiskLevel(value) {
  const normalized = String(value || "").toLowerCase();

  if (["critical", "high", "medium", "low"].includes(normalized)) {
    return normalized;
  }

  return "medium";
}

function findContractAiBaseRule({
  rules,
  item
}) {
  const text = [
    item.riskCategory,
    item.evidenceText,
    item.reason,
    item.advice,
    item.verificationAdvice
  ].join(" ");

  if (/身份证|证件|原件|扣押|扣留|保管|上交/u.test(text)) {
    return findContractRuleByCode(rules, "CONTRACT_DOCUMENT_WITHHELD");
  }

  if (/培训|课程|贷款|培训贷|分期|培训费|课程费/u.test(text)) {
    return findContractRuleByCode(rules, "CONTRACT_PAID_TRAINING_OR_LOAN");
  }

  if (/保录用|保就业|offer|内推|内部推荐|服务费/u.test(text)) {
    return findContractRuleByCode(rules, "CONTRACT_PAID_GUARANTEED_OFFER");
  }

  if (/押金|保证金|服装费|资料费|工牌费|设备押金|财物|担保/u.test(text)) {
    return findContractRuleByCode(rules, "CONTRACT_UPFRONT_DEPOSIT_OR_GUARANTEE");
  }

  return rules[0] || null;
}

function locateContractAiEvidence(inputText, evidenceText) {
  const rawEvidence = trimAiText(evidenceText, 140, "");

  if (
    rawEvidence
    && !rawEvidence.includes("原文中的证据")
    && !rawEvidence.includes("证据短句")
    && !rawEvidence.includes("具体证据")
  ) {
    const start = inputText.indexOf(rawEvidence);

    if (start !== -1) {
      return findSentenceRange(
        inputText,
        start,
        start + rawEvidence.length
      );
    }
  }

  return findSuspiciousSentence(inputText);
}

function normalizeContractAiFindings({
  inputText,
  aiResult,
  rules
}) {
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
    const sourceRule = findContractAiBaseRule({
      rules,
      item
    });

    if (!sourceRule) {
      continue;
    }

    const riskLevel = normalizeContractAiRiskLevel(item.riskLevel || item.severity);
    const evidenceRange = locateContractAiEvidence(
      inputText,
      item.evidenceText
    );

    const riskCategory = trimAiText(
      item.riskCategory,
      80,
      sourceRule.risk_category
    );

    const findingKey = [
      sourceRule.rule_code,
      riskCategory,
      evidenceRange.start,
      evidenceRange.end
    ].join(":");

    if (findingKeys.has(findingKey)) {
      continue;
    }

    findingKeys.add(findingKey);

    findings.push({
      ruleId: sourceRule.id,
      ruleCode: sourceRule.rule_code,
      ruleName: sourceRule.rule_name,
      riskCategory,
      riskLevel,
      riskScore: Number(sourceRule.risk_score),
      matchedText: createAiMatchedPattern({
        rawEvidenceText: item.evidenceText,
        fallbackText: evidenceRange.text
      }),
      matchType: "contract-ai-semantic",
      evidenceText: evidenceRange.text,
      reason: trimAiText(
        item.reason,
        300,
        sourceRule.reason
      ),
      advice: trimAiText(
        item.advice || item.verificationAdvice,
        300,
        sourceRule.advice
      ),
      applicabilityNote: sourceRule.applicability_note,
      confidence: 0.76,
      legalSource: createContractLegalSourceFromRule(sourceRule),
      source: "ai"
    });

    if (findings.length >= 3) {
      break;
    }
  }

  return findings;
}

async function analyzeContractWithAI({
  env,
  inputText,
  contractTitle,
  rules
}) {
  if (!env.AI) {
    return [];
  }

  const prompt = [
    "你是大学生实习合同风险审查助手。",
    "任务：判断下面实习/兼职合同条款是否存在风险。",
    "重点识别：押金保证金、入职前收费、扣押证件原件、付费培训、培训贷款、分期课程、付费保录用、收费内推、异常违约金。",
    "如果同一段文本里同时出现多个风险，必须拆成多条 findings。",
    "要求：只返回 JSON，不要输出 Markdown，不要输出解释性段落。",
    "JSON 格式如下：",
    "{",
    "  \"hasRisk\": true,",
    "  \"overallLevel\": \"critical\",",
    "  \"findings\": [",
    "    {",
    "      \"riskCategory\": \"押金或保证金风险\",",
    "      \"riskLevel\": \"critical\",",
    "      \"evidenceText\": \"必须逐字摘录合同原文中的具体证据，不得写占位词\",",
    "      \"reason\": \"为什么有风险\",",
    "      \"advice\": \"用户应该如何核实或处理\"",
    "    }",
    "  ]",
    "}",
    "没有风险时返回：{\"hasRisk\":false,\"overallLevel\":\"low\",\"findings\":[]}",
    "",
    `合同标题：${contractTitle || "未填写"}`,
    `合同原文：${inputText.slice(0, 3500)}`
  ].join("\n");

  try {
    const aiResponse = await env.AI.run(
      AI_JD_MODEL,
      {
        messages: [
          {
            role: "system",
            content: "你只做合同风险识别和结构化输出，不提供最终法律结论。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 800
      }
    );

    const responseText =
      typeof aiResponse === "string"
        ? aiResponse
        : aiResponse?.response || aiResponse?.result?.response || "";

    const aiResult = parseAiJsonResponse(responseText);

    return normalizeContractAiFindings({
      inputText,
      aiResult,
      rules
    });
  } catch (error) {
    console.error("Contract AI semantic review failed:", error);
    return [];
  }
}

async function reviewContract({
  env,
  contractTitle,
  contractText
}) {
  const startedAt = Date.now();
  const normalizedContractText = normalizeContractText(contractText);
  const rules = await loadEnabledContractRules(env);

  const ruleFindings = rules.flatMap((rule) => {
    return analyzeContractRule({
      inputText: normalizedContractText,
      rule
    });
  });

  const semanticFindings = createContractSemanticFallbackFindings({
    inputText: normalizedContractText,
    rules,
    existingFindings: ruleFindings
  });

  const deterministicFindings = [
    ...ruleFindings,
    ...semanticFindings
  ];

  const aiFindings = shouldRunContractAiReview({
    inputText: normalizedContractText,
    findings: deterministicFindings
  })
    ? await analyzeContractWithAI({
        env,
        inputText: normalizedContractText,
        contractTitle,
        rules
      })
    : [];

  const findings = [
    ...deterministicFindings,
    ...aiFindings
  ];

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
    confidenceNote: "confidence 仅代表当前规则、语义和 AI 复核的置信提示，不代表经过人工标注测试得到的真实准确率。",
    findingCount: findings.length,
    summary: createContractSummary({
      findingCount: findings.length
    }),
    aiReviewUsed: aiFindings.length > 0,
    semanticReviewUsed: semanticFindings.length > 0,
    processingTimeMs,
    findings: findings.map((finding) => {
      return {
        ruleCode: finding.ruleCode,
        ruleName: finding.ruleName,
        riskCategory: finding.riskCategory,
        riskLevel: finding.riskLevel,
        riskScore: finding.riskScore,
        matchedText: finding.matchedText,
        matchType: finding.matchType,
        evidenceText: finding.evidenceText,
        reason: finding.reason,
        advice: finding.advice,
        applicabilityNote: finding.applicabilityNote,
        confidence: finding.confidence,
        source: finding.source || "rule",
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






