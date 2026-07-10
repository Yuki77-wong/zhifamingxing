<script setup>
import { onMounted, ref } from "vue";

import {
  getDatabaseHealth,
  getSystemHealth
} from "../api/system.js";


const loading = ref(true);

const systemInformation = ref(null);

const databaseInformation = ref(null);

const errorMessage = ref("");


async function loadSystemStatus() {
  loading.value = true;

  errorMessage.value = "";

  try {
    const [
      systemResponse,
      databaseResponse
    ] = await Promise.all([
      getSystemHealth(),
      getDatabaseHealth()
    ]);

    systemInformation.value =
      systemResponse.data;

    databaseInformation.value =
      databaseResponse.data;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message
      ||
      error.message
      ||
      "暂时无法连接后端服务";
  } finally {
    loading.value = false;
  }
}


onMounted(() => {
  loadSystemStatus();
});
</script>


<template>

  <div class="home-page">

    <header class="site-header">

      <div class="container header-content">

        <div class="brand">

          <div class="brand-logo">

            智

          </div>


          <div class="brand-text">

            <strong>

              智法明行

            </strong>


            <span>

              大学生实习权益智能助手

            </span>

          </div>

        </div>


        <nav class="navigation">

          <a href="#home">

            首页

          </a>


          <a href="#features">

            岗位筛查

          </a>


          <a href="#features">

            公开岗位

          </a>


          <a href="#features">

            合同审核

          </a>


          <a href="#features">

            权益课堂

          </a>

        </nav>


        <a
          class="header-button"
          href="#features"
        >

          免费检测

        </a>

      </div>

    </header>


    <main>

      <section
        id="home"
        class="hero"
      >

        <div class="container hero-content">

          <div class="hero-copy">

            <div class="tag">

              大学生实习权益智能助手

            </div>


            <h1>

              实习之前，

              <span>

                先给岗位做一次风险体检

              </span>

            </h1>


            <p>

              从岗位 JD 风险识别、
              合同条款辅助审核，

              到权益知识与维权流程，

              智法明行为大学生提供
              可追溯、有依据的实习风险提示。

            </p>


            <div class="hero-buttons">

              <a
                class="primary-button"
                href="#features"
              >

                开始检测岗位

              </a>


              <a
                class="secondary-button"
                href="#features"
              >

                审核实习合同

              </a>

            </div>


            <div class="principles">

              <span>

                ✓ 数据来源可追溯

              </span>


              <span>

                ✓ 风险结论保留原文证据

              </span>


              <span>

                ✓ 不伪造平台数据

              </span>

            </div>

          </div>


          <div class="system-card">

            <div class="system-header">

              <div>

                <small>

                  SYSTEM STATUS

                </small>


                <h2>

                  系统运行状态

                </h2>

              </div>


              <span
                class="status-badge"
                :class="{
                  error: errorMessage
                }"
              >

                {{
                  errorMessage
                    ? "连接异常"
                    : "实时连接"
                }}

              </span>

            </div>


            <div
              v-if="loading"
              class="system-message"
            >

              正在读取真实系统状态……

            </div>


            <div
              v-else-if="errorMessage"
              class="system-message error-message"
            >

              <strong>

                后端连接失败

              </strong>


              <p>

                {{ errorMessage }}

              </p>


              <button
                type="button"
                @click="loadSystemStatus"
              >

                重新连接

              </button>

            </div>


            <div
              v-else
              class="system-list"
            >

              <div class="system-item">

                <div>

                  <span>

                    Express API

                  </span>


                  <strong>

                    {{
                      systemInformation
                        ?.message
                    }}

                  </strong>

                </div>


                <b>

                  正常

                </b>

              </div>


              <div class="system-item">

                <div>

                  <span>

                    MySQL 数据库

                  </span>


                  <strong>

                    {{
                      databaseInformation
                        ?.data
                        ?.databaseName
                    }}

                  </strong>

                </div>


                <b>

                  已连接

                </b>

              </div>


              <div class="system-item">

                <div>

                  <span>

                    数据库账号

                  </span>


                  <strong>

                    {{
                      databaseInformation
                        ?.data
                        ?.currentUser
                    }}

                  </strong>

                </div>


                <b class="blue">

                  实时读取

                </b>

              </div>


              <div class="system-item">

                <div>

                  <span>

                    MySQL 版本

                  </span>


                  <strong>

                    {{
                      databaseInformation
                        ?.data
                        ?.mysqlVersion
                    }}

                  </strong>

                </div>


                <b class="blue">

                  API

                </b>

              </div>

            </div>


            <p class="system-note">

              本卡片数据由 Vue
              实时请求 Express，

              再由 Express 连接 MySQL
              后返回，

              不是写死的演示数据。

            </p>

          </div>

        </div>

      </section>


      <section
        id="features"
        class="features"
      >

        <div class="container">

          <div class="section-title">

            <span>

              核心功能

            </span>


            <h2>

              覆盖大学生实习过程中的关键权益场景

            </h2>


            <p>

              后续所有正式数据均保存来源名称、
              原始链接、发布时间和采集时间。

            </p>

          </div>


          <div class="feature-grid">

            <article class="feature-card">

              <div class="feature-icon">

                查

              </div>


              <h3>

                岗位 JD 风险审查

              </h3>


              <p>

                对粘贴的岗位 JD
                进行文本结构化、
                上下文判断和风险分析。

              </p>


              <span>

                开始检测 →

              </span>

            </article>


            <article class="feature-card">

              <div class="feature-icon">

                审

              </div>


              <h3>

                合同智能审核

              </h3>


              <p>

                辅助识别薪酬、
                工时、违约责任和
                单方免责等风险条款。

              </p>


              <span>

                进入审核 →

              </span>

            </article>


            <article class="feature-card">

              <div class="feature-icon">

                法

              </div>


              <h3>

                权益知识库

              </h3>


              <p>

                汇总真实法规、
                政策文件和官方说明，
                并保留来源依据。

              </p>


              <span>

                查看知识 →

              </span>

            </article>


            <article class="feature-card">

              <div class="feature-icon">

                护

              </div>


              <h3>

                维权流程指引

              </h3>


              <p>

                根据问题类型提供
                证据整理、沟通处理
                和官方渠道指引。

              </p>


              <span>

                查看流程 →

              </span>

            </article>

          </div>

        </div>

      </section>

    </main>


    <footer class="footer">

      <div class="container footer-content">

        <div>

          <strong>

            智法明行

          </strong>


          <p>

            识别实习风险，
            守护每一次职场出发。

          </p>

        </div>


        <p class="disclaimer">

          本平台提供岗位风险辅助识别、
          权益知识和信息指引，

          不替代律师提供的正式法律意见。

        </p>

      </div>

    </footer>

  </div>

