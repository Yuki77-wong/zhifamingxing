import crypto from "node:crypto";

import pool from "../config/database.js";


const ENGINE_VERSION =
  "rule-engine-0.2.0";


const SENTENCE_BOUNDARIES =
  new Set([
    "。",
    "！",
    "？",
    "!",
    "?",
    "；",
    ";",
    "\n"
  ]);


const CONTRAST_EXPRESSION =
  /但|但是|然而|不过|可是|却|除外|除非/;


/*
 * 不连续文本匹配规则。
 *
 * 用于识别：
 *
 * 缴纳500元岗位押金
 *
 * 支付人民币300元作为保证金
 *
 * 身份证原件需要交由公司统一保管
 *
 * 培训费用需要办理贷款
 */

const FLEXIBLE_RULE_PATTERNS = {

  RECRUITMENT_UPFRONT_FEE: [

    "(?:(?:入职|上岗|报到|录用|签约)[^。！？!?；;\\n]{0,12})?(?:需|须|需要|要求|先|统一)?[^。！？!?；;\\n]{0,8}(?:缴纳|交纳|支付|交付|付款|收取)[^。！？!?；;\\n]{0,20}(?:押金|保证金|报名费|工号费|服装费|资料费|岗位稳定金|稳定金|设备押金|任务押金)"

  ],


  PAID_TRAINING_OR_TRAINING_LOAN: [

    "(?:培训|课程)[^。！？!?；;\\n]{0,20}(?:贷款|借款|分期付款|分期支付|分期)",

    "(?:贷款|借款|分期付款|分期支付|分期)[^。！？!?；;\\n]{0,20}(?:培训|课程)",

    "(?:付费|缴费|交费|支付)[^。！？!?；;\\n]{0,16}(?:培训|课程)[^。！？!?；;\\n]{0,16}(?:入职|上岗|就业|安排工作|保就业|包就业)"

  ],


  IDENTITY_DOCUMENT_RETENTION: [

    "(?:扣押|扣留|上交|统一保管|长期保管|留存)[^。！？!?；;\\n]{0,18}(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)",

    "(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)[^。！？!?；;\\n]{0,18}(?:由公司保管|统一保管|长期保管|扣押|扣留|上交|留存)"

  ],


  PAID_INTERNAL_REFERRAL: [

    "(?:付费|收费|缴费|交费|支付)[^。！？!?；;\\n]{0,14}(?:内推|内部推荐|直通面试|保录用|保offer|保证录用)",

    "(?:内推|内部推荐|直通面试|保录用|保offer|保证录用)[^。！？!?；;\\n]{0,14}(?:收费|付费|服务费|费用)"

  ],


  VOCATIONAL_INTERNSHIP_FEE_REFERENCE: [

    "(?:实习|岗位)[^。！？!?；;\\n]{0,20}(?:缴纳|交纳|支付|收取)[^。！？!?；;\\n]{0,18}(?:押金|管理费|材料费|服务费|培训费|就业服务费)"

  ]

};


/*
 * 每类规则的核心风险对象。
 *
 * 用于判断否定表达是否真的针对
 * 当前命中的风险内容。
 */

const RULE_RISK_TERMS = {

  RECRUITMENT_UPFRONT_FEE: [

    "费用",

    "押金",

    "保证金",

    "报名费",

    "工号费",

    "服装费",

    "资料费",

    "稳定金"

  ],


  PAID_TRAINING_OR_TRAINING_LOAN: [

    "培训",

    "课程",

    "贷款",

    "借款",

    "分期"

  ],


  IDENTITY_DOCUMENT_RETENTION: [

    "身份证",

    "毕业证",

    "学生证",

    "证件",

    "原件"

  ],


  PAID_INTERNAL_REFERRAL: [

    "内推",

    "内部推荐",

    "录用",

    "offer",

    "面试"

  ],


  VOCATIONAL_INTERNSHIP_FEE_REFERENCE: [

    "实习",

    "费用",

    "押金",

    "管理费",

    "材料费",

    "服务费",

    "培训费"

  ]

};


