<script setup>
import {
  computed,
  onMounted,
  ref
} from "vue";

import {
  getLegalSources
} from "../api/legalSource.js";


const loading = ref(true);

const errorMessage = ref("");

const legalSources = ref([]);

const selectedType = ref("all");


const sourceTypeInformation = {

  law: {
    text: "法律",
    className: "law"
  },

  regulation: {
    text: "部门规定",
    className: "regulation"
  },

  official_guidance: {
    text: "官方风险提示",
    className: "guidance"
  }

};


const sourceTypes = computed(() => {

  const availableTypes =
    legalSources.value
      .map(
        (
          item
        ) => {

          return item.sourceType;

        }
      );


  return [

    {
      value: "all",
      text: "全部依据"
    },

    ...

    Array.from(
      new Set(
        availableTypes
      )
    )
    .map(
      (
        type
      ) => {

        return {

          value:
            type,

          text:
            getSourceTypeInformation(
              type
            )
            .text

        };

      }
    )

  ];

});


const filteredLegalSources = computed(() => {

  if (
    selectedType.value
    ===
    "all"
  ) {

    return legalSources.value;

  }


  return legalSources.value
    .filter(
      (
        item
      ) => {

        return (

          item.sourceType
          ===
          selectedType.value

        );

      }
    );

});


function getSourceTypeInformation(
  sourceType
) {

  return (

    sourceTypeInformation[
      sourceType
    ]

    ||

    {
      text:
        "官方文件",

      className:
        "default"
    }

  );

}


function formatDate(
  dateValue
) {

  if (
    !dateValue
  ) {

    return "未提供";

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

    return "未提供";

  }


  return date
    .toLocaleDateString(

      "zh-CN",

      {

        timeZone:
          "Asia/Shanghai",

        year:
          "numeric",

        month:
          "long",

        day:
          "numeric"

      }

    );

}


function formatDateTime(
  dateValue
) {

  if (
    !dateValue
  ) {

    return "未记录";

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

    return "未记录";

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
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false

      }

    );

}


async function loadLegalSources() {

  loading.value =
    true;


  errorMessage.value =
    "";


  try {

    const response =
      await getLegalSources();


    legalSources.value =
      response.data
        .data
        .items;

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

      "官方依据读取失败，请稍后重试。";

  } finally {

    loading.value =
      false;

  }

}


onMounted(
  () => {

    loadLegalSources();

  }
);
</script>


