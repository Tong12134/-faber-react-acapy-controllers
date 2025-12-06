# ---- Build React (client) ----
FROM node:22 AS client-build
WORKDIR /app

# 先安裝 client 依賴
COPY client/package*.json ./client/
RUN cd client && npm install

# 拷貝 client 原始碼並 build
COPY client ./client
RUN cd client && npm run build

# ---- Server ----
FROM node:22
WORKDIR /app

# 先安裝 server 依賴（用 npm install，不用 ci）
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# 拷貝 server 原始碼
COPY server ./server

# 把 React build 拷貝給 server
COPY --from=client-build /app/client/dist ./client/dist

# 跟 server.js 一致
ENV PORT=5050
EXPOSE 5050

WORKDIR /app/server
CMD ["node", "server.js"]
