<script setup>
import {
  computed,
  reactive,
  ref
} from "vue";

import {
  createJdReview
} from "../api/jdReview.js";


const form = reactive({
  jobTitle: "",
  companyName: "",
  jdText: ""
});


const loading = ref(false);

const errorMessage = ref("");

const reviewResult = ref(null);


const levelInformation = {

  critical: {
    text: "极高风险",
    className: "critical",
    description:
      "发现严重风险线索，建议暂停付款、签约或提交重要证件，并优先核实相关信息。"
  },

  high: {
    text: "高风险",
    className: "high",
    description:
      "发现较明显风险线索，建议在进一步核实前保持谨慎。"
  },

  medium: {
    text: "中等风险",
    className: "medium",
    description:
      "发现需要进一步确认的信息，建议补充核实岗位和用工情况。"
  },

  low: {
    text: "暂未发现明显风险",
    className: "low",
    description:
      "当前规则库暂未发现明显风险表达，但不代表岗位绝对安全。"
  },

  insufficient_information: {
    text: "信息不足",
    className: "insufficient",
    description:
      "当前 JD 内容较少，暂时不足以完成可靠审查。"
  }

};


const severityInformation = {

  critical: {
    text: "严重风险",
    className: "critical"
  },

  high: {
    text: "高风险",
    className: "high"
  },

  medium: {
    text: "中等风险",
    className: "medium"
  },

  low: {
    text: "低风险",
    className: "low"
  }

};


const currentLevel = computed(() => {

  const level =
    reviewResult.value
      ?.overallLevel;

  return (
    levelInformation[level]
    ||
    levelInformation
      .insufficient_information
  );

});


const canSubmit = computed(() => {

  return (
    form.jdText
      .trim()
      .length
    >=
    20

    &&

    !loading.value
  );

});


function getSeverityInformation(
  severity
) {

  return (
    severityInformation[
      severity
    ]

    ||

    {
      text:
        "风险提示",

      className:
        "medium"
    }
  );

}


function getMatchTypeText(
  matchType
) {

  if (
    matchType
    ===
    "exact"
  ) {

    return "精确文本匹配";

  }


  if (
    matchType
    ===
    "flexible"
  ) {

    return "上下文间隔匹配";

  }


  return "规则匹配";

}


function formatScore(
  score
) {

  const numericScore =
    Number(
      score
    );


  if (
    Number.isNaN(
      numericScore
    )
  ) {

    return "0.0";

  }


  return numericScore
    .toFixed(1);

}


function formatConfidence(
  confidence
) {

  const numericConfidence =
    Number(
      confidence
    );


  if (
    Number.isNaN(
      numericConfidence
    )
  ) {

    return "—";

  }


  return (
    numericConfidence
    *
    100
  )
  .toFixed(0)
  +
  "%";

}


function fillHighRiskExample() {

  form.jobTitle =
    "数据分析实习生";


  form.companyName =
    "示例企业";


  form.jdText =
    "招聘数据分析实习生。"
    +
    "入职前需缴纳500元岗位押金，"
    +
    "并办理培训贷款，"
    +
    "培训后安排工作。"
    +
    "工作地点为长沙，"
    +
    "每周实习五天。";


  reviewResult.value =
    null;


  errorMessage.value =
    "";

}


function fillSafeExample() {

  form.jobTitle =
    "数据分析实习生";


  form.companyName =
    "示例企业";


  form.jdText =
    "招聘数据分析实习生。"
    +
    "公司提供免费岗前培训，"
    +
    "不收取任何培训费用，"
    +
    "无需缴纳押金，"
    +
    "也不办理培训贷款。"
    +
    "工作地点为长沙，"
    +
    "每周实习四天。";


  reviewResult.value =
    null;


  errorMessage.value =
    "";

}


function clearForm() {

  form.jobTitle =
    "";


  form.companyName =
    "";


  form.jdText =
    "";


  reviewResult.value =
    null;


  errorMessage.value =
    "";

}


async function submitReview() {

  if (
    !canSubmit.value
  ) {

    return;

  }


  loading.value =
    true;


  errorMessage.value =
    "";


  reviewResult.value =
    null;


  try {

    const response =
      await createJdReview({

        jobTitle:
          form.jobTitle
            .trim(),

        companyName:
          form.companyName
            .trim(),

        jdText:
          form.jdText
            .trim()

      });


    reviewResult.value =
      response.data.data;


    window.setTimeout(
      () => {

        document
          .getElementById(
            "review-result"
          )
          ?.scrollIntoView({

            behavior:
              "smooth",

            block:
              "start"

          });

      },

      100

    );

  } catch (
    error
  ) {

    errorMessage.value =

      error.response
        ?.data
        ?.message

      ||

      error.message

      ||

      "岗位 JD 审查失败，请稍后重试。";

  } finally {

    loading.value =
      false;

  }

}
</script>


