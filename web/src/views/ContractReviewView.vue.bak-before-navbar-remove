<script setup>
import {
  computed,
  reactive,
  ref
} from "vue";

import {
  createContractReview
} from "../api/contractReview.js";


const form =
  reactive({
    contractTitle:
      "",

    contractText:
      ""
  });

const loading =
  ref(false);

const errorMessage =
  ref("");

const reviewResult =
  ref(null);


const levelInformation = {
  critical: {
    text: "高度关注",
    className: "critical"
  },

  high: {
    text: "较高风险",
    className: "high"
  },

  medium: {
    text: "一般关注",
    className: "medium"
  },

  low: {
    text: "低风险",
    className: "low"
  }
};


const canSubmit =
  computed(
    () => {
      return (
        form.contractText
          .trim()
          .length
        >=
        20
        &&
        form.contractText
          .trim()
          .length
        <=
        50000
        &&
        !loading.value
      );
    }
  );


function getLevelInformation(
  level
) {
  return (
    levelInformation[
      level
    ]
    ||
    levelInformation.low
  );
}


function fillHighRiskExample() {
  form.contractTitle =
    "测试示例：高风险实习协议";

  form.contractText =
    "实习生入职前须缴纳500元岗位保证金。\n"
    +
    "公司统一保管身份证原件。\n"
    +
    "参加培训后需办理培训分期贷款。\n"
    +
    "缴费后保证安排岗位。";

  reviewResult.value =
    null;

  errorMessage.value =
    "";
}


function fillSafeExample() {
  form.contractTitle =
    "测试示例：安全表达协议";

  form.contractText =
    "公司不收取任何押金或保证金。\n"
    +
    "仅核验身份证，不扣押证件原件。\n"
    +
    "岗前培训完全免费。\n"
    +
    "无需办理培训贷款。";

  reviewResult.value =
    null;

  errorMessage.value =
    "";
}