</template>


<style scoped>

.site-header {

  position: sticky;

  z-index: 20;

  top: 0;

  border-bottom:
    1px solid
    rgba(
      230,
      234,
      242,
      0.9
    );

  background:
    rgba(
      255,
      255,
      255,
      0.9
    );

  backdrop-filter:
    blur(18px);

}


.header-content {

  display: flex;

  height: 76px;

  align-items: center;

  gap: 34px;

}


.brand {

  display: flex;

  align-items: center;

  gap: 12px;

  margin-right: auto;

}


.brand-logo {

  display: grid;

  width: 44px;

  height: 44px;

  place-items: center;

  border-radius: 14px;

  background:

    linear-gradient(

      135deg,

      #2457e6,

      #7357f6

    );

  color: white;

  font-size: 20px;

  font-weight: 900;

  box-shadow:

    0 10px 24px

    rgba(

      36,

      87,

      230,

      0.22

    );

}


.brand-text {

  display: flex;

  flex-direction: column;

  gap: 3px;

}


.brand-text strong {

  font-size: 18px;

}


.brand-text span {

  color: #8791a5;

  font-size: 11px;

}


.navigation {

  display: flex;

  gap: 25px;

}


.navigation a {

  color: #59657a;

  font-size: 14px;

  transition:
    color 0.2s;

}


