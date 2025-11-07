# ---- Build React ----
FROM node:22 AS client-build
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client ./client
RUN cd client && npm run build

# ---- Server ----
FROM node:22
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server ./server

# 拷貝 React build 到 server 可見目錄
COPY --from=client-build /app/client/dist ./client/dist

ENV PORT=5000
EXPOSE 5000
WORKDIR /app/server
CMD ["node", "server.js"]