<template>

  <div class="knowledge-page">


    <main>

      <section class="page-hero">

        <div class="page-container hero-layout">

          <div class="hero-copy">

            <div class="hero-tag">

              VERIFIED LEGAL SOURCES

            </div>


            <h1>

              权益知识库

              <span>

                每一条依据都可追溯

              </span>

            </h1>


            <p>

              展示平台已经录入并核验的
              法律、部门规定和官方风险提示。

              每条内容均保留发布机构、
              官方原文链接、发布时间、
              数据采集时间及适用范围说明。

            </p>


          </div>


          <div class="data-card">

            <div class="data-card-header">

              <span>

                DATABASE STATUS

              </span>


              <b>

                实时读取

              </b>

            </div>


            <strong class="source-count">

              {{
                legalSources.length
              }}

            </strong>


            <p>

              条当前有效的官方依据

            </p>



            <small>

              页面内容不使用虚构法规，
              当前数据由后端接口实时返回。

            </small>

          </div>

        </div>

      </section>


      <section class="knowledge-section">

        <div class="page-container">

          <div class="section-heading">

            <div>

              <span>

                VERIFIED SOURCES

              </span>


              <h2>

                已核验官方依据

              </h2>


            </div>


            <button
              class="refresh-button"
              :disabled="loading"
              type="button"
              @click="loadLegalSources"
            >

              {{
                loading
                  ?
                  "正在读取……"
                  :
                  "重新读取数据库"
              }}

            </button>

          </div>


          <div
            v-if="
              !loading
              &&
              !errorMessage
            "
            class="filter-bar"
          >

            <button

              v-for="
                sourceType
                in
                sourceTypes
              "

              :key="
                sourceType.value
              "

              :class="{
                active:
                  selectedType
                  ===
                  sourceType.value
              }"

              type="button"

              @click="
                selectedType
                =
                sourceType.value
              "

            >

              {{
                sourceType.text
              }}

            </button>

          </div>


          <div
            v-if="loading"
            class="state-card"
          >

            <div class="loading-icon">

            </div>


            <h3>

              正在读取官方依据

            </h3>


            <p>

              正在通过 Express
              查询 MySQL 数据库……

            </p>

          </div>


          <div
            v-else-if="
              errorMessage
            "
            class="state-card error"
          >

            <div class="state-symbol">

              !

            </div>


            <h3>

              官方依据读取失败

            </h3>


            <p>

              {{
                errorMessage
              }}

            </p>


            <button
              type="button"
              @click="
                loadLegalSources
              "
            >

              重新读取

            </button>

          </div>


          <div
            v-else-if="
              filteredLegalSources
                .length
              ===
              0
            "
            class="state-card"
          >

            <div class="state-symbol">

              0

            </div>


            <h3>

              当前分类暂无数据

            </h3>


            <p>

              请切换其他依据分类。

            </p>

          </div>


          <div
            v-else
            class="source-list"
          >

            <article

              v-for="
                (
                  source,
                  index
                )
                in
                filteredLegalSources
              "

              :key="
                source.id
              "

              class="source-card"

            >

              <div class="source-number">

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

              </div>


              <div class="source-main">

                <div class="source-title-row">

                  <div>

                    <span

                      class="type-badge"

                      :class="
                        getSourceTypeInformation(
                          source.sourceType
                        )
                        .className
                      "

                    >

                      {{
                        getSourceTypeInformation(
                          source.sourceType
                        )
                        .text
                      }}

                    </span>


                    <span

                      v-if="
                        source.sourceStatus
                        ===
                        'current'
                      "

                      class="status-badge"

                    >

                      当前有效

                    </span>

                  </div>


                  <a

                    :href="
                      source.sourceUrl
                    "

                    rel="
                      noopener
                      noreferrer
                    "

                    target="_blank"

                  >

                    查看官方原文

                    <b>

                      ↗

                    </b>

                  </a>

                </div>


                <h3>

                  {{
                    source.title
                  }}

                </h3>


                <div class="source-information">

                  <div>

                    <span>

                      发布机构

                    </span>


                    <strong>

                      {{
                        source
                          .issuingAuthority
                      }}

                    </strong>

                  </div>


                  <div>

                    <span>

                      发布时间

                    </span>


                    <strong>

                      {{
                        formatDate(
                          source
                            .publishedDate
                        )
                      }}

                    </strong>

                  </div>


                  <div>

                    <span>

                      文件文号

                    </span>


                    <strong>

                      {{
                        source
                          .documentNumber
                        ||
                        "未单独记录"
                      }}

                    </strong>

                  </div>


                  <div>

                    <span>

                      对应条款

                    </span>


                    <strong>

                      {{
                        source
                          .articleNumber
                        ||
                        "全文参考"
                      }}

                    </strong>

                  </div>

                </div>


                <section class="scope-box">

                  <span>

                    平台适用说明

                  </span>


                  <p>

                    {{
                      source.citationText
                    }}

                  </p>

                </section>


                <div class="source-footer">

                  <span>

                    数据库记录编号：

                    {{
                      source.id
                    }}

                  </span>


                  <span>

                    数据采集时间：

                    {{
                      formatDateTime(
                        source
                          .retrievedAt
                      )
                    }}

                  </span>

                </div>

              </div>

            </article>

          </div>


          <section class="knowledge-notice">

            <div>

              说明

            </div>


            <p>

              本知识库用于提供法律信息、
              官方风险提示和适用范围参考。

              法律适用仍需结合实习类型、
              学校性质、实际用工方式及具体事实判断。

              平台不会仅凭一条规则直接替代专业法律意见。

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

          官方依据保留原始来源链接，
          页面展示内容来自平台数据库。

        </p>

      </div>

    </footer>

  </div>

</template>


<style scoped>

.knowledge-page {

  min-height: 100vh;

  background: #f5f7fb;

  color: #17233d;

}


.page-container,
.header-container {
  width: min(1440px, calc(100% - clamp(32px, 6vw, 96px)));
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

      0.93

    );

  backdrop-filter:

    blur(

      18px

    );

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


.navigation a:hover,