const FEE_RELATED_RULES =
  new Set([

    "RECRUITMENT_UPFRONT_FEE",

    "PAID_TRAINING_OR_TRAINING_LOAN",

    "PAID_INTERNAL_REFERRAL",

    "VOCATIONAL_INTERNSHIP_FEE_REFERENCE"

  ]);


/*
 * 通用否定表达。
 *
 * 用于识别：
 *
 * 不收取任何培训费用
 *
 * 无需缴纳押金
 *
 * 不办理培训贷款
 *
 * 免费提供岗前培训
 */

const GENERIC_NEGATIVE_PATTERNS = [

  "(?:不|无须|无需|不用|不必|禁止|不会)[^。！？!?；;\\n]{0,8}(?:收取|缴纳|交纳|支付|付款|办理|扣押|扣留|上交|保管)[^。！？!?；;\\n]{0,20}(?:任何费用|任何证件|费用|培训费|培训费用|押金|保证金|贷款|培训贷款|身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件|内推费|内推费用)",

  "(?:免费(?:提供)?[^。！？!?；;\\n]{0,12}(?:培训|课程)|(?:培训|课程)[^。！？!?；;\\n]{0,12}免费)",

  "(?:费用|培训费用|培训费)[^。！？!?；;\\n]{0,10}(?:由公司承担|由用人单位承担|全部由公司承担)"

];


const ADDITIONAL_GENERIC_NEGATIVE_PATTERNS = [

  "(?:不|不会|绝不|不得|禁止|无须|无需|不需要|不必)[^。！？!?；;\\n]{0,16}(?:向应聘者|向学生|向候选人|向实习生)?[^。！？!?；;\\n]{0,12}(?:收取|缴纳|交纳|支付|付款|收费|办理|要求)[^。！？!?；;\\n]{0,24}(?:任何费用|任何财物|押金|保证金|岗位押金|岗位保证金|报名费|资料费|服装费|培训费|培训费用|课程费|贷款|培训贷款|内推费|内推费用)",

  "(?:不|不会|绝不|不得|禁止|无须|无需|不需要|不必)[^。！？!?；;\\n]{0,16}(?:扣押|扣留|留存|保管|上交|提交)[^。！？!?；;\\n]{0,24}(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件|证件原件|原件)",

  "(?:仅|只)[^。！？!?；;\\n]{0,10}(?:现场)?(?:核验|查验|查看)[^。！？!?；;\\n]{0,20}(?:身份证|身份证原件|学生证|证件|证件原件)",

  "(?:核验|查验|查看)[^。！？!?；;\\n]{0,16}(?:后|完毕后)?(?:立即|当场)?(?:归还|退还)[^。！？!?；;\\n]{0,10}(?:原件|身份证|证件)",

  "(?:岗前培训|培训|课程)[^。！？!?；;\\n]{0,16}(?:免费|完全免费|由公司承担|由用人单位承担)",

  "(?:免费|完全免费)[^。！？!?；;\\n]{0,16}(?:岗前培训|培训|课程)",

  "(?:不|不会|无须|无需|不需要|不必)[^。！？!?；;\\n]{0,16}(?:办理|申请|签署|承担|偿还|支付)?[^。！？!?；;\\n]{0,16}(?:贷款|培训贷款|课程分期|助学分期|培训分期)",

  "(?:不涉及|不包含|不含|没有|无)[^。！？!?；;\\n]{0,12}(?:任何)?(?:贷款|培训贷款|收费|押金|保证金|扣押证件)",

  "(?:押金|保证金|培训贷款|收费|扣押证件)[^。！？!?；;\\n]{0,16}(?:是|属于)?(?:禁止事项|骗局|风险提示|防范提示)",

  "(?:不|不会|绝不|不得|禁止|无需|无须|不需要)[^。！？!?；;\\n]{0,10}(?:收|收取|缴纳|交纳|支付|交付)[^。！？!?；;\\n]{0,24}(?:服装押金|设备押金|工牌押金|资料押金|材料押金|岗位押金|押金|保证金)"

];


