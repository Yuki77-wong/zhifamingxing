<script setup>
import {
  computed,
  onMounted,
  ref
} from "vue";

import {
  useRoute
} from "vue-router";

import {
  getRightsGuideByCode
} from "../api/rightsGuide.js";


const route =
  useRoute();

const loading =
  ref(true);

const errorMessage =
  ref("");

const notFound =
  ref(false);

const guide =
  ref(null);


const riskLevelInformation = {
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


const sortedActionSteps =
  computed(
    () => {
      return [
        ...(
          guide.value
            ?.actionSteps
          ||
          []
        )
      ]
        .sort(
          (
            left,
            right
          ) => {
            return (
              Number(
                left.stepNumber
                ||
                0
              )
              -
              Number(
                right.stepNumber
                ||
                0
              )
            );
          }
        );
    }
  );


function getRiskLevelInformation(
  riskLevel
) {
  return (
    riskLevelInformation[
      riskLevel
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


function formatDate(
  dateValue,
  includeTime = false
) {
  if (!dateValue) {
    return "暂未记录";
  }

  const date =
    new Date(
      dateValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "暂未记录";
  }

  return date
    .toLocaleString(
      "zh-CN",
      {
        timeZone:
          "Asia/Shanghai",

        year:
          "numeric",

        month:
          "long",

        day:
          "numeric",

        ...(
          includeTime
            ?
            {
              hour:
                "2-digit",

              minute:
                "2-digit",

              hour12:
                false
            }
            :
            {}
        )
      }
    );
}


function getEvidenceText(
  evidenceItem
) {
  if (
    typeof evidenceItem
    ===
    "string"
  ) {
    return evidenceItem;
  }

  return (
    evidenceItem
      ?.title
    ||
    evidenceItem
      ?.name
    ||
    evidenceItem
      ?.description
    ||
    "未命名证据"
  );
}


async function loadRightsGuide() {
  loading.value =
    true;

  errorMessage.value =
    "";

  notFound.value =
    false;

  try {
    const response =
      await getRightsGuideByCode(
        route.params.guideCode
      );

    guide.value =
      response.data
        .data;
  } catch (error) {
    if (
      error.response
        ?.status
      ===
      404
    ) {
      notFound.value =
        true;

      errorMessage.value =
        "未找到对应的维权指引";
    } else {
      errorMessage.value =
        error.response
          ?.data
          ?.message
        ||
        error.message
        ||
        "维权指引读取失败，请稍后重试。";
    }
  } finally {
    loading.value =
      false;
  }
}


onMounted(
  () => {
    loadRightsGuide();
  }
);
</script>


<template>

  <div class="detail-page">

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


    <main class="page-container">

      <RouterLink
        class="back-link"
        to="/rights-guides"
      >

        ← 返回维权指引列表

      </RouterLink>


      <div
        v-if="loading"
        class="state-card"
      >

        <div class="loading-icon"></div>


        <h3>

          正在读取完整流程

        </h3>


        <p>

          正在调用 GET /api/rights-guides/:guideCode。

        </p>

      </div>


      <div
        v-else-if="errorMessage"
        class="state-card error"
      >

        <div class="state-symbol">

          !

        </div>


        <h3>

          {{
            notFound
              ?
              "未找到对应的维权指引"
              :
              "维权指引读取失败"
          }}

        </h3>


        <p>

          {{
            errorMessage
          }}

        </p>


        <RouterLink
          v-if="notFound"
          class="state-link"
          to="/rights-guides"
        >

          返回维权指引列表

        </RouterLink>


        <button
          v-else
          type="button"
          @click="loadRightsGuide"
        >

          重新加载

        </button>

      </div>


      <article
        v-else-if="guide"
        class="guide-detail"
      >

        <section class="detail-hero">

          <div>

            <div class="hero-tag">

              RIGHTS GUIDE

            </div>


            <h1>

              {{
                guide.title
              }}

            </h1>


            <p>

              {{
                guide.summary
              }}

            </p>

          </div>


          <span
            class="risk-badge"
            :class="
              getRiskLevelInformation(
                guide.riskLevel
              )
              .className
            "
          >

            {{
              getRiskLevelInformation(
                guide.riskLevel
              )
              .text
            }}

          </span>

        </section>


        <section class="overview-grid">

          <div>

            <span>

              问题类型

            </span>


            <strong>

              {{
                guide.problemType
              }}

            </strong>

          </div>


          <div>

            <span>

              风险等级

            </span>


            <strong>

              {{
                getRiskLevelInformation(
                  guide.riskLevel
                )
                .text
              }}

            </strong>

          </div>


          <div>

            <span>

              审核状态

            </span>


            <strong>

              {{
                guide.reviewStatus
              }}

            </strong>

          </div>


          <div>

            <span>

              依据复核时间

            </span>


            <strong>

              {{
                formatDate(
                  guide.sourceReviewedAt,
                  true
                )
              }}

            </strong>

          </div>

        </section>


        <section class="content-section first-action">

          <span class="section-label">

            一、第一时间怎么做

          </span>


          <p>

            {{
              guide.firstAction
            }}

          </p>

        </section>


        <section class="content-section">

          <span class="section-label">

            二、建议保存的证据

          </span>


          <ul class="evidence-list">

            <li
              v-for="
                (
                  evidenceItem,
                  index
                )
                in
                guide.evidenceItems
              "
              :key="
                index
              "
            >

              <span></span>


              {{
                getEvidenceText(
                  evidenceItem
                )
              }}

            </li>

          </ul>

        </section>


        <section class="content-section">

          <span class="section-label">

            三、处理步骤

          </span>


          <div class="step-list">

            <article
              v-for="
                step
                in
                sortedActionSteps
              "
              :key="
                step.stepNumber
              "
              class="step-card"
            >

              <b>

                {{
                  String(
                    step.stepNumber
                  )
                  .padStart(
                    2,
                    "0"
                  )
                }}

              </b>


              <div>

                <h3>

                  {{
                    step.title
                  }}

                </h3>


                <p>

                  {{
                    step.description
                  }}

                </p>

              </div>

            </article>

          </div>

        </section>


        <section class="content-section">

          <span class="section-label">

            四、官方渠道

          </span>


          <div class="channel-grid">

            <article
              v-for="
                channel
                in
                guide.officialChannels
              "
              :key="
                channel.channelName
              "
              class="channel-card"
            >

              <div class="channel-header">

                <h3>

                  {{
                    channel.channelName
                  }}

                </h3>


                <span>

                  {{
                    channel.channelType
                  }}

                </span>

              </div>


              <div class="channel-meta">

                <span>

                  主管或运营机构

                </span>


                <strong>

                  {{
                    channel.authority
                  }}

                </strong>

              </div>


              <p>

                {{
                  channel.scope
                }}

              </p>


              <a
                :href="
                  channel.url
                "
                rel="noopener noreferrer"
                target="_blank"
              >

                访问官方渠道

                <b>

                  →

                </b>

              </a>

            </article>

          </div>

        </section>


        <section class="content-section note-section">

          <span class="section-label">

            五、适用范围说明

          </span>


          <p>

            {{
              guide.applicabilityNote
            }}

          </p>

        </section>


        <section class="content-section caution-section">

          <span class="section-label">

            六、重要提醒

          </span>


          <p>

            {{
              guide.cautionText
            }}

          </p>

        </section>


        <section class="content-section disclaimer-section">

          <span class="section-label">

            七、免责声明

          </span>


          <p>

            平台提供证据整理和渠道指引，不直接认定违法，不替代律师、仲裁机构、行政机关或人民法院的正式判断。

          </p>

        </section>


        <footer class="record-footer">

          <span>

            数据库记录编号：

            {{
              guide.id
            }}

          </span>


          <span>

            更新时间：

            {{
              formatDate(
                guide.updatedAt,
                true
              )
            }}

          </span>

        </footer>

      </article>

    </main>

  </div>

</template>


<style scoped>

.detail-page {
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
  gap: 26px;
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

.back-link {
  display: inline-flex;
  margin: 34px 0 18px;
  color: #2457e6;
  font-size: 13px;
  font-weight: 800;
}

.state-card {
  margin: 30px 0 90px;
  padding: 70px 25px;
  border: 1px solid #e1e7f0;
  border-radius: 20px;
  background: white;
  text-align: center;
}

.state-card h3 {
  margin: 18px 0 8px;
}

.state-card p {
  margin: 0 auto;
  max-width: 620px;
  color: #7a8699;
  font-size: 13px;
  line-height: 1.8;
}

.state-card button,
.state-link {
  display: inline-flex;
  margin-top: 18px;
  padding: 11px 15px;
  border: 0;
  border-radius: 10px;
  background: #2457e6;
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
}

.state-card.error {
  border-color: #ffdada;
  background: #fffafa;
}

.state-symbol {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  margin: 0 auto;
  border-radius: 50%;
  background: #fff0f0;
  color: #d83f3f;
  font-size: 20px;
  font-weight: 900;
}

.loading-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid #e5eaf4;
  border-top-color: #2457e6;
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

.guide-detail {
  padding-bottom: 96px;
}

.detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 40px;
  padding: 42px;
  border: 1px solid rgba(255, 255, 255, 0.94);
  border-radius: 24px;
  background:
    radial-gradient(
      circle at 85% 15%,
      rgba(115, 87, 246, 0.16),
      transparent 30%
    ),
    linear-gradient(135deg, #f7faff, #faf8ff);
  box-shadow: 0 20px 60px rgba(31, 49, 95, 0.08);
}

.hero-tag,
.section-label {
  color: #2457e6;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.13em;
}

.detail-hero h1 {
  margin: 18px 0;
  max-width: 760px;
  font-size: clamp(36px, 4.8vw, 58px);
  line-height: 1.2;
}

.detail-hero p {
  max-width: 800px;
  margin: 0;
  color: #667085;
  font-size: 16px;
  line-height: 1.9;
}

.risk-badge {
  display: inline-flex;
  flex-shrink: 0;
  padding: 9px 12px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 900;
}

.risk-badge.critical {
  background: #ffe8e8;
  color: #d93636;
}

.risk-badge.high {
  background: #fff0d9;
  color: #c86d00;
}

.risk-badge.medium {
  background: #fff6d8;
  color: #9a7400;
}

.risk-badge.low {
  background: #e5f8ee;
  color: #168554;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 22px 0;
}

.overview-grid div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  padding: 16px;
  border: 1px solid #e3e8f1;
  border-radius: 13px;
  background: white;
}

.overview-grid span {
  color: #8a94a7;
  font-size: 10px;
}

.overview-grid strong {
  overflow-wrap: anywhere;
  color: #3d485e;
  font-size: 13px;
  line-height: 1.5;
}

.content-section {
  margin-top: 20px;
  padding: 28px;
  border: 1px solid #e3e8f1;
  border-radius: 20px;
  background: white;
  box-shadow: 0 14px 40px rgba(31, 49, 95, 0.05);
}

.first-action {
  border-color: #dbe5fb;
  background: #f5f8ff;
}

.first-action p,
.note-section p,
.caution-section p,
.disclaimer-section p {
  margin: 13px 0 0;
  color: #3e4a61;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.9;
}

.evidence-list {
  display: grid;
  gap: 12px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.evidence-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 11px;
  background: #f7f9fc;
  color: #4a566e;
  font-size: 13px;
  line-height: 1.7;
}

.evidence-list span {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  margin-top: 3px;
  border: 2px solid #2457e6;
  border-radius: 5px;
}

.step-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.step-card {
  display: flex;
  gap: 16px;
  padding: 18px;
  border-radius: 14px;
  background: #f8faff;
}

.step-card b {
  display: grid;
  width: 43px;
  height: 43px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 13px;
  background: #2457e6;
  color: white;
  font-size: 12px;
}

.step-card h3 {
  margin: 0 0 7px;
  font-size: 17px;
}

.step-card p {
  margin: 0;
  color: #667287;
  font-size: 13px;
  line-height: 1.8;
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.channel-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border: 1px solid #dfe6f2;
  border-radius: 15px;
  background: #fbfcff;
}

.channel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.channel-header h3 {
  margin: 0;
  font-size: 17px;
  line-height: 1.5;
}

.channel-header span {
  flex-shrink: 0;
  padding: 6px 8px;
  border-radius: 99px;
  background: #edf3ff;
  color: #2457e6;
  font-size: 9px;
  font-weight: 900;
}

.channel-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 14px;
}

.channel-meta span {
  color: #8a94a7;
  font-size: 10px;
}

.channel-meta strong {
  color: #465269;
  font-size: 12px;
  line-height: 1.6;
}

.channel-card p {
  color: #667287;
  font-size: 12px;
  line-height: 1.8;
}

.channel-card a {
  align-self: flex-start;
  margin-top: auto;
  padding: 10px 13px;
  border-radius: 10px;
  background: #2457e6;
  color: white;
  font-size: 12px;
  font-weight: 900;
}

.caution-section {
  border-color: #ffe0b0;
  background: #fffaf2;
}

.disclaimer-section {
  background: #f8f9fc;
}

.record-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  color: #929cad;
  font-size: 11px;
}

@media (max-width: 1000px) {
  .overview-grid,
  .channel-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .navigation {
    display: none;
  }

  .brand-text small {
    display: none;
  }

  .detail-hero {
    flex-direction: column;
    padding: 28px;
  }

  .overview-grid,
  .channel-grid {
    grid-template-columns: 1fr;
  }

  .content-section {
    padding: 22px;
  }

  .channel-header {
    flex-direction: column;
  }
}

</style>