<template>

  <div class="review-page">

    <header class="site-header">

      <div class="header-container">

        <RouterLink
          class="brand"
          to="/"
        >

          <span class="brand-logo">

            智

          </span>


          <span class="brand-text">

            <strong>

              智法明行

            </strong>


            <small>

              大学生实习权益智能助手

            </small>

          </span>

        </RouterLink>


        <nav class="navigation">

          <RouterLink to="/">

            首页

          </RouterLink>


          <RouterLink to="/jd-review">

            岗位筛查

          </RouterLink>


          <RouterLink to="/legal-knowledge">

            权益知识库

          </RouterLink>


          <RouterLink to="/rights-guides">

            维权指引

          </RouterLink>

        </nav>

      </div>

    </header>


    <main>

      <section class="page-hero">

        <div class="page-container hero-content">

          <div class="hero-copy">

            <div class="hero-tag">

              JOB DESCRIPTION REVIEW

            </div>


            <h1>

              岗位 JD

              <span>

                智能风险审查

              </span>

            </h1>


            <p>

              粘贴完整岗位描述，

              系统将读取 MySQL
              中已审核启用的风险规则，

              识别风险表达、否定语境、
              原文证据及对应官方依据。

            </p>


            <div class="hero-principles">

              <span>

                ✓ 保留风险原文

              </span>


              <span>

                ✓ 展示判断原因

              </span>


              <span>

                ✓ 关联官方来源

              </span>

            </div>

          </div>


          <div class="hero-process">

            <div class="process-title">

              当前审查流程

            </div>


            <div class="process-item">

              <b>

                01

              </b>


              <div>

                <strong>

                  文本预处理

                </strong>


                <span>

                  清理文本并定位句子

                </span>

              </div>

            </div>


            <div class="process-line"></div>


            <div class="process-item">

              <b>

                02

              </b>


              <div>

                <strong>

                  规则与语境分析

                </strong>


                <span>

                  精确匹配、间隔匹配和否定过滤

                </span>

              </div>

            </div>


            <div class="process-line"></div>


            <div class="process-item">

              <b>

                03

              </b>


              <div>

                <strong>

                  证据与依据输出

                </strong>


                <span>

                  返回风险原文、建议及官方来源

                </span>

              </div>

            </div>

          </div>

        </div>

      </section>


      <section
        id="review-form"
        class="review-section"
      >

        <div class="page-container review-layout">

          <section class="form-card">

            <div class="card-heading">

              <div>

                <span>

                  STEP 01

                </span>


                <h2>

                  粘贴岗位信息

                </h2>

              </div>


              <button
                class="clear-button"
                type="button"
                @click="clearForm"
              >

                清空内容

              </button>

            </div>


            <div class="example-buttons">

              <button
                type="button"
                @click="fillHighRiskExample"
              >

                填入高风险测试示例

              </button>


              <button
                type="button"
                @click="fillSafeExample"
              >

                填入否定语境测试示例

              </button>

            </div>


            <div class="form-grid">

              <label>

                <span>

                  岗位名称

                </span>


                <input
                  v-model="form.jobTitle"
                  maxlength="300"
                  placeholder="例如：数据分析实习生"
                  type="text"
                >

              </label>


              <label>

                <span>

                  企业名称

                </span>


                <input
                  v-model="form.companyName"
                  maxlength="300"
                  placeholder="可选，请填写招聘企业名称"
                  type="text"
                >

              </label>

            </div>


            <label class="jd-input">

              <span>

                岗位 JD 原文

              </span>


              <textarea
                v-model="form.jdText"
                maxlength="30000"
                placeholder="请粘贴完整岗位描述，包括岗位职责、任职要求、薪资待遇、工作时间、实习期限、培训要求、收费要求等内容。"
              ></textarea>

            </label>


            <div class="input-footer">

              <div>

                <span>

                  {{
                    form.jdText.length
                  }}

                </span>

                / 30000 字符

              </div>


              <p>

                至少输入 20 个字符

              </p>

            </div>


            <div
              v-if="errorMessage"
              class="error-message"
            >

              <strong>

                审查失败

              </strong>


              <span>

                {{ errorMessage }}

              </span>

            </div>


            <button
              class="submit-button"
              :disabled="!canSubmit"
              type="button"
              @click="submitReview"
            >

              <span
                v-if="loading"
                class="loading-icon"
              ></span>


              <span>

                {{
                  loading
                    ?
                    "正在分析岗位 JD……"
                    :
                    "开始风险审查"
                }}

              </span>

            </button>


            <p class="form-notice">

              审查结果用于辅助识别岗位风险，

              不替代律师提供的正式法律意见，

              也不直接对具体岗位作违法认定。

            </p>

          </section>


          <aside class="tips-card">

            <span class="tips-label">

              填写建议

            </span>


            <h3>

              JD 越完整，

              审查结果越有参考价值

            </h3>


            <div class="tip-item">

              <b>

                1

              </b>


              <p>

                尽量粘贴完整岗位页面，
                不要只输入岗位名称。

              </p>

            </div>


            <div class="tip-item">

              <b>

                2

              </b>


              <p>

                保留薪资、工时、
                培训、收费和入职要求。

              </p>

            </div>


            <div class="tip-item">

              <b>

                3

              </b>


              <p>

                不要主动粘贴身份证号、
                手机号等个人敏感信息。

              </p>

            </div>


            <div class="current-engine">

              <span>

                当前引擎

              </span>


              <strong>

                规则与上下文混合引擎

              </strong>


              <small>

                目前仍处于测试与持续校准阶段

              </small>

            </div>

          </aside>

        </div>

      </section>


      <section
        v-if="reviewResult"
        id="review-result"
        class="result-section"
      >

        <div class="page-container">

          <div class="result-heading">

            <span>

              STEP 02

            </span>


            <h2>

              岗位风险审查结果

            </h2>


            <p>

              审查记录编号：

              {{
                reviewResult.reviewId
              }}

            </p>

          </div>


          <div
            class="overview-card"
            :class="
              currentLevel.className
            "
          >

            <div class="score-area">

              <span>

                综合风险分

              </span>


              <strong>

                {{
                  formatScore(
                    reviewResult
                      .overallScore
                  )
                }}

              </strong>


              <small>

                满分 100

              </small>

            </div>


            <div class="level-area">

              <span
                class="level-badge"
                :class="
                  currentLevel
                    .className
                "
              >

                {{
                  currentLevel.text
                }}

              </span>


              <h3>

                {{
                  reviewResult.summary
                }}

              </h3>


              <p>

                {{
                  currentLevel
                    .description
                }}

              </p>

            </div>


            <div class="overview-data">

              <div>

                <span>

                  风险线索

                </span>


                <strong>

                  {{
                    reviewResult
                      .findingCount
                  }}

                  项

                </strong>

              </div>


              <div>

                <span>

                  处理耗时

                </span>


                <strong>

                  {{
                    reviewResult
                      .processingTimeMs
                  }}

                  ms

                </strong>

              </div>


              <div>

                <span>

                  引擎版本

                </span>


                <strong>

                  {{
                    reviewResult
                      .engineVersion
                  }}

                </strong>

              </div>

            </div>

          </div>


          <div class="confidence-note">

            <strong>

              当前规则匹配置信度：

              {{
                formatConfidence(
                  reviewResult
                    .confidence
                )
              }}

            </strong>


            <p>

              该数值是当前规则引擎的内部置信指标，

              尚未经过人工标注测试集校准，

              不能解释为平台真实准确率。

            </p>

          </div>


          <div
            v-if="
              reviewResult
                .findingCount
              ===
              0
            "
            class="empty-result"
          >

            <div>

              ✓

            </div>


            <h3>

              暂未发现当前规则库覆盖的明显风险

            </h3>


            <p>

              这不代表岗位绝对安全。

              仍建议核实企业主体、
              实际工作内容、薪资、
              工时、实习期限及协议条款。

            </p>

          </div>


          <div
            v-else
            class="finding-list"
          >

            <article
              v-for="
                (
                  finding,
                  index
                )
                in
                reviewResult.findings
              "
              :key="
                finding.ruleCode
                +
                '-'
                +
                index
              "
              class="finding-card"
            >

              <div class="finding-header">

                <div>

                  <span>

                    风险线索

                    {{
                      String(
                        index
                        +
                        1
                      )
                      .padStart(
                        2,
                        "0"
                      )
                    }}

                  </span>


                  <h3>

                    {{
                      finding.ruleName
                    }}

                  </h3>

                </div>


                <span
                  class="severity-badge"
                  :class="
                    getSeverityInformation(
                      finding.severity
                    )
                    .className
                  "
                >

                  {{
                    getSeverityInformation(
                      finding.severity
                    )
                    .text
                  }}

                </span>

              </div>


              <div class="finding-meta">

                <span>

                  风险类别：

                  <strong>

                    {{
                      finding
                        .riskCategory
                    }}

                  </strong>

                </span>


                <span>

                  单项风险分：

                  <strong>

                    {{
                      formatScore(
                        finding
                          .riskScore
                      )
                    }}

                  </strong>

                </span>


                <span>

                  匹配方式：

                  <strong>

                    {{
                      getMatchTypeText(
                        finding
                          .matchType
                      )
                    }}

                  </strong>

                </span>

              </div>


              <section class="evidence-box">

                <span>

                  风险原文证据

                </span>


                <blockquote>

                  “{{
                    finding
                      .evidenceText
                  }}”

                </blockquote>


                <small>

                  实际命中：

                  {{
                    finding
                      .matchedPattern
                  }}

                </small>

              </section>


              <div class="analysis-grid">

                <section>

                  <span>

                    判断原因

                  </span>


                  <p>

                    {{
                      finding.reason
                    }}

                  </p>

                </section>


                <section>

                  <span>

                    核实与处理建议

                  </span>


                  <p>

                    {{
                      finding
                        .verificationAdvice
                    }}

                  </p>

                </section>

              </div>


              <section
                v-if="
                  finding
                    .legalSource
                "
                class="source-box"
              >

                <div class="source-icon">

                  法

                </div>


                <div class="source-content">

                  <span>

                    官方依据

                  </span>


                  <strong>

                    {{
                      finding
                        .legalSource
                        .title
                    }}

                  </strong>


                  <p>

                    发布机构：

                    {{
                      finding
                        .legalSource
                        .issuingAuthority
                    }}

                  </p>


                  <p
                    v-if="
                      finding
                        .legalSource
                        .articleNumber
                    "
                  >

                    对应条款：

                    {{
                      finding
                        .legalSource
                        .articleNumber
                    }}

                  </p>

                </div>


                <a
                  :href="
                    finding
                      .legalSource
                      .sourceUrl
                  "
                  rel="noopener noreferrer"
                  target="_blank"
                >

                  查看官方原文

                </a>

              </section>

            </article>

          </div>


          <section class="result-disclaimer">

            <strong>

              结果说明

            </strong>


            <p>

              当前结果由规则与上下文分析引擎生成，

              只展示系统已覆盖的风险类型。

              平台会继续扩充真实依据、
              完善语义分析并通过人工标注数据进行测试。

            </p>

          </section>

        </div>

      </section>

    </main>


    <footer class="footer">

      <div class="page-container footer-content">

        <div>

          <strong>

            智法明行

          </strong>


          <p>

            识别实习风险，

            守护每一次职场出发。

          </p>

        </div>


        <p>

          风险识别结果仅供信息参考，

          不构成正式法律意见。

        </p>

      </div>

    </footer>

  </div>

