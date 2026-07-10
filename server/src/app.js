import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { testDatabaseConnection } from "./config/database.js";

dotenv.config();

const app = express();

const port = Number(process.env.SERVER_PORT || 3000);


// 常用安全响应头
app.use(helmet());


// 允许前端调用后端接口
app.use(
  cors({
    origin: true
  })
);


// 允许后端读取 JSON 数据
app.use(
  express.json({
    limit: "1mb"
  })
);


// 在终端显示接口访问记录
app.use(morgan("dev"));


// 后端健康检查接口
app.get("/api/health", (request, response) => {
  response.status(200).json({
    success: true,
    message: "智法明行后端服务运行正常",
    timestamp: new Date().toISOString()
  });
});


// MySQL 数据库健康检查接口
app.get("/api/health/database", async (request, response) => {
  try {
    const databaseInformation = await testDatabaseConnection();

    response.status(200).json({
      success: true,
      message: "MySQL 数据库连接正常",
      data: databaseInformation
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      message: "MySQL 数据库连接失败",
      error: error.message
    });
  }
});


// 启动后端服务器
async function startServer() {
  try {
    const databaseInformation = await testDatabaseConnection();

    console.log("");
    console.log("MySQL 数据库连接成功");
    console.log(`当前数据库：${databaseInformation.databaseName}`);
    console.log(`数据库账号：${databaseInformation.currentUser}`);
    console.log(`MySQL 版本：${databaseInformation.mysqlVersion}`);
    console.log("");

    app.listen(port, () => {
      console.log(`智法明行后端已启动：http://localhost:${port}`);
      console.log(`健康检查：http://localhost:${port}/api/health`);
      console.log(
        `数据库检查：http://localhost:${port}/api/health/database`
      );
    });
  } catch (error) {
    console.error("");
    console.error("后端启动失败");
    console.error(`数据库连接错误：${error.message}`);
    console.error("");

    process.exit(1);
  }
}

startServer();