function clearForm() {
  form.contractTitle =
    "";

  form.contractText =
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
      await createContractReview({
        contractTitle:
          form.contractTitle
            .trim(),

        contractText:
          form.contractText
            .trim()
      });

    reviewResult.value =
      response.data
        .data;

    window.setTimeout(
      () => {
        document
          .getElementById(
            "contract-result"
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
  } catch (error) {
    errorMessage.value =
      error.response
        ?.data
        ?.message
      ||
      error.message
      ||
      "合同审核失败，请稍后重试。";
  } finally {
    loading.value =
      false;
  }
}
</script>


<template>

  <div class="contract-page">

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


          <RouterLink to="/contract-review">

            合同审核

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

        <div class="page-container hero-layout">

          <div class="hero-copy">

            <div class="hero-tag">

              CONTRACT REVIEW MVP

            </div>


            <h1>

              合同智能审核

              <span>

                先识别高风险线索

              </span>

            </h1>


            <p>

              本功能提供合同风险辅助识别，不直接认定条款违法或无效，
              不替代律师、仲裁机构或人民法院的正式判断。

            </p>


            <div class="hero-principles">

              <span>

                使用已审核官方依据

              </span>


              <span>

                不伪造法律来源

              </span>


              <span>

                置信提示不等于真实准确率

              </span>

            </div>

          </div>


          <div class="scope-card">

            <span>

              当前 MVP 支持

            </span>


            <strong>

              粘贴合同文本

            </strong>


            <p>

              暂不支持 PDF、Word 或图片上传。规则只覆盖已有 legal_sources 能支持的高置信风险。

            </p>

          </div>

        </div>

      </section>


      <section class="review-section">

        <div class="page-container review-layout">

          <section class="form-card">

            <div class="card-heading">

              <div>

                <span>

                  STEP 01

                </span>


                <h2>

                  粘贴合同文本

                </h2>

              </div>


              <button
                class="clear-button"
                type="button"
                @click="clearForm"
              >

                清空

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

                填入安全测试示例

              </button>

            </div>


            <p class="example-note">

              测试示例，不是真实合同数据。

            </p>


            <label class="title-input">

              <span>

                合同名称

              </span>


              <input
                v-model="form.contractTitle"
                maxlength="300"
                placeholder="例如：实习协议"
                type="text"
              >

            </label>


            <label class="contract-input">

              <span>

                合同文本

              </span>


              <textarea
                v-model="form.contractText"
                maxlength="50000"
                placeholder="请粘贴完整合同文本。本阶段暂不支持 PDF、Word 或图片上传。"
              ></textarea>

            </label>


            <div class="input-footer">

              <div>

                <span>

                  {{
                    form.contractText.length
                  }}

                </span>

                / 50000 字符

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

                审核失败

              </strong>


              <span>

                {{
                  errorMessage
                }}

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
                class="button-loading"
              ></span>


              <span>

                {{
                  loading
                    ?
                    "正在审核合同..."
                    :
                    "开始审核合同"
                }}

              </span>

            </button>

          </section>


          <aside class="notice-card">

            <span>

              重要说明

            </span>


            <p>

              本功能提供合同风险辅助识别，不直接认定条款违法或无效。

            </p>


            <p>

              当前匹配置信提示不等于真实准确率，不替代律师、仲裁机构或人民法院的正式判断。

            </p>

          </aside>

        </div>

      </section>


      <section
        v-if="reviewResult"
        id="contract-result"
        class="result-section"
      >

        <div class="page-container">

          <div class="result-heading">

            <span>

              STEP 02

            </span>


            <h2>

              审核结果

            </h2>


            <p>

              审核记录编号：

              {{
                reviewResult.reviewId
              }}

            </p>

          </div>


          <div
            class="overview-card"
            :class="
              getLevelInformation(
                reviewResult.overallLevel
              )
              .className
            "
          >

            <div class="score-area">

              <span>

                风险总分

              </span>


              <strong>

                {{
                  reviewResult.overallScore
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
                  getLevelInformation(
                    reviewResult.overallLevel
                  )
                  .className
                "
              >

                {{
                  getLevelInformation(
                    reviewResult.overallLevel
                  )
                  .text
                }}

              </span>


              <h3>

                {{
                  reviewResult.findingCount
                }}

                项风险线索

              </h3>


              <p>

                规则引擎版本：

                {{
                  reviewResult.engineVersion
                }}

              </p>

            </div>


            <div class="overview-data">

              <div>

                <span>

                  风险项数量

                </span>


                <strong>

                  {{
                    reviewResult.findingCount
                  }}

                </strong>

              </div>


              <div>

                <span>

                  匹配置信提示

                </span>


                <strong>

                  {{
                    Math.round(
                      reviewResult.confidence
                      *
                      100
                    )
                  }}%

                </strong>

              </div>


              <div>

                <span>

                  处理耗时

                </span>


                <strong>

                  {{
                    reviewResult.processingTimeMs
                  }}

                  ms

                </strong>

              </div>

            </div>

          </div>


          <section class="confidence-note">

            <strong>

              匹配置信提示

            </strong>


            <p>

              {{
                reviewResult.confidenceNote
              }}

            </p>

          </section>


          <div
            v-if="
              reviewResult.findingCount
              ===
              0
            "
            class="empty-result"
          >

            <div>

              0

            </div>


            <h3>

              暂未发现当前规则覆盖的高风险表达

            </h3>


            <p>

              这不代表合同绝对安全。仍建议核实实习主体、薪酬、工时、保险、违约责任和争议解决条款。

            </p>

          </div>


          <div
            v-else
            class="finding-list"
          >

            <article
              v-for="
                finding
                in
                reviewResult.findings
              "
              :key="
                finding.ruleCode
              "
              class="finding-card"
            >

              <div class="finding-header">

                <div>

                  <span>

                    {{
                      finding.riskCategory
                    }}

                  </span>


                  <h3>

                    {{
                      finding.ruleName
                    }}

                  </h3>

                </div>


                <span
                  class="level-badge"
                  :class="
                    getLevelInformation(
                      finding.riskLevel
                    )
                    .className
                  "
                >

                  {{
                    getLevelInformation(
                      finding.riskLevel
                    )
                    .text
                  }}

                  ·

                  {{
                    finding.riskScore
                  }}

                </span>

              </div>


              <section class="evidence-box">

                <span>

                  命中的合同原文

                </span>


                <blockquote>

                  {{
                    finding.matchedText
                  }}

                </blockquote>


                <small>

                  上下文证据：

                  {{
                    finding.evidenceText
                  }}

                </small>

              </section>


              <div class="analysis-grid">

                <section>

                  <span>

                    风险原因

                  </span>


                  <p>

                    {{
                      finding.reason
                    }}

                  </p>

                </section>


                <section>

                  <span>

                    处理建议

                  </span>


                  <p>

                    {{
                      finding.advice
                    }}

                  </p>

                </section>

              </div>


              <section class="scope-box">

                <span>

                  适用范围说明

                </span>


                <p>

                  {{
                    finding.applicabilityNote
                  }}

                </p>

              </section>


              <section class="source-box">

                <div>

                  <span>

                    官方依据

                  </span>


                  <strong>

                    {{
                      finding.legalSource.title
                    }}

                  </strong>


                  <p>

                    {{
                      finding.legalSource.issuingAuthority
                    }}

                    ·

                    {{
                      finding.legalSource.articleNumber
                      ||
                      "全文参考"
                    }}

                  </p>

                </div>


                <a
                  :href="
                    finding.legalSource.sourceUrl
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

              免责声明

            </strong>


            <p>

              本功能提供合同风险辅助识别，不直接认定条款违法或无效，不替代律师、仲裁机构或人民法院的正式判断。当前匹配置信提示不等于真实准确率。

            </p>

          </section>

        </div>

      </section>

    </main>

  </div>

</template>


<style scoped>

.contract-page {
  min-height: 100vh;
  background: #f5f7fb;
  color: #17233d;
}

.page-container,
.header-container {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.site-header {
  position: sticky;
  z-index: 30;
  top: 0;
  border-bottom: 1px solid rgba(226, 231, 241, 0.9);
  background: rgba(255, 255, 255, 0.93);
  backdrop-filter: blur(18px);
}

.header-container {
  display: flex;
  height: 74px;
  align-items: center;
  justify-content: space-between;
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
  background: linear-gradient(135deg, #2457e6, #7357f6);
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
  gap: 24px;
}

.navigation a {
  color: #667085;
  font-size: 14px;
}

.navigation a:hover,
.navigation a.router-link-active {
  color: #2457e6;
}

.navigation a.router-link-active {
  font-weight: 800;
}

.page-hero {
  padding: 78px 0 82px;
  background:
    radial-gradient(
      circle at 85% 15%,
      rgba(115, 87, 246, 0.18),
      transparent 31%
    ),
    linear-gradient(135deg, #f7faff, #faf8ff);
}

.hero-layout {
  display: grid;
  align-items: center;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 80px;
}

.hero-tag,
.card-heading span,
.result-heading > span,
.finding-header > div > span,
.analysis-grid span,
.scope-box span,
.source-box span {
  color: #2457e6;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.hero-copy h1 {
  margin: 24px 0;
  font-size: clamp(44px, 5.5vw, 69px);
  line-height: 1.13;
}

.hero-copy h1 span {
  display: block;
  margin-top: 6px;
  background: linear-gradient(100deg, #2457e6, #7357f6);
  background-clip: text;
  color: transparent;
}

.hero-copy > p {
  max-width: 680px;
  color: #69758b;
  font-size: 17px;
  line-height: 1.9;
}

.hero-principles {
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
  margin-top: 27px;
}

.hero-principles span {
  padding: 8px 12px;
  border-radius: 9px;
  background: white;
  color: #556176;
  font-size: 12px;
}

.scope-card {
  padding: 31px;
  border: 1px solid rgba(255, 255, 255, 0.94);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.93);
  box-shadow: 0 28px 70px rgba(49, 66, 118, 0.13);
}

.scope-card span {
  color: #8691a5;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.13em;
}

.scope-card strong {
  display: block;
  margin: 20px 0 10px;
  color: #2457e6;
  font-size: 38px;
}

.scope-card p {
  color: #69758b;
  line-height: 1.8;
}

.review-section {
  padding: 82px 0;
}

.review-layout {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 25px;
}

.form-card,
.notice-card {
  border: 1px solid #e4e9f2;
  border-radius: 22px;
  background: white;
  box-shadow: 0 15px 45px rgba(31, 49, 95, 0.06);
}

.form-card {
  padding: 32px;
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 30px;
}

.card-heading h2,
.result-heading h2 {
  margin: 8px 0 0;
  font-size: 29px;
}

.clear-button {
  border: 0;
  background: transparent;
  color: #7b8699;
}

.clear-button:hover {
  color: #2457e6;
}

.example-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 28px 0 10px;
}

.example-buttons button {
  padding: 9px 13px;
  border: 1px solid #dfe5f0;
  border-radius: 9px;
  background: #f9faff;
  color: #526078;
  font-size: 12px;
}

.example-buttons button:hover {
  border-color: #2457e6;
  color: #2457e6;
}

.example-note {
  margin: 0 0 22px;
  color: #9aa4b6;
  font-size: 11px;
}

.title-input,
.contract-input {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.title-input > span,
.contract-input > span {
  color: #3d485e;
  font-size: 13px;
  font-weight: 800;
}

input,
textarea {
  width: 100%;
  border: 1px solid #dfe5ef;
  border-radius: 12px;
  outline: none;
  background: #fbfcff;
  color: #1e2a42;
  font: inherit;
}

input {
  height: 48px;
  padding: 0 15px;
}

textarea {
  min-height: 330px;
  padding: 17px;
  resize: vertical;
  line-height: 1.8;
}

input:focus,
textarea:focus {
  border-color: #2457e6;
  background: white;
  box-shadow: 0 0 0 4px rgba(36, 87, 230, 0.08);
}

.contract-input {
  margin-top: 18px;
}

.input-footer {
  display: flex;
  justify-content: space-between;
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
  border: 1px solid #ffd7d7;
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
  background: linear-gradient(135deg, #2457e6, #665df0);
  color: white;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 14px 30px rgba(36, 87, 230, 0.2);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

.button-loading {
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

.notice-card {
  position: sticky;
  top: 98px;
  padding: 27px;
}

.notice-card span {
  color: #2457e6;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.notice-card p {
  color: #6f7b90;
  font-size: 13px;
  line-height: 1.8;
}

.result-section {
  padding: 82px 0 100px;
  border-top: 1px solid #e7ebf3;
  background: white;
  scroll-margin-top: 75px;
}

.result-heading {
  margin-bottom: 28px;
}

.result-heading p {
  margin: 9px 0 0;
  color: #8993a5;
  font-size: 12px;
}

.overview-card {
  display: grid;
  align-items: center;
  grid-template-columns: 190px minmax(0, 1fr) 260px;
  gap: 34px;
  padding: 30px 34px;
  border: 1px solid #e4e9f2;
  border-radius: 21px;
  background: #fbfcff;
}

.overview-card.critical {
  border-color: #ffd2d2;
  background: linear-gradient(135deg, #fff8f8, #fffafa);
}

.overview-card.high {
  border-color: #ffe0b0;
  background: linear-gradient(135deg, #fffaf2, #fffdf8);
}

.overview-card.low {
  border-color: #cdeedc;
  background: linear-gradient(135deg, #f5fff9, #fbfffd);
}

.score-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-right: 30px;
  border-right: 1px solid #e5eaf2;
}

.score-area span {
  color: #7f899c;
  font-size: 11px;
}

.score-area strong {
  margin: 3px 0;
  font-size: 55px;
  line-height: 1;
}

.score-area small {
  color: #9aa3b4;
  font-size: 10px;
}

.level-area h3 {
  margin: 13px 0 8px;
  font-size: 20px;
}

.level-area p {
  margin: 0;
  color: #748096;
  font-size: 12px;
  line-height: 1.7;
}

.level-badge {
  display: inline-flex;
  padding: 7px 10px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 900;
}

.level-badge.critical {
  background: #ffe8e8;
  color: #d93636;
}

.level-badge.high {
  background: #fff0d9;
  color: #c86d00;
}

.level-badge.medium {
  background: #fff6d8;
  color: #9a7400;
}

.level-badge.low {
  background: #e5f8ee;
  color: #168554;
}

.overview-data {
  display: grid;
  gap: 10px;
}

.overview-data div {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 10px 12px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.72);
}

.overview-data span {
  color: #8993a5;
  font-size: 10px;
}

.overview-data strong {
  font-size: 11px;
}

.confidence-note,
.result-disclaimer {
  margin-top: 16px;
  padding: 18px;
  border: 1px solid #e4eaf4;
  border-radius: 12px;
  background: #f8faff;
}

.confidence-note p,
.result-disclaimer p {
  margin: 7px 0 0;
  color: #7e899c;
  font-size: 12px;
  line-height: 1.8;
}

.empty-result {
  margin-top: 26px;
  padding: 55px 30px;
  border: 1px solid #d7eddf;
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

.empty-result p {
  max-width: 650px;
  margin: 0 auto;
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
  border: 1px solid #e4e9f2;
  border-radius: 20px;
  background: white;
  box-shadow: 0 14px 40px rgba(31, 49, 95, 0.05);
}

.finding-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.finding-header h3 {
  margin: 7px 0 0;
  font-size: 21px;
}

.evidence-box {
  margin-top: 22px;
  padding: 21px;
  border-left: 4px solid #ef4444;
  border-radius: 0 13px 13px 0;
  background: #fff7f7;
}

.evidence-box blockquote {
  margin: 11px 0;
  color: #38445a;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.8;
}

.evidence-box small {
  color: #a06d6d;
  font-size: 11px;
  line-height: 1.7;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 17px;
}

.analysis-grid section,
.scope-box,
.source-box {
  padding: 20px;
  border: 1px solid #e8ecf3;
  border-radius: 13px;
  background: #fbfcff;
}

.analysis-grid p,
.scope-box p {
  margin: 10px 0 0;
  color: #68758b;
  font-size: 12px;
  line-height: 1.8;
}

.scope-box,
.source-box {
  margin-top: 17px;
}

.source-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #f5f8ff;
}

.source-box strong {
  display: block;
  margin-top: 6px;
  font-size: 13px;
}

.source-box p {
  margin: 5px 0 0;
  color: #7f899c;
  font-size: 11px;
}

.source-box a {
  flex-shrink: 0;
  padding: 10px 13px;
  border-radius: 10px;
  background: #2457e6;
  color: white;
  font-size: 12px;
  font-weight: 900;
}

@media (max-width: 1000px) {
  .hero-layout,
  .review-layout {
    grid-template-columns: 1fr;
  }

  .notice-card {
    position: static;
  }

  .overview-card {
    grid-template-columns: 150px 1fr;
  }

  .overview-data {
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 720px) {
  .navigation {
    display: none;
  }

  .brand-text small {
    display: none;
  }

  .form-card {
    padding: 22px;
  }

  .overview-card,
  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .score-area {
    padding: 0 0 25px;
    border-right: 0;
    border-bottom: 1px solid #e5eaf2;
  }

  .overview-data {
    grid-template-columns: 1fr;
  }

  .finding-header,
  .source-box {
    align-items: flex-start;
    flex-direction: column;
  }
}

</style>