.navigation a:hover {

  color: #2457e6;

}


.header-button {

  padding:

    11px 19px;

  border-radius: 11px;

  background: #2457e6;

  color: white;

  font-size: 14px;

  font-weight: 700;

  transition:

    transform 0.2s,

    background 0.2s;

}


.header-button:hover {

  transform:

    translateY(-1px);

  background: #1944bd;

}


.hero {

  padding:

    88px 0 96px;

  background:

    radial-gradient(

      circle at 88% 10%,

      rgba(

        115,

        87,

        246,

        0.16

      ),

      transparent 30%

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

  gap: 70px;

}


.tag {

  display: inline-flex;

  padding:

    8px 14px;

  border:

    1px solid

    rgba(

      36,

      87,

      230,

      0.15

    );

  border-radius: 99px;

  background: white;

  color: #2457e6;

  font-size: 13px;

  font-weight: 800;

}


h1 {

  margin:

    27px 0 24px;

  font-size:

    clamp(

      48px,

      5.7vw,

      76px

    );

  line-height: 1.13;

  letter-spacing:

    -0.05em;

}


h1 span {

  display: block;

  margin-top: 7px;

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

  max-width: 640px;

  color: #667085;

  font-size: 18px;

  line-height: 1.9;

}


.hero-buttons {

  display: flex;

  gap: 14px;

  margin-top: 34px;

}


.primary-button,

.secondary-button {

  display: inline-flex;

  min-height: 50px;

  align-items: center;

  justify-content: center;

  padding:

    0 24px;

  border-radius: 13px;

  font-weight: 800;

  transition:

    transform 0.2s,

    box-shadow 0.2s;

}


.primary-button {

  background:

    linear-gradient(

      135deg,

      #2457e6,

      #5e62ef

    );

  color: white;

  box-shadow:

    0 15px 30px

    rgba(

      36,

      87,

      230,

      0.22

    );

}


.secondary-button {

  border:

    1px solid

    #dce3f0;

  background: white;

  color: #344158;

}


.primary-button:hover,

.secondary-button:hover {

  transform:

    translateY(-2px);

}


.principles {

  display: flex;

  flex-wrap: wrap;

  gap:

    12px 20px;

  margin-top: 28px;

  color: #667085;

  font-size: 13px;

}


.system-card {

  padding: 29px;

  border:

    1px solid

    rgba(

      255,

      255,

      255,

      0.95

    );

  border-radius: 24px;

  background:

    rgba(

      255,

      255,

      255,

      0.92

    );

  box-shadow:

    0 28px 75px

    rgba(

      49,

      66,

      118,

      0.14

    );

}


.system-header {

  display: flex;

  align-items:
    flex-start;

  justify-content:
    space-between;

  gap: 20px;

}


.system-header small {

  color: #8a94a7;

  font-weight: 800;

  letter-spacing:

    0.14em;

}


.system-header h2 {

  margin:

    7px 0 0;

  font-size: 23px;

}


.status-badge {

  padding:

    7px 11px;

  border-radius: 99px;

  background: #e9f9f1;

  color: #168554;

  font-size: 11px;

  font-weight: 800;

}


.status-badge.error {

  background: #fff0f0;

  color: #d43c3c;

}


.system-list {

  display: grid;

  gap: 11px;

  margin-top: 26px;

}


.system-item {

  display: flex;

  min-height: 68px;

  align-items: center;

  justify-content:
    space-between;

  gap: 20px;

  padding:

    13px 15px;

  border:

    1px solid

    #edf0f6;

  border-radius: 14px;

  background: #fbfcff;

}


.system-item div {

  display: flex;

  min-width: 0;

  flex-direction: column;

  gap: 4px;

}


.system-item span {

  color: #8a94a7;

  font-size: 11px;

}


.system-item strong {

  overflow: hidden;

  font-size: 13px;

  text-overflow:
    ellipsis;

  white-space:
    nowrap;

}


.system-item b {

  flex-shrink: 0;

  padding:

    6px 9px;

  border-radius: 8px;

  background: #e9f9f1;

  color: #168554;

  font-size: 10px;

}


.system-item b.blue {

  background: #edf3ff;

  color: #2457e6;

}


.system-message {

  margin-top: 26px;

  padding:

    38px 20px;

  border-radius: 15px;

  background: #f8faff;

  color: #667085;

  text-align: center;

}


.error-message strong {

  color: #ef4444;

}


.error-message p {

  font-size: 13px;

}


.error-message button {

  padding:

    9px 14px;

  border: 0;

  border-radius: 9px;

  background: #2457e6;

  color: white;

}


.system-note {

  margin:

    18px 2px 0;

  color: #8993a5;

  font-size: 11px;

  line-height: 1.7;

}


.features {

  padding:

    95px 0;

}


.section-title {

  max-width: 760px;

  margin:

    0 auto 44px;

  text-align: center;

}


.section-title > span {

  color: #2457e6;

  font-size: 13px;

  font-weight: 800;

  letter-spacing:

    0.12em;

}


.section-title h2 {

  margin:

    14px 0;

  font-size:

    clamp(

      33px,

      4vw,

      49px

    );

  line-height: 1.25;

}


.section-title p {

  color: #758095;

}


.feature-grid {

  display: grid;

  grid-template-columns:

    repeat(

      4,

      1fr

    );

  gap: 20px;

}


.feature-card {

  min-height: 300px;

  padding: 28px;

  border:

    1px solid

    #e7ebf3;

  border-radius: 20px;

  background: white;

  transition:

    transform 0.25s,

    box-shadow 0.25s,

    border-color 0.25s;

}


.feature-card:hover {

  transform:

    translateY(-7px);

  border-color:

    rgba(

      36,

      87,

      230,

      0.25

    );

  box-shadow:

    0 22px 55px

    rgba(

      36,

      87,

      230,

      0.11

    );

}


.feature-icon {

  display: grid;

  width: 48px;

  height: 48px;

  place-items: center;

  border-radius: 15px;

  background:

    linear-gradient(

      135deg,

      #edf3ff,

      #f0edff

    );

  color: #2457e6;

  font-size: 18px;

  font-weight: 900;

}


.feature-card h3 {

  margin:

    23px 0 13px;

  font-size: 19px;

}


.feature-card p {

  min-height: 94px;

  color: #748096;

  font-size: 14px;

  line-height: 1.8;

}


.feature-card > span {

  display: inline-block;

  margin-top: 18px;

  color: #2457e6;

  font-size: 13px;

  font-weight: 800;

}


.footer {

  padding:

    38px 0;

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

  font-size: 19px;

}


.footer p {

  margin:

    9px 0 0;

  color: #aeb9d1;

  font-size: 13px;

  line-height: 1.8;

}


.disclaimer {

  max-width: 520px;

  text-align: right;

}


@media (
  max-width: 1000px
) {

  .navigation {

    display: none;

  }


  .hero-content {

    grid-template-columns:

      1fr;

  }


  .feature-grid {

    grid-template-columns:

      repeat(

        2,

        1fr

      );

  }

}


@media (
  max-width: 640px
) {

  .brand-text span {

    display: none;

  }


  .hero {

    padding:

      60px 0;

  }


  .hero-buttons {

    flex-direction:

      column;

  }


  .principles {

    flex-direction:

      column;

  }


  .feature-grid {

    grid-template-columns:

      1fr;

  }


  .footer-content {

    align-items:
      flex-start;

    flex-direction:
      column;

  }


  .disclaimer {

    text-align: left;

  }

}

</style>