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


          <div class="preview-card">

            <div class="preview-header">

              <div>

                <small>

                  PRODUCT PREVIEW

                </small>


                <h2>

                  岗位风险检测

                </h2>

              </div>


              <span class="preview-status">

                演示界面

              </span>

            </div>


            <div class="job-name">

              数据分析实习生

            </div>


            <div class="risk-score">

              <span>

                综合风险评分

              </span>


              <strong>

                待检测

              </strong>

            </div>


            <div class="preview-item">

              <span>

                薪资说明

              </span>


              <b>

                等待分析

              </b>

            </div>


            <div class="preview-item">

              <span>

                工作时间

              </span>


              <b>

                等待分析

              </b>

            </div>


            <div class="preview-item">

              <span>

                收费风险

              </span>


              <b>

                等待分析

              </b>

            </div>


            <p class="preview-note">

              当前仅展示产品视觉结构。

              后续检测结果将由后端规则引擎
              和文本分析模块真实生成。

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

            </article>

          </div>

        </div>

      </section>

    </main>

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

  padding:

    0 24px;

  border-radius: 13px;

  font-weight: 800;

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


.principles {

  display: flex;

  flex-wrap: wrap;

  gap:

    12px 20px;

  margin-top: 28px;

  color: #667085;

  font-size: 13px;

}


.preview-card {

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


.preview-header {

  display: flex;

  align-items:

    flex-start;

  justify-content:

    space-between;

  gap: 20px;

}


.preview-header small {

  color: #8a94a7;

  font-weight: 800;

  letter-spacing:

    0.14em;

}


.preview-header h2 {

  margin:

    7px 0 0;

  font-size: 23px;

}


.preview-status {

  padding:

    7px 11px;

  border-radius: 99px;

  background: #edf3ff;

  color: #2457e6;

  font-size: 11px;

  font-weight: 800;

}


.job-name {

  margin-top: 26px;

  padding: 16px;

  border-radius: 14px;

  background:

    linear-gradient(

      135deg,

      #f3f7ff,

      #f8f6ff

    );

  font-size: 17px;

  font-weight: 800;

}


.risk-score {

  display: flex;

  align-items: center;

  justify-content:

    space-between;

  margin:

    15px 0;

  padding:

    17px 16px;

  border:

    1px solid

    #edf0f6;

  border-radius: 14px;

}


.risk-score span {

  color: #7b869a;

  font-size: 13px;

}


.risk-score strong {

  color: #2457e6;

  font-size: 18px;

}


.preview-item {

  display: flex;

  align-items: center;

  justify-content:

    space-between;

  padding:

    14px 15px;

  border-bottom:

    1px solid

    #edf0f6;

}


.preview-item span {

  color: #667085;

  font-size: 13px;

}


.preview-item b {

  color: #8b95a8;

  font-size: 12px;

}


.preview-note {

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

  min-height: 285px;

  padding: 28px;

  border:

    1px solid

    #e7ebf3;

  border-radius: 20px;

  background: white;

  transition:

    transform 0.25s,

    box-shadow 0.25s;

}


.feature-card:hover {

  transform:

    translateY(-7px);

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

  color: #748096;

  font-size: 14px;

  line-height: 1.8;

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


  .feature-grid {

    grid-template-columns:

      1fr;

  }

}

</style>