.navigation a.router-link-active {

  color: #2457e6;

}


.navigation a.router-link-active {

  font-weight: 800;

}


.page-hero {

  padding:

    80px 0 86px;

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


.hero-layout {
  display: grid;
  align-items: center;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  gap: clamp(40px, 6vw, 96px);
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

      69px

    );

  line-height: 1.13;

  letter-spacing:
    -0.05em;

}


.hero-copy h1 span {

  display: block;

  margin-top: 6px;

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

  max-width: 680px;

  color: #69758b;

  font-size: 17px;

  line-height: 1.9;

}


.data-card {

  padding: 31px;

  border:

    1px solid

    rgba(

      255,

      255,

      255,

      0.94

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


.data-card-header {

  display: flex;

  align-items: center;

  justify-content:
    space-between;

}


.data-card-header span {

  color: #8691a5;

  font-size: 10px;

  font-weight: 900;

  letter-spacing:
    0.13em;

}


.data-card-header b {

  padding:

    7px 10px;

  border-radius: 99px;

  background: #e6f8ee;

  color: #168554;

  font-size: 10px;

}


.source-count {

  display: block;

  margin-top: 25px;

  color: #2457e6;

  font-size: 75px;

  line-height: 1;

}


.data-card > p {

  margin:

    8px 0 24px;

  color: #536076;

  font-size: 15px;

  font-weight: 700;

}


.data-card > small {

  display: block;

  margin-top: 17px;

  color: #8b95a7;

  font-size: 10px;

  line-height: 1.7;

}


.knowledge-section {

  padding:

    84px 0 100px;

}


.section-heading {

  display: flex;

  align-items:
    flex-end;

  justify-content:
    space-between;

  gap: 30px;

}


.section-heading > div > span {

  color: #2457e6;

  font-size: 11px;

  font-weight: 900;

  letter-spacing:
    0.13em;

}


.section-heading h2 {

  margin:

    9px 0;

  font-size: 34px;

}


.refresh-button {

  padding:

    11px 15px;

  border:

    1px solid

    #dbe2ef;

  border-radius: 10px;

  background: white;

  color: #536077;

  cursor: pointer;

  font-size: 12px;

  font-weight: 700;

}


.refresh-button:hover {

  border-color:
    #2457e6;

  color: #2457e6;

}


.refresh-button:disabled {

  cursor:
    not-allowed;

  opacity: 0.6;

}


.filter-bar {

  display: flex;

  flex-wrap: wrap;

  gap: 10px;

  margin:

    31px 0 23px;

}


.filter-bar button {

  padding:

    9px 14px;

  border:

    1px solid

    #dfe5ef;

  border-radius: 99px;

  background: white;

  color: #667287;

  cursor: pointer;

  font-size: 11px;

  font-weight: 700;

}


.filter-bar button.active {

  border-color:
    #2457e6;

  background: #2457e6;

  color: white;

}


.state-card {

  margin-top: 30px;

  padding:

    70px 25px;

  border:

    1px solid

    #e1e7f0;

  border-radius: 20px;

  background: white;

  text-align: center;

}


.state-card h3 {

  margin:

    18px 0 8px;

}


.state-card p {

  margin: 0;

  color: #7a8699;

  font-size: 12px;

}


.state-card button {

  margin-top: 18px;

  padding:

    10px 15px;

  border: 0;

  border-radius: 9px;

  background: #2457e6;

  color: white;

  cursor: pointer;

}


.state-card.error {

  border-color:
    #ffdada;

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

  border:

    4px solid

    #e5eaf4;

  border-top-color:
    #2457e6;

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


.source-list {

  display: grid;

  gap: 21px;

}


.source-card {

  display: grid;

  grid-template-columns:

    70px

    minmax(
      0,
      1fr
    );

  overflow: hidden;

  border:

    1px solid

    #e2e7f0;

  border-radius: 20px;

  background: white;

  box-shadow:

    0 14px 40px

    rgba(

      31,

      49,

      95,

      0.05

    );

  transition:

    transform 0.22s,

    box-shadow 0.22s,

    border-color 0.22s;

}


.source-card:hover {

  transform:

    translateY(
      -3px
    );

  border-color:

    rgba(

      36,

      87,

      230,

      0.25

    );

  box-shadow:

    0 20px 48px

    rgba(

      31,

      49,

      95,

      0.09

    );

}


.source-number {

  display: flex;

  align-items:
    flex-start;

  justify-content:
    center;

  padding-top: 31px;

  background:

    linear-gradient(

      180deg,

      #edf3ff,

      #f5f2ff

    );

  color: #2457e6;

  font-size: 13px;

  font-weight: 900;

}


.source-main {

  min-width: 0;

  padding: 29px;

}


.source-title-row {

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 20px;

}


.source-title-row > div {

  display: flex;

  flex-wrap: wrap;

  gap: 8px;

}


.type-badge,

.status-badge {

  display: inline-flex;

  padding:

    6px 9px;

  border-radius: 99px;

  font-size: 9px;

  font-weight: 900;

}


.type-badge.law {

  background: #e9f0ff;

  color: #2457e6;

}


.type-badge.regulation {

  background: #f0ebff;

  color: #6a4bd8;

}


.type-badge.guidance {

  background: #fff0de;

  color: #bd6800;

}


.type-badge.default {

  background: #eef1f6;

  color: #677286;

}


.status-badge {

  background: #e6f8ee;

  color: #168554;

}


.source-title-row > a {

  flex-shrink: 0;

  color: #2457e6;

  font-size: 11px;

  font-weight: 800;

}


.source-title-row > a:hover {

  text-decoration:
    underline;

}


.source-title-row b {

  margin-left: 3px;

}


.source-main h3 {

  margin:

    18px 0 21px;

  font-size: 21px;

  line-height: 1.55;

}


.source-information {

  display: grid;

  grid-template-columns:

    repeat(

      4,

      1fr

    );

  gap: 11px;

}


.source-information div {

  display: flex;

  min-width: 0;

  flex-direction: column;

  gap: 6px;

  padding:

    13px;

  border-radius: 11px;

  background: #f7f9fc;

}


.source-information span {

  color: #8a94a7;

  font-size: 9px;

}


.source-information strong {

  overflow: hidden;

  color: #465269;

  font-size: 11px;

  line-height: 1.55;

  text-overflow:
    ellipsis;

}


.scope-box {

  margin-top: 18px;

  padding:

    18px;

  border-left:

    4px solid

    #2457e6;

  border-radius:

    0 12px 12px 0;

  background: #f5f8ff;

}


.scope-box span {

  color: #2457e6;

  font-size: 9px;

  font-weight: 900;

  letter-spacing:
    0.1em;

}


.scope-box p {

  margin:

    9px 0 0;

  color: #647188;

  font-size: 12px;

  line-height: 1.8;

}


.source-footer {

  display: flex;

  flex-wrap: wrap;

  justify-content:
    space-between;

  gap: 12px;

  margin-top: 17px;

  color: #929cad;

  font-size: 9px;

}


.knowledge-notice {

  display: flex;

  gap: 17px;

  margin-top: 28px;

  padding: 21px;

  border:

    1px solid

    #e0e6f0;

  border-radius: 14px;

  background: #f8faff;

}


.knowledge-notice div {

  display: grid;

  width: 39px;

  height: 39px;

  flex-shrink: 0;

  place-items: center;

  border-radius: 11px;

  background: #2457e6;

  color: white;

  font-size: 11px;

  font-weight: 900;

}


.knowledge-notice p {

  margin: 1px 0 0;

  color: #6f7b90;

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

  max-width: 440px;

  text-align: right;

}


/* circled-content responsive start */
.hero-copy,
.data-card,
.source-main {
  min-width: 0;
}
/* circled-content responsive end */

@media (
  max-width: 1000px
) {

  .hero-layout {

    grid-template-columns:

      1fr;

  }


  .source-information {

    grid-template-columns:

      repeat(

        2,

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


  .section-heading {

    align-items:
      flex-start;

    flex-direction:
      column;

  }


  .source-card {

    grid-template-columns:

      1fr;

  }


  .source-number {

    align-items: center;

    justify-content:
      flex-start;

    padding:

      12px 20px;

  }


  .source-main {

    padding: 22px;

  }


  .source-title-row {

    align-items:
      flex-start;

    flex-direction:
      column;

  }


  .source-information {

    grid-template-columns:

      1fr;

  }


  .source-footer {

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
