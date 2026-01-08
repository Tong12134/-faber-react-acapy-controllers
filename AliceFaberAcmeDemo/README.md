## Demo 操作流程

### 1. 啟動 Indy（VON Network）

```bash
cd von-network
./manage start   # 啟動 VON / Indy ledger
````

> 若要關閉 VON：

```bash
./manage down
```


### 2. 啟動 Aries Agents（Hospital / Patient / Insurer）

```bash
cd (faber-react)acapy-controllers/AliceFaberAcmeDemo/docker
docker compose up --build -d
```

這一步會啟動三個 Aries agent 以及對應的容器服務。

### 3. 啟動 Controllers（前後端）

```bash
cd (faber-react)acapy-controllers/AliceFaberAcmeDemo
npm run dev-all
```

執行後，Hospital / Patient / Insurer 三個 controller 會一起啟動
（依你的設定對應到不同的 port
  Hospital：http://localhost:5173  
  Patient ：http://localhost:5174
  Insurer ：http://localhost:5175
  ）。

