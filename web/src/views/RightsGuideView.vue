<script setup>
import {
  onMounted,
  ref
} from "vue";

import {
  getRightsGuides
} from "../api/rightsGuide.js";


const loading =
  ref(true);

const errorMessage =
  ref("");

const rightsGuides =
  ref([]);

const total =
  ref(0);


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


function formatDateTime(
  dateValue
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

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false
      }
    );
}


async function loadRightsGuides() {
  loading.value =
    true;

  errorMessage.value =
    "";

  try {
    const response =
      await getRightsGuides();

    total.value =
      response.data
        .data
        .total;

    rightsGuides.value =
      response.data
        .data
        .items;
  } catch (error) {
    errorMessage.value =
      error.response
        ?.data
        ?.message
      ||
      error.message
      ||
      "维权指引读取失败，请稍后重试。";
  } finally {
    loading.value =
      false;
  }
}


onMounted(
  () => {
    loadRightsGuides();
  }
);
</script>


<template>

  <div class="rights-page">

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

        <div class="page-container hero-layout">

          <div class="hero-copy">

            <div class="hero-tag">

              RIGHTS PROTECTION GUIDE

            </div>


            <h1>

              维权流程指引

              <span>

                先整理证据，再选择合适渠道

              </span>

            </h1>


            <p>

              当前内容来自 MySQL，只展示 reviewed 且 enabled 的指引。
              本页面提供证据整理与渠道选择参考，不替代律师正式法律意见。

            </p>

          </div>


          <div class="data-card">

            <div class="data-card-header">

              <span>

                DATABASE

              </span>


              <b>

                MySQL 实时读取

              </b>

            </div>


            <strong class="guide-count">

              {{
                total
              }}

            </strong>


            <p>

              条已审核并启用的维权指引

            </p>


            <small>

              页面不会写死数据数量，列表来自 GET /api/rights-guides。

            </small>

          </div>

        </div>

      </section>


      <section class="guide-section">

        <div class="page-container">

          <div class="section-heading">

            <div>

              <span>

                REVIEWED GUIDES

              </span>


              <h2>

                可用流程指引

              </h2>


              <p>

                当前共读取

                <strong>

                  {{
                    total
                  }}

                </strong>

                条数据库记录。

              </p>

            </div>


            <button
              class="refresh-button"
              :disabled="loading"
              type="button"
              @click="loadRightsGuides"
            >

              {{
                loading
                  ?
                  "正在读取..."
                  :
                  "重新加载"
              }}

            </button>

          </div>


          <div
            v-if="loading"
            class="state-card"
          >

            <div class="loading-icon"></div>


            <h3>

              正在读取维权指引

            </h3>


            <p>

              正在通过 Express 查询 MySQL 数据库...

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

              维权指引读取失败

            </h3>


            <p>

              {{
                errorMessage
              }}

            </p>


            <button
              type="button"
              @click="loadRightsGuides"
            >

              重新加载

            </button>

          </div>


          <div
            v-else-if="
              rightsGuides.length
              ===
              0
            "
            class="state-card"
          >

            <div class="state-symbol">

              0

            </div>


            <h3>

              暂无可展示的维权指引

            </h3>


            <p>

              当前没有 reviewed 且 enabled 的数据库记录。

            </p>


            <button
              type="button"
              @click="loadRightsGuides"
            >

              重新加载

            </button>

          </div>


          <div
            v-else
            class="guide-grid"
          >

            <article
              v-for="
                guide
                in
                rightsGuides
              "
              :key="
                guide.guideCode
              "
              class="guide-card"
            >

              <div class="guide-card-header">

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


                <span class="review-badge">

                  {{
                    guide.reviewStatus
                  }}

                </span>

              </div>


              <h3>

                {{
                  guide.title
                }}

              </h3>


              <div class="guide-meta">

                <span>

                  问题类型

                </span>


                <strong>

                  {{
                    guide.problemType
                  }}

                </strong>

              </div>


              <p class="guide-summary">

                {{
                  guide.summary
                }}

              </p>


              <section class="first-action">

                <span>

                  第一时间怎么做

                </span>


                <p>

                  {{
                    guide.firstAction
                  }}

                </p>

              </section>


              <div class="guide-footer">

                <span>

                  依据复核：

                  {{
                    formatDateTime(
                      guide.sourceReviewedAt
                    )
                  }}

                </span>


                <RouterLink
                  :to="
                    `/rights-guides/${guide.guideCode}`
                  "
                >

                  查看完整流程

                  <b>

                    →

                  </b>

                </RouterLink>

              </div>

            </article>

          </div>

        </div>

      </section>

    </main>

  </div>