</template>


<style scoped>

.review-page {

  min-height: 100vh;

  background: #f5f7fb;

  color: #17233d;

}


.page-container,

.header-container {

  width: min(
    1180px,
    calc(
      100%
      -
      40px
    )
  );

  margin: 0 auto;

}


.site-header {

  position: sticky;

  z-index: 30;

  top: 0;

  border-bottom:
    1px solid
    rgba(
      226,
      231,
      241,
      0.9
    );

  background:
    rgba(
      255,
      255,
      255,
      0.92
    );

  backdrop-filter:
    blur(18px);

}


.header-container {

  display: flex;

  height: 74px;

  align-items: center;

  justify-content:
    space-between;

  gap: 30px;

}


.brand {

  display: flex;

  align-items: center;

  gap: 12px;

  color: inherit;

}


.brand-logo {

  display: grid;

  width: 43px;

  height: 43px;

  place-items: center;

  border-radius: 14px;

  background:

    linear-gradient(

      135deg,

      #2457e6,

      #7357f6

    );

  color: white;

  font-size: 19px;

  font-weight: 900;

}


.brand-text {

  display: flex;

  flex-direction: column;

  gap: 2px;

}


.brand-text strong {

  font-size: 17px;

}


.brand-text small {

  color: #8993a7;

  font-size: 10px;

}