const ADDITIONAL_FLEXIBLE_RULE_PATTERNS = {

  RECRUITMENT_UPFRONT_FEE: [

    "(?:入职|上岗|入岗|实习|签约|录用|报到)?[^。！？!?；;\\n]{0,14}(?:需|需要|须|要求|应|先)?[^。！？!?；;\\n]{0,10}(?:缴纳|交纳|支付|缴费|交费|付款|先缴|先交)[^。！？!?；;\\n]{0,24}(?:入岗服务费|岗位管理费|录用服务费|就业安置费|名额保留费|岗前保证金|服装押金|设备押金|工牌押金|资料押金|材料押金|岗位服务费|岗位稳定金|报名费|资料费|服装费|工具包)",

    "(?:先缴后返|先交费再上岗|先付款再上岗|先付款后安排岗位|先交费后安排面试|先交资料费|先付款购买工具包)",

    "(?:入岗服务费|岗位管理费|录用服务费|就业安置费|名额保留费|岗位服务费|岗位稳定金|资料押金|材料押金)[^。！？!?；;\\n]{0,18}(?:到账|缴清|支付|缴纳|交纳)"

  ],

  PAID_TRAINING_OR_TRAINING_LOAN: [

    "(?:缴纳|交纳|支付|承担|自费|自行承担)[^。！？!?；;\\n]{0,18}(?:培训费|培训费用|课程费|课程费用|课程服务费|训练营费用|训练营)",

    "(?:培训费|培训费用|课程费|课程费用|课程服务费)[^。！？!?；;\\n]{0,18}(?:从工资中扣除|工资中扣除|分期偿还|分期支付|分期付款|自行承担|自费)",

    "(?:签署|办理|申请)[^。！？!?；;\\n]{0,18}(?:培训借款协议|课程分期|助学分期|培训分期|培训贷款|培训贷)",

    "(?:缴费|交费|付费|支付)[^。！？!?；;\\n]{0,18}(?:参加)?(?:训练营|培训|课程)[^。！？!?；;\\n]{0,24}(?:包就业|保就业|安排工作|安排岗位|入职|上岗)",

    "(?:培训后|课程结束后|训练营结束后)[^。！？!?；;\\n]{0,18}(?:包就业|保就业|安排工作|安排岗位|入职|上岗)",

    "(?:第三方|培训机构|第三方培训机构)[^。！？!?；;\\n]{0,20}(?:可能)?(?:收取|收费|另行收取|支付|缴纳|交纳)[^。！？!?；;\\n]{0,18}(?:课程费|课程费用|培训费|培训费用|费用)",

    "(?:第三方培训机构可能收取课程费|第三方机构可能收取培训费|第三方课程另行收费|第三方课程费用另行收取)",

    "(?:并非|不是)[^。！？!?；;\\n]{0,10}(?:所有|全部)?(?:培训|课程)[^。！？!?；;\\n]{0,8}(?:免费)[^。！？!?；;\\n]{0,30}(?:部分|个别)?[^。！？!?；;\\n]{0,12}(?:课程|培训)?[^。！？!?；;\\n]{0,12}(?:需|需要|须|由)?(?:学员|个人)?(?:自费|自行承担|支付|缴纳)",

    "(?:并非所有培训都免费|并非所有课程都免费|不是所有培训都免费|不是所有课程都免费)",

    "(?:部分课程需学员自费|部分课程需要学员自费|部分培训需个人自费|部分课程需个人自费)",

    "(?:部分|个别)[^。！？!?；;\\n]{0,8}(?:课程|培训)[^。！？!?；;\\n]{0,16}(?:需|需要|须|由)?(?:学员|个人)?(?:自费|自行承担|支付|缴纳)[^。！？!?；;\\n]{0,18}(?:上岗|入职|就业|参加考核|上岗考核)"

  ],

  IDENTITY_DOCUMENT_RETENTION: [

    "(?:身份证|身份证原件|毕业证|毕业证原件|学生证|学生证原件|证件原件)[^。！？!?；;\\n]{0,18}(?:交由公司保管|由公司保管|由公司统一保管|暂存公司|统一代管|离职后归还|实习结束后归还)",

    "(?:公司|单位|人事|行政部)?[^。！？!?；;\\n]{0,10}(?:保管|代管|暂存|留存|扣留|扣押)[^。！？!?；;\\n]{0,18}(?:身份证原件|毕业证原件|学生证原件|证件原件)",

    "(?:离职后|实习结束后|项目结束后)[^。！？!?；;\\n]{0,12}(?:归还|退还)[^。！？!?；;\\n]{0,12}(?:身份证|毕业证|学生证|证件原件)"

  ],

  PAID_INTERNAL_REFERRAL: [

    "(?:缴费|交费|付费|支付)[^。！？!?；;\\n]{0,18}(?:保入职|保录用|保证录用|保证安排岗位|保就业|获得内推资格|获得内部推荐|拿到offer|拿到 offer)",

    "(?:内部名额|内推资格|内部推荐|内推服务|直通面试)[^。！？!?；;\\n]{0,18}(?:需付费|需要付费|收费|付费|服务费|缴费|交费)",

    "(?:收费|付费|缴费|交费|支付)[^。！？!?；;\\n]{0,18}(?:保录用|保入职|保就业|内推|内部推荐|安排岗位|直通面试)"

  ]

};


