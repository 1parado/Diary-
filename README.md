📓 Diary 项目说明
这是一个基于 Spring Boot（后端） + Vue/Vite（前端） 的全栈日记管理系统。

项目采用前后端分离架构，支持用户登录、日记记录与管理等功能。

🗂️ 项目结构
text
编辑
Diary/

├── backend/          # Java 后端（Spring Boot）

└── frontend/         # 前端（Vue + TypeScript + Vite）

⚙️ 快速启动指南
1️⃣ 启动前端
进入前端目录，安装依赖并启动开发服务器：

bash
编辑
cd frontend

npm install        # 安装依赖（首次运行必需）

npm run dev        # 启动本地开发服务（默认 http://localhost:5173）

✅ 前端会自动热重载，修改代码后浏览器将实时更新。

2️⃣ 启动后端
🔹 步骤 1：创建数据库
确保已安装 Postgresql（或其他你配置的数据库）
创建一个名为 diary_db 的数据库：
运行schema.sql文件

💡 数据库连接信息请参考 backend/src/main/resources/application.properties 可按需修改。

🔹 步骤 2：编译并运行后端
使用 Maven 编译并启动 Spring Boot 应用：

bash
编辑

cd backend

mvn clean compile    # 清理并编译（可选）

mvn spring-boot:run  # 启动后端服务（默认 http://localhost:8080）


🔌 接口联调
前端默认代理请求到 http://localhost:8080（通过 Vite 的 proxy 配置）
无需手动处理跨域问题，开发环境下已自动配置
📦 技术栈
模块	技术
后端	Java 17, Spring Boot 3.x, Spring Data JPA, MySQL, JWT
前端	Vue 3, TypeScript, Vite, Pinia, Axios, Element Plus (或你使用的 UI)
构建	Maven（后端）, npm（前端）
🙌 贡献与反馈
欢迎提交 Issue 或 Pull Request！

如有疑问，请联系项目维护者。

🌟 Happy Coding! —— 你的日记，由你掌控 💖

项目博客介绍——[Diary](https://1parado.github.io/p/diary-%E4%B8%80%E6%AC%BE%E5%A4%9A%E5%8A%9F%E8%83%BD%E6%97%A5%E8%AE%B0%E8%BD%AF%E4%BB%B6/)

B站项目介绍——[Diary-BiliBili](https://www.bilibili.com/video/BV1WtqQB1Evr/?share_source=copy_web&vd_source=e51d3438543fd80d97a3f4ce11e7cdcb)