.navigation {

  display: flex;

  gap: 26px;

}


.navigation a {

  color: #667085;

  font-size: 14px;

}


.navigation a:hover {

  color: #2457e6;

}


.page-hero {

  padding:

    78px 0 82px;

  background:

    radial-gradient(

      circle at 85% 15%,

      rgba(

        115,

        87,

        246,

        0.18

      ),

      transparent 31%

    ),

    linear-gradient(

      135deg,

      #f7faff,

      #faf8ff

    );

}


.hero-content {

  display: grid;

  align-items: center;

  grid-template-columns:

    1.05fr

    0.95fr;

  gap: 80px;

}


.hero-tag {

  display: inline-flex;

  padding:

    8px 13px;

  border:

    1px solid

    rgba(

      36,

      87,

      230,

      0.14

    );

  border-radius: 99px;

  background: white;

  color: #2457e6;

  font-size: 11px;

  font-weight: 900;

  letter-spacing:
    0.12em;

}


.hero-copy h1 {

  margin:

    24px 0;

  font-size:

    clamp(

      45px,

      5.5vw,

      70px

    );

  line-height: 1.13;

  letter-spacing:
    -0.05em;

}


.hero-copy h1 span {

  display: block;

  margin-top: 5px;

  background:

    linear-gradient(

      100deg,

      #2457e6,

      #7357f6

    );

  background-clip: text;

  color: transparent;

}