const ADDITIONAL_RULE_RISK_TERMS = {

  RECRUITMENT_UPFRONT_FEE: [
    "费用",
    "收费",
    "押金",
    "保证金",
    "报名费",
    "资料费",
    "服装费",
    "服务费",
    "管理费",
    "安置费",
    "稳定金",
    "财物"
  ],

  PAID_TRAINING_OR_TRAINING_LOAN: [
    "培训",
    "课程",
    "训练营",
    "贷款",
    "培训贷",
    "分期",
    "借款",
    "培训费",
    "课程费"
  ],

  IDENTITY_DOCUMENT_RETENTION: [
    "身份证",
    "毕业证",
    "学生证",
    "证件",
    "原件",
    "留存",
    "保管",
    "扣押"
  ],

  PAID_INTERNAL_REFERRAL: [
    "内推",
    "内部推荐",
    "录用",
    "入职",
    "offer",
    "岗位",
    "就业",
    "直通面试"
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

  } catch {

    return [];

  }

}


function normalizeInputText(
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


function createInputHash(
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


  if (
    !searchText
  ) {

    return results;

  }


  let searchStart = 0;


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
  regexSource
) {

  const results = [];


  const regularExpression =
    new RegExp(
      regexSource,
      "gu"
    );


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

      regularExpression.lastIndex += 1;

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
    of candidates
  ) {

    const candidateKey =
      [
        candidate.start,

        candidate.end,

        candidate.matchedText
      ]

      .join(
        ":"
      );


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


function findSentenceRange(
  text,
  evidenceStart,
  evidenceEnd
) {

  let sentenceStart =
    evidenceStart;


  let sentenceEnd =
    evidenceEnd;


  while (
    sentenceStart
    >
    0
  ) {

    const previousCharacter =
      text[
        sentenceStart
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


    sentenceStart -= 1;

  }


  while (
    sentenceEnd
    <
    text.length
  ) {

    const currentCharacter =
      text[
        sentenceEnd
      ];


    sentenceEnd += 1;


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
      sentenceStart,

    end:
      sentenceEnd,

    text:
      text

        .slice(
          sentenceStart,
          sentenceEnd
        )

        .trim()

  };

}


function createContextRange(
  text,
  evidenceStart,
  evidenceEnd,
  contextWindow
) {

  return {

    start:

      Math.max(

        0,

        evidenceStart
        -
        contextWindow

      ),


    end:

      Math.min(

        text.length,

        evidenceEnd
        +
        contextWindow

      )

  };

}


function rangesOverlap(
  firstRange,
  secondRange
) {

  return (

    firstRange.start
    <
    secondRange.end

    &&

    secondRange.start
    <
    firstRange.end

  );

}


function calculateRangeDistance(
  firstRange,
  secondRange
) {

  if (
    rangesOverlap(
      firstRange,
      secondRange
    )
  ) {

    return 0;

  }


  if (
    firstRange.end
    <=
    secondRange.start
  ) {

    return (

      secondRange.start
      -
      firstRange.end

    );

  }


  return (

    firstRange.start
    -
    secondRange.end

  );

}


function getTextBetweenRanges(
  text,
  firstRange,
  secondRange
) {

  const start =
    Math.min(

      firstRange.end,

      secondRange.end

    );


  const end =
    Math.max(

      firstRange.start,

      secondRange.start

    );


  if (
    start
    >=
    end
  ) {

    return "";

  }


  return text.slice(
    start,
    end
  );

}


function findNegativeCandidates({

  inputText,

  negativePatterns,

  contextRange

}) {

  const contextText =
    inputText.slice(

      contextRange.start,

      contextRange.end

    );


  const candidates = [];


  for (
    const negativePattern
    of negativePatterns
  ) {

    const localMatches =
      findAllTextOccurrences(

        contextText,

        negativePattern

      );


    for (
      const localMatch
      of localMatches
    ) {

      candidates.push({

        start:

          contextRange.start
          +
          localMatch.start,

        end:

          contextRange.start
          +
          localMatch.end,

        matchedText:

          localMatch.matchedText,

        matchType:

          "rule-negative"

      });

    }

  }


  for (
    const regexSource
    of [
      ...GENERIC_NEGATIVE_PATTERNS,
      ...ADDITIONAL_GENERIC_NEGATIVE_PATTERNS
    ]
  ) {

    const localMatches =
      findAllRegexOccurrences(

        contextText,

        regexSource

      );


    for (
      const localMatch
      of localMatches
    ) {

      candidates.push({

        start:

          contextRange.start
          +
          localMatch.start,

        end:

          contextRange.start
          +
          localMatch.end,

        matchedText:

          localMatch.matchedText,

        matchType:

          "generic-negative"

      });

    }

  }


  return deduplicateCandidates(
    candidates
  );

}


function hasSharedRiskTerm({

  ruleCode,

  positiveText,

  negativeText

}) {

  const riskTerms =
    [
      ...(
        RULE_RISK_TERMS[
          ruleCode
        ]
        ||
        []
      ),
      ...(
        ADDITIONAL_RULE_RISK_TERMS[
          ruleCode
        ]
        ||
        []
      )
    ];


  return riskTerms.some(

    (
      riskTerm
    ) => {

      return (

        positiveText.includes(
          riskTerm
        )

        &&

        negativeText.includes(
          riskTerm
        )

      );

    }

  );

}


function isGenericFeeNegation({

  ruleCode,

  negativeText

}) {

  if (
    !FEE_RELATED_RULES.has(
      ruleCode
    )
  ) {

    return false;

  }


  return (

    negativeText.includes(
      "不收取任何费用"
    )

    ||

    negativeText.includes(
      "无需缴纳费用"
    )

    ||

    negativeText.includes(
      "无需支付费用"
    )

    ||

    negativeText.includes(
      "费用由公司承担"
    )

    ||

    negativeText.includes(
      "全部由公司承担"
    )

    ||

    negativeText.includes(
      "免费"
    )

    ||

    negativeText.includes(
      "不会收取"
    )

    ||

    negativeText.includes(
      "不收取"
    )

    ||

    negativeText.includes(
      "绝不收取"
    )

    ||

    negativeText.includes(
      "不得收取"
    )

    ||

    negativeText.includes(
      "禁止向"
    )

    ||

    negativeText.includes(
      "由公司承担"
    )

    ||

    negativeText.includes(
      "不需要支付"
    )

  );

}


function isCandidateNegated({

  inputText,

  rule,

  candidate,

  contextRange,

  negativePatterns

}) {

  if (
    rule.rule_code
    ===
    "PAID_TRAINING_OR_TRAINING_LOAN"
    &&
    /(?:并非|不是)[^。！？!?；;\n]{0,12}(?:所有|全部)?(?:培训|课程)[^。！？!?；;\n]{0,10}免费|(?:部分|个别)[^。！？!?；;\n]{0,10}(?:培训|课程)[^。！？!?；;\n]{0,18}自费/u.test(
      candidate.matchedText
    )
  ) {

    return false;

  }


  const negativeCandidates =
    findNegativeCandidates({

      inputText,

      negativePatterns,

      contextRange

    });


  for (
    const negativeCandidate
    of negativeCandidates
  ) {

    const candidateRange = {

      start:
        candidate.start,

      end:
        candidate.end

    };


    const negativeRange = {

      start:
        negativeCandidate.start,

      end:
        negativeCandidate.end

    };


    const overlaps =
      rangesOverlap(

        candidateRange,

        negativeRange

      );


    const semanticallyRelated =

      hasSharedRiskTerm({

        ruleCode:
          rule.rule_code,

        positiveText:
          candidate.matchedText,

        negativeText:
          negativeCandidate
            .matchedText

      })

      ||

      isGenericFeeNegation({

        ruleCode:
          rule.rule_code,

        negativeText:
          negativeCandidate
            .matchedText

      });


    if (
      !semanticallyRelated
    ) {

      continue;

    }


    const negativeTextBeforeCandidate =
      inputText.slice(
        negativeCandidate.start,
        candidate.start
      );


    if (
      negativeCandidate.start
      <
      candidate.start

      &&

      CONTRAST_EXPRESSION.test(
        negativeTextBeforeCandidate
      )
    ) {

      continue;

    }


    if (
      overlaps
    ) {

      return true;

    }


    const distance =
      calculateRangeDistance(

        candidateRange,

        negativeRange

      );


    if (
      distance
      >
      30
    ) {

      continue;

    }


    const textBetween =
      getTextBetweenRanges(

        inputText,

        candidateRange,

        negativeRange

      );


    if (
      CONTRAST_EXPRESSION.test(
        textBetween
      )
    ) {

      continue;

    }


    return true;

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

      0.84

      :

      0.8;


  const lengthBonus =

    Math.min(

      matchedText.length
      *
      0.01,

      0.12

    );


  const sourceBonus =

    hasLegalSource

      ?

      0.02

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

    return 0.72;

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

  textLength,

  overallScore,

  findings

}) {

  if (
    textLength
    <
    30
  ) {

    return (
      "insufficient_information"
    );

  }


  const hasCriticalFinding =

    findings.some(

      (
        finding
      ) => {

        return (

          finding.severity
          ===
          "critical"

        );

      }

    );


  if (
    hasCriticalFinding

    ||

    overallScore
    >=
    90
  ) {

    return "critical";

  }


  if (
    overallScore
    >=
    70
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


function createSummary({

  overallLevel,

  findingCount

}) {

  if (
    overallLevel
    ===
    "insufficient_information"
  ) {

    return (

      "当前 JD 信息较少，"

      +

      "暂时不足以完成可靠审查。"

    );

  }


  if (
    findingCount
    ===
    0
  ) {

    return (

      "暂未发现当前规则库"

      +

      "覆盖的明显高风险表达。"

      +

      "该结果不代表岗位绝对安全，"

      +

      "仍需核实薪资、工时、"

      +

      "工作内容和用工主体。"

    );

  }


  return (

    `共发现 ${

      findingCount

    } 项需要关注的风险线索。`

  );

}


async function loadEnabledRules(
  connection
) {

  const [
    rows
  ] =

    await connection.query(

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


          legal_sources.title

            AS legal_title,


          legal_sources.issuing_authority

            AS legal_issuing_authority,


          legal_sources.article_number

            AS legal_article_number,


          legal_sources.source_url

            AS legal_source_url


        FROM risk_rules


        LEFT JOIN legal_sources


          ON

            legal_sources.id

            =

            risk_rules.legal_source_id


        WHERE


          risk_rules.is_enabled

          =

          TRUE


        ORDER BY


          FIELD

          (

            risk_rules.severity,


            'critical',


            'high',


            'medium',


            'low'

          ),


          risk_rules.id

      `

    );


  return rows;

}


function createRuleCandidates({

  inputText,

  rule,

  positivePatterns

}) {

  const candidates = [];


  for (
    const positivePattern
    of positivePatterns
  ) {

    candidates.push(

      ...

      findAllTextOccurrences(

        inputText,

        positivePattern

      )

    );

  }


  const flexiblePatterns =

    [
      ...(
        FLEXIBLE_RULE_PATTERNS[

          rule.rule_code

        ]

        ||

        []
      ),
      ...(
        ADDITIONAL_FLEXIBLE_RULE_PATTERNS[
          rule.rule_code
        ]
        ||
        []
      )
    ];


  for (
    const regexSource
    of flexiblePatterns
  ) {

    candidates.push(

      ...

      findAllRegexOccurrences(

        inputText,

        regexSource

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

  if (
    rule.rule_code
    ===
    "VOCATIONAL_INTERNSHIP_FEE_REFERENCE"
    &&
    !/(职业学校|中职|高职|技工学校|学校组织|实习管理费|实习材料费|实习服务费|实习报酬提成)/u.test(
      inputText
    )
  ) {

    return [];

  }

  const positivePatterns =

    parseJsonArray(

      rule.positive_patterns

    );


  const negativePatterns =

    parseJsonArray(

      rule.negative_patterns

    );


  const candidates =

    createRuleCandidates({

      inputText,

      rule,

      positivePatterns

    });


  const findings = [];


  const findingKeys =

    new Set();


  for (
    const candidate
    of candidates
  ) {

    const sentenceRange =

      findSentenceRange(

        inputText,

        candidate.start,

        candidate.end

      );


    const contextRange =

      createContextRange(

        inputText,

        candidate.start,

        candidate.end,

        rule.context_window

      );


    const isNegated =

      isCandidateNegated({

        inputText,

        rule,

        candidate,

        contextRange,

        negativePatterns

      });


    if (
      isNegated
    ) {

      continue;

    }


    const findingKey =

      [

        rule.id,

        sentenceRange.start,

        sentenceRange.end

      ]

      .join(
        ":"
      );


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


    const legalSource =

      rule.legal_source_id

      ?

      {

        id:

          rule
            .legal_source_id,


        title:

          rule
            .legal_title,


        issuingAuthority:

          rule
            .legal_issuing_authority,


        articleNumber:

          rule
            .legal_article_number,


        sourceUrl:

          rule
            .legal_source_url

      }

      :

      null;


    findings.push({

      ruleId:

        rule.id,


      ruleCode:

        rule.rule_code,


      ruleName:

        rule.rule_name,


      riskCategory:

        rule.risk_category,


      severity:

        rule.severity,


      riskScore:

        Number(

          rule.base_score

        ),


      matchedPattern:

        candidate
          .matchedText,


      matchType:

        candidate
          .matchType,


      evidenceText:

        sentenceRange
          .text,


      evidenceStart:

        sentenceRange
          .start,


      evidenceEnd:

        sentenceRange
          .end,


      reason:

        rule
          .rule_explanation,


      verificationAdvice:

        rule
          .verification_advice,


      confidence:

        calculateFindingConfidence({

          matchedText:

            candidate
              .matchedText,


          matchType:

            candidate
              .matchType,


          hasLegalSource:

            Boolean(
              legalSource
            )

        }),


      legalSource

    });


    if (
      findings.length
      >=
      3
    ) {

      return findings;

    }

  }


  return findings;

}


function findingsHaveOverlappingEvidence(
  firstFinding,
  secondFinding
) {

  if (
    firstFinding.evidenceStart
    ===
    undefined
    ||
    secondFinding.evidenceStart
    ===
    undefined
  ) {

    return (
      firstFinding.evidenceText
      ===
      secondFinding.evidenceText
    );

  }


  return (
    firstFinding.evidenceStart
    <
    secondFinding.evidenceEnd

    &&

    secondFinding.evidenceStart
    <
    firstFinding.evidenceEnd
  );

}


function normalizeReviewFindings(
  findings
) {

  return findings.filter(

    (
      finding,
      index
    ) => {

      if (
        finding.ruleCode
        !==
        "VOCATIONAL_INTERNSHIP_FEE_REFERENCE"
      ) {

        return true;

      }


      return !findings.some(

        (
          otherFinding,
          otherIndex
        ) => {

          return (
            otherIndex
            !==
            index

            &&

            [
              "RECRUITMENT_UPFRONT_FEE",
              "PAID_TRAINING_OR_TRAINING_LOAN"
            ].includes(
              otherFinding.ruleCode
            )

            &&

            findingsHaveOverlappingEvidence(
              finding,
              otherFinding
            )
          );

        }

      );

    }

  );

}


async function saveReview({

  connection,

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

  const [
    reviewResult
  ] =

    await connection.execute(

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

          ?

        )

      `,

      [

        jobTitle
        ||
        null,


        companyName
        ||
        null,


        inputText,


        inputHash,


        overallScore,


        overallLevel,


        overallConfidence,


        ENGINE_VERSION,


        processingTimeMs

      ]

    );


  const reviewId =

    reviewResult
      .insertId;


  for (
    const finding
    of findings
  ) {

    await connection.execute(

      `

        INSERT INTO

          jd_review_findings

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

          ?,

          ?,

          ?

        )

      `,

      [

        reviewId,


        finding.ruleId,


        finding
          .legalSource
          ?.id

        ||

        null,


        finding.riskCategory,


        finding.severity,


        finding.riskScore,


        finding.evidenceText,


        finding.evidenceStart,


        finding.evidenceEnd,


        finding.reason,


        finding
          .verificationAdvice,


        finding.confidence

      ]

    );

  }


  return reviewId;

}


export async function reviewJobDescription({

  jobTitle,

  companyName,

  jdText

}) {

  const startedAt =

    Date.now();


  const inputText =

    normalizeInputText(

      jdText

    );


  const inputHash =

    createInputHash(

      inputText

    );


  const connection =

    await pool

      .getConnection();


  try {

    await connection

      .beginTransaction();


    const rules =

      await loadEnabledRules(

        connection

      );


    const findings =

      normalizeReviewFindings(

        rules.flatMap(

        (
          rule
        ) => {

          return analyzeRule({

            inputText,

            rule

          });

        }

        )

      );


    const overallScore =

      combineRiskScores(

        findings

      );


    const overallLevel =

      determineOverallLevel({

        textLength:

          inputText.length,


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


    await connection

      .commit();


    return {

      reviewId,


      engineVersion:

        ENGINE_VERSION,


      inputLength:

        inputText.length,


      overallScore,


      overallLevel,


      confidence:

        overallConfidence,


      findingCount:

        findings.length,


      summary:

        createSummary({

          overallLevel,


          findingCount:

            findings.length

        }),


      findings,


      processingTimeMs

    };

  } catch (
    error
  ) {

    await connection

      .rollback();


    throw error;

  } finally {

    connection.release();

  }

}


export async function evaluateJobDescriptionText({

  jdText

}) {

  const startedAt =

    Date.now();


  const inputText =

    normalizeInputText(

      jdText

    );


  const connection =

    await pool

      .getConnection();


  try {

    const rules =

      await loadEnabledRules(

        connection

      );


    const findings =

      normalizeReviewFindings(

        rules.flatMap(

        (
          rule
        ) => {

          return analyzeRule({

            inputText,

            rule

          });

        }

        )

      );


    const overallScore =

      combineRiskScores(

        findings

      );


    const overallLevel =

      determineOverallLevel({

        textLength:

          inputText.length,


        overallScore,


        findings

      });


    const overallConfidence =

      calculateOverallConfidence(

        findings

      );


    return {

      engineVersion:

        ENGINE_VERSION,


      inputLength:

        inputText.length,


      overallScore,


      overallLevel,


      confidence:

        overallConfidence,


      findingCount:

        findings.length,


      findings,


      processingTimeMs:

        Date.now()

        -

        startedAt

    };

  } finally {

    connection.release();

  }

}
