import express from "express";

import cors from "cors";

import helmet from "helmet";

import morgan from "morgan";

import dotenv from "dotenv";


import {
  testDatabaseConnection
} from "./config/database.js";


import jdReviewRoutes
from "./routes/jdReviewRoutes.js";


import legalSourceRoutes
from "./routes/legalSourceRoutes.js";


import rightsGuideRoutes
from "./routes/rightsGuideRoutes.js";


dotenv.config({
  quiet: true
});


const app =
  express();


const port =
  Number(
    process.env.SERVER_PORT
    ||
    3000
  );


app.use(
  helmet()
);


app.use(
  cors({
    origin: true
  })
);


app.use(
  express.json({
    limit: "1mb"
  })
);


app.use(
  morgan(
    "dev"
  )
);


app.get(
  "/api/health",

  (
    request,
    response
  ) => {
    response
      .status(200)
      .json({
        success: true,

        message:
          "智法明行后端服务运行正常",

        timestamp:
          new Date()
            .toISOString()
      });
  }
);


app.get(
  "/api/health/database",

  async (
    request,
    response
  ) => {
    try {
      const databaseInformation =
        await testDatabaseConnection();


      response
        .status(200)
        .json({
          success: true,

          message:
            "MySQL 数据库连接正常",

          data:
            databaseInformation
        });
    } catch (error) {
      response
        .status(500)
        .json({
          success: false,

          message:
            "MySQL 数据库连接失败",

          error:
            error.message
        });
    }
  }
);


app.use(
  "/api/jd-reviews",

  jdReviewRoutes
);


app.use(
  "/api/legal-sources",

  legalSourceRoutes
);


app.use(
  "/api/rights-guides",

  rightsGuideRoutes
);


app.use(
  (
    request,
    response
  ) => {
    response
      .status(404)
      .json({
        success: false,

        message:
          "请求的接口不存在。"
      });
  }
);


async function startServer() {
  try {
    const databaseInformation =
      await testDatabaseConnection();


    console.log("");

    console.log(
      "MySQL 数据库连接成功"
    );


    console.log(
      `当前数据库：${
        databaseInformation
          .databaseName
      }`
    );


    console.log(
      `数据库账号：${
        databaseInformation
          .currentUser
      }`
    );


    console.log(
      `MySQL 版本：${
        databaseInformation
          .mysqlVersion
      }`
    );


    console.log("");


    app.listen(
      port,

      () => {
        console.log(
          "智法明行后端已启动："
          +
          `http://localhost:${port}`
        );


        console.log(
          "健康检查："
          +
          `http://localhost:${port}`
          +
          "/api/health"
        );


        console.log(
          "JD 审查接口："
          +
          `POST http://localhost:${port}`
          +
          "/api/jd-reviews"
        );


        console.log(
          "官方依据接口："
          +
          `GET http://localhost:${port}`
          +
          "/api/legal-sources"
        );


        console.log(
          "维权指引列表接口："
          +
          `GET http://localhost:${port}`
          +
          "/api/rights-guides"
        );


        console.log(
          "维权指引详情接口："
          +
          `GET http://localhost:${port}`
          +
          "/api/rights-guides/:guideCode"
        );
      }
    );
  } catch (error) {
    console.error("");

    console.error(
      "后端启动失败"
    );


    console.error(
      `数据库连接错误：${
        error.message
      }`
    );


    console.error("");


    process.exit(1);
  }
}


startServer();