.hero-copy > p {

  max-width: 660px;

  color: #69758b;

  font-size: 17px;

  line-height: 1.9;

}


.hero-principles {

  display: flex;

  flex-wrap: wrap;

  gap: 14px;

  margin-top: 25px;

}


.hero-principles span {

  padding:

    8px 12px;

  border-radius: 9px;

  background: white;

  color: #556176;

  font-size: 12px;

}


.hero-process {

  padding: 30px;

  border:

    1px solid

    rgba(

      255,

      255,

      255,

      0.9

    );

  border-radius: 24px;

  background:

    rgba(

      255,

      255,

      255,

      0.93

    );

  box-shadow:

    0 28px 70px

    rgba(

      49,

      66,

      118,

      0.13

    );

}


.process-title {

  margin-bottom: 24px;

  color: #7a8598;

  font-size: 12px;

  font-weight: 800;

  letter-spacing:
    0.08em;

}


.process-item {

  display: flex;

  align-items: center;

  gap: 16px;

}


.process-item b {

  display: grid;

  width: 45px;

  height: 45px;

  flex-shrink: 0;

  place-items: center;

  border-radius: 13px;

  background: #edf3ff;

  color: #2457e6;

  font-size: 12px;

}


.process-item div {

  display: flex;

  flex-direction: column;

  gap: 5px;

}


.process-item strong {

  font-size: 15px;

}


.process-item span {

  color: #8490a5;

  font-size: 12px;

}


.process-line {

  width: 2px;

  height: 30px;

  margin:

    6px 0 6px 21px;

  background: #e5eaf4;

}


.review-section {

  padding:

    82px 0;

}


.review-layout {

  display: grid;

  align-items: start;

  grid-template-columns:

    minmax(
      0,
      1fr
    )

    320px;

  gap: 25px;

}


.form-card,

.tips-card {

  border:

    1px solid

    #e4e9f2;

  border-radius: 22px;

  background: white;

  box-shadow:

    0 15px 45px

    rgba(

      31,

      49,

      95,

      0.06

    );

}


.form-card {

  padding: 32px;

}


.card-heading {

  display: flex;

  align-items:
    flex-start;

  justify-content:
    space-between;

  gap: 30px;

}


.card-heading span,

.result-heading > span {

  color: #2457e6;

  font-size: 11px;

  font-weight: 900;

  letter-spacing:
    0.13em;

}


.card-heading h2,

.result-heading h2 {

  margin:

    8px 0 0;

  font-size: 29px;

}


.clear-button {

  border: 0;

  background:
    transparent;

  color: #7b8699;

  cursor: pointer;

}


.clear-button:hover {

  color: #2457e6;

}


.example-buttons {

  display: flex;

  flex-wrap: wrap;

  gap: 10px;

  margin:

    28px 0 22px;

}


.example-buttons button {

  padding:

    9px 13px;

  border:

    1px solid

    #dfe5f0;

  border-radius: 9px;

  background: #f9faff;

  color: #526078;

  cursor: pointer;

  font-size: 12px;

}


