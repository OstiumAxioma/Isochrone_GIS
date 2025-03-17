// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const isochroneRouter = require('./routes/isochrone');

const app = express();
const PORT = 3001;

app.use(cors());
// 使用 body-parser 中间件解析 JSON 请求体
app.use(bodyParser.json());

// 注册等时圈路由
app.use('/api/isochrone', isochroneRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器正在 http://localhost:${PORT} 运行`);
});