</template>


<style scoped>

.rights-page {
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

.page-hero {
  padding: 80px 0 86px;
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
  grid-template-columns: 1.1fr 0.9fr;
  gap: 85px;
}

.hero-tag {
  display: inline-flex;
  padding: 8px 13px;
  border: 1px solid rgba(36, 87, 230, 0.14);
  border-radius: 99px;
  background: white;
  color: #2457e6;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.hero-copy h1 {
  margin: 24px 0;
  font-size: clamp(42px, 5.4vw, 68px);
  line-height: 1.13;
}

.hero-copy h1 span {
  display: block;
  margin-top: 7px;
  background: linear-gradient(100deg, #2457e6, #7357f6);
  background-clip: text;
  color: transparent;
}

.hero-copy p {
  max-width: 680px;
  color: #69758b;
  font-size: 17px;
  line-height: 1.9;
}

.data-card {
  padding: 31px;
  border: 1px solid rgba(255, 255, 255, 0.94);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.93);
  box-shadow: 0 28px 70px rgba(49, 66, 118, 0.13);
}

.data-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.data-card-header span {
  color: #8691a5;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.13em;
}

.data-card-header b {
  padding: 7px 10px;
  border-radius: 99px;
  background: #e6f8ee;
  color: #168554;
  font-size: 10px;
}

.guide-count {
  display: block;
  margin-top: 25px;
  color: #2457e6;
  font-size: 75px;
  line-height: 1;
}

.data-card p {
  margin: 8px 0 18px;
  color: #536076;
  font-size: 15px;
  font-weight: 700;
}

.data-card small {
  color: #8b95a7;
  font-size: 11px;
  line-height: 1.7;
}

.guide-section {
  padding: 84px 0 100px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 30px;
}

.section-heading span {
  color: #2457e6;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.13em;
}

.section-heading h2 {
  margin: 9px 0;
  font-size: 34px;
}

.section-heading p {
  margin: 0;
  color: #7b8699;
  font-size: 13px;
}

.section-heading strong {
  color: #2457e6;
}

.refresh-button,
.state-card button {
  padding: 11px 15px;
  border: 0;
  border-radius: 10px;
  background: #2457e6;
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.state-card {
  margin-top: 30px;
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

.state-card button {
  margin-top: 18px;
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

.guide-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.guide-card {
  display: flex;
  min-height: 390px;
  flex-direction: column;
  padding: 28px;
  border: 1px solid #e2e7f0;
  border-radius: 20px;
  background: white;
  box-shadow: 0 14px 40px rgba(31, 49, 95, 0.05);
}

.guide-card-header,
.guide-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.risk-badge,
.review-badge {
  display: inline-flex;
  padding: 7px 10px;
  border-radius: 99px;
  font-size: 10px;
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

.review-badge {
  background: #e6f8ee;
  color: #168554;
}

.guide-card h3 {
  margin: 22px 0 15px;
  font-size: 23px;
  line-height: 1.45;
}

.guide-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 11px;
  background: #f7f9fc;
}

.guide-meta span,
.first-action span {
  color: #8a94a7;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.guide-meta strong {
  color: #465269;
  font-size: 12px;
}

.guide-summary {
  color: #647188;
  font-size: 13px;
  line-height: 1.8;
}

.first-action {
  margin-top: auto;
  padding: 18px;
  border-left: 4px solid #2457e6;
  border-radius: 0 12px 12px 0;
  background: #f5f8ff;
}

.first-action p {
  margin: 9px 0 0;
  color: #3e4a61;
  font-size: 13px;
  line-height: 1.8;
}

.guide-footer {
  margin-top: 20px;
  color: #929cad;
  font-size: 10px;
}

.guide-footer a {
  flex-shrink: 0;
  color: #2457e6;
  font-size: 12px;
  font-weight: 900;
}

.guide-footer b {
  margin-left: 4px;
}

@media (max-width: 1000px) {
  .hero-layout,
  .guide-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .navigation {
    display: none;
  }

  .brand-text small {
    display: none;
  }

  .page-hero {
    padding: 55px 0;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .guide-card {
    padding: 22px;
  }

  .guide-card-header,
  .guide-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

</style>