.example-buttons button:hover {

  border-color:
    #2457e6;

  color: #2457e6;

}


.form-grid {

  display: grid;

  grid-template-columns:

    repeat(
      2,
      1fr
    );

  gap: 16px;

}


.form-grid label,

.jd-input {

  display: flex;

  flex-direction: column;

  gap: 9px;

}


.form-grid label > span,

.jd-input > span {

  color: #3d485e;

  font-size: 13px;

  font-weight: 800;

}


input,

textarea {

  width: 100%;

  border:

    1px solid

    #dfe5ef;

  border-radius: 12px;

  outline: none;

  background: #fbfcff;

  color: #1e2a42;

  font: inherit;

  transition:

    border-color 0.2s,

    box-shadow 0.2s,

    background 0.2s;

}


input {

  height: 48px;

  padding:

    0 15px;

}


textarea {

  min-height: 310px;

  padding: 17px;

  resize: vertical;

  line-height: 1.8;

}


input:focus,

textarea:focus {

  border-color:
    #2457e6;

  background: white;

  box-shadow:

    0 0 0 4px

    rgba(

      36,

      87,

      230,

      0.08

    );

}


.jd-input {

  margin-top: 19px;

}


.input-footer {

  display: flex;

  justify-content:
    space-between;

  margin-top: 9px;

  color: #929caf;

  font-size: 11px;

}


.input-footer p {

  margin: 0;

}


.input-footer span {

  color: #2457e6;

  font-weight: 800;

}


.error-message {

  display: flex;

  flex-direction: column;

  gap: 5px;

  margin-top: 20px;

  padding: 15px;

  border:

    1px solid

    #ffd7d7;

  border-radius: 11px;

  background: #fff5f5;

  color: #c73e3e;

  font-size: 13px;

}


.submit-button {

  display: flex;

  width: 100%;

  height: 52px;

  align-items: center;

  justify-content: center;

  gap: 10px;

  margin-top: 23px;

  border: 0;

  border-radius: 13px;

  background:

    linear-gradient(

      135deg,

      #2457e6,

      #665df0

    );

  color: white;

  cursor: pointer;

  font-size: 15px;

  font-weight: 800;

  box-shadow:

    0 14px 30px

    rgba(

      36,

      87,

      230,

      0.2

    );

}


.submit-button:disabled {

  cursor:
    not-allowed;

  opacity: 0.5;

  box-shadow: none;

}


.loading-icon {

  width: 17px;

  height: 17px;

  border:

    2px solid

    rgba(

      255,

      255,

      255,

      0.4

    );

  border-top-color:
    white;

  border-radius: 50%;

  animation:

    rotate

    0.8s

    linear

    infinite;

}


@keyframes rotate {

  to {

    transform:

      rotate(
        360deg
      );

  }

}


.form-notice {

  margin:

    15px 0 0;

  color: #939daf;

  font-size: 11px;

  line-height: 1.7;

  text-align: center;

}


.tips-card {

  position: sticky;

  top: 98px;

  padding: 27px;

}


.tips-label {

  color: #2457e6;

  font-size: 11px;

  font-weight: 900;

  letter-spacing:
    0.12em;

}


.tips-card h3 {

  margin:

    13px 0 25px;

  font-size: 22px;

  line-height: 1.45;

}


.tip-item {

  display: flex;

  gap: 12px;

  padding:

    16px 0;

  border-top:

    1px solid

    #edf0f5;

}


.tip-item b {

  display: grid;

  width: 25px;

  height: 25px;

  flex-shrink: 0;

  place-items: center;

  border-radius: 8px;

  background: #eef3ff;

  color: #2457e6;

  font-size: 11px;

}


.tip-item p {

  margin: 2px 0 0;

  color: #6f7b90;

  font-size: 12px;

  line-height: 1.7;

}


.current-engine {

  display: flex;

  flex-direction: column;

  gap: 6px;

  margin-top: 22px;

  padding: 17px;

  border-radius: 13px;

  background:

    linear-gradient(

      135deg,

      #f0f5ff,

      #f5f1ff

    );

}


.current-engine span {

  color: #7a8599;

  font-size: 10px;

}


.current-engine strong {

  font-size: 13px;

}


.current-engine small {

  color: #8b95a8;

  font-size: 10px;

}


.result-section {

  padding:

    82px 0 100px;

  border-top:

    1px solid

    #e7ebf3;

  background: white;

  scroll-margin-top:
    75px;

}


.result-heading {

  margin-bottom: 28px;

}


.result-heading p {

  margin:

    9px 0 0;

  color: #8993a5;

  font-size: 12px;

}


.overview-card {

  display: grid;

  align-items: center;

  grid-template-columns:

    190px

    minmax(
      0,
      1fr
    )

    260px;

  gap: 34px;

  padding:

    30px 34px;

  border:

    1px solid

    #e4e9f2;

  border-radius: 21px;

  background: #fbfcff;

}


.overview-card.critical {

  border-color:
    #ffd2d2;

  background:

    linear-gradient(

      135deg,

      #fff8f8,

      #fffafa

    );

}


.overview-card.high {

  border-color:
    #ffe0b0;

  background:

    linear-gradient(

      135deg,

      #fffaf2,

      #fffdf8

    );

}


.overview-card.low {

  border-color:
    #cdeedc;

  background:

    linear-gradient(

      135deg,

      #f5fff9,

      #fbfffd

    );

}


.score-area {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding-right: 30px;

  border-right:

    1px solid

    #e5eaf2;

}


.score-area span {

  color: #7f899c;

  font-size: 11px;

}


.score-area strong {

  margin:

    3px 0;

  font-size: 55px;

  line-height: 1;

}


.score-area small {

  color: #9aa3b4;

  font-size: 10px;

}


.level-area h3 {

  margin:

    13px 0 8px;

  font-size: 20px;

}


.level-area p {

  margin: 0;

  color: #748096;

  font-size: 12px;

  line-height: 1.7;

}


.level-badge,

.severity-badge {

  display: inline-flex;

  padding:

    7px 10px;

  border-radius: 99px;

  font-size: 10px;

  font-weight: 900;

}


.level-badge.critical,

.severity-badge.critical {

  background: #ffe8e8;

  color: #d93636;

}


.level-badge.high,

.severity-badge.high {

  background: #fff0d9;

  color: #c86d00;

}


.level-badge.medium,

.severity-badge.medium,

.level-badge.insufficient {

  background: #fff6d8;

  color: #9a7400;

}


.level-badge.low,

.severity-badge.low {

  background: #e5f8ee;

  color: #168554;

}


.overview-data {

  display: grid;

  gap: 10px;

}


.overview-data div {

  display: flex;

  justify-content:
    space-between;

  gap: 20px;

  padding:

    10px 12px;

  border-radius: 9px;

  background:

    rgba(

      255,

      255,

      255,

      0.72

    );

}


.overview-data span {

  color: #8993a5;

  font-size: 10px;

}


.overview-data strong {

  font-size: 11px;

}


.confidence-note {

  margin-top: 15px;

  padding:

    15px 18px;

  border:

    1px solid

    #e4eaf4;

  border-radius: 12px;

  background: #f8faff;

}


.confidence-note strong {

  font-size: 12px;

}


.confidence-note p {

  margin:

    6px 0 0;

  color: #7e899c;

  font-size: 11px;

  line-height: 1.7;

}


.empty-result {

  margin-top: 26px;

  padding:

    55px 30px;

  border:

    1px solid

    #d7eddf;

  border-radius: 20px;

  background: #f7fff9;

  text-align: center;

}


.empty-result > div {

  display: grid;

  width: 54px;

  height: 54px;

  place-items: center;

  margin: 0 auto;

  border-radius: 50%;

  background: #def6e9;

  color: #168554;

  font-size: 24px;

  font-weight: 900;

}


.empty-result h3 {

  margin:

    20px 0 10px;

}


.empty-result p {

  max-width: 650px;

  margin:

    0 auto;

  color: #748096;

  font-size: 13px;

  line-height: 1.8;

}


.finding-list {

  display: grid;

  gap: 22px;

  margin-top: 28px;

}


.finding-card {

  padding: 29px;

  border:

    1px solid

    #e4e9f2;

  border-radius: 20px;

  background: #fff;

  box-shadow:

    0 14px 40px

    rgba(

      31,

      49,

      95,

      0.05

    );

}


.finding-header {

  display: flex;

  align-items:
    flex-start;

  justify-content:
    space-between;

  gap: 20px;

}


.finding-header > div > span {

  color: #8c96a8;

  font-size: 10px;

  font-weight: 800;

  letter-spacing:
    0.1em;

}


.finding-header h3 {

  margin:

    7px 0 0;

  font-size: 21px;

}


.finding-meta {

  display: flex;

  flex-wrap: wrap;

  gap: 10px;

  margin-top: 21px;

}


.finding-meta span {

  padding:

    8px 10px;

  border-radius: 8px;

  background: #f5f7fb;

  color: #7e899d;

  font-size: 10px;

}


.finding-meta strong {

  color: #3c485f;

}


.evidence-box {

  margin-top: 22px;

  padding:

    21px;

  border-left:

    4px solid

    #ef4444;

  border-radius:

    0 13px 13px 0;

  background: #fff7f7;

}


.evidence-box > span,

.analysis-grid section > span,

.source-content > span {

  color: #8b95a7;

  font-size: 10px;

  font-weight: 900;

  letter-spacing:
    0.08em;

}


.evidence-box blockquote {

  margin:

    11px 0;

  color: #38445a;

  font-size: 15px;

  font-weight: 700;

  line-height: 1.8;

}


.evidence-box small {

  color: #a06d6d;

  font-size: 10px;

}


.analysis-grid {

  display: grid;

  grid-template-columns:

    repeat(
      2,
      1fr
    );

  gap: 15px;

  margin-top: 17px;

}


.analysis-grid section {

  padding: 20px;

  border:

    1px solid

    #e8ecf3;

  border-radius: 13px;

  background: #fbfcff;

}


.analysis-grid p {

  margin:

    10px 0 0;

  color: #68758b;

  font-size: 12px;

  line-height: 1.8;

}


.source-box {

  display: flex;

  align-items: center;

  gap: 15px;

  margin-top: 17px;

  padding:

    18px;

  border:

    1px solid

    #dbe5fb;

  border-radius: 14px;

  background: #f5f8ff;

}


.source-icon {

  display: grid;

  width: 42px;

  height: 42px;

  flex-shrink: 0;

  place-items: center;

  border-radius: 12px;

  background: #2457e6;

  color: white;

  font-weight: 900;

}


.source-content {

  display: flex;

  min-width: 0;

  flex: 1;

  flex-direction: column;

  gap: 5px;

}


.source-content strong {

  font-size: 13px;

}


.source-content p {

  margin: 0;

  color: #7f899c;

  font-size: 10px;

}


.source-box > a {

  flex-shrink: 0;

  padding:

    9px 12px;

  border-radius: 9px;

  background: #2457e6;

  color: white;

  font-size: 11px;

  font-weight: 800;

}


.result-disclaimer {

  margin-top: 27px;

  padding:

    20px;

  border:

    1px solid

    #e6eaf2;

  border-radius: 13px;

  background: #f8f9fc;

}


.result-disclaimer strong {

  font-size: 12px;

}


.result-disclaimer p {

  margin:

    7px 0 0;

  color: #7c879a;

  font-size: 11px;

  line-height: 1.8;

}


.footer {

  padding:

    37px 0;

  background: #111b35;

  color: white;

}


.footer-content {

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 40px;

}


.footer strong {

  font-size: 18px;

}


.footer p {

  margin:

    7px 0 0;

  color: #aeb8cf;

  font-size: 11px;

}


.footer-content > p {

  max-width: 430px;

  text-align: right;

}


@media (
  max-width: 1000px
) {

  .hero-content {

    grid-template-columns:

      1fr;

  }


  .review-layout {

    grid-template-columns:

      1fr;

  }


  .tips-card {

    position: static;

  }


  .overview-card {

    grid-template-columns:

      150px

      1fr;

  }


  .overview-data {

    grid-column:

      1 / -1;

    grid-template-columns:

      repeat(
        3,
        1fr
      );

  }

}


@media (
  max-width: 720px
) {

  .navigation {

    display: none;

  }


  .brand-text small {

    display: none;

  }


  .page-hero {

    padding:

      55px 0;

  }


  .form-card {

    padding: 22px;

  }


  .form-grid,

  .analysis-grid {

    grid-template-columns:

      1fr;

  }


  .overview-card {

    grid-template-columns:

      1fr;

  }


  .score-area {

    padding:

      0 0 25px;

    border-right: 0;

    border-bottom:

      1px solid

      #e5eaf2;

  }


  .overview-data {

    grid-template-columns:

      1fr;

  }


  .finding-header {

    flex-direction:
      column;

  }


  .source-box {

    align-items:
      flex-start;

    flex-direction:
      column;

  }


  .footer-content {

    align-items:
      flex-start;

    flex-direction:
      column;

  }


  .footer-content > p {

    text-align: left;

  }

}

</style>
