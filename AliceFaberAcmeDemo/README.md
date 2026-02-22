## Demo 操作流程

### 1. 啟動 Indy（VON Network）

**啟動服務**

```bash
cd von-network
./manage start  

```

**註冊網址**

```text
http://localhost:9000

```

**暫停與重啟服務**
* **若要暫時關閉 VON（保留 ledger 資料）：**
* 方法 A：使用內建腳本
```bash
./manage stop

```

* 方法 B：直接使用 Docker 指令
```bash
docker compose stop

```

* **重新開啟 VON（沿用同一份 ledger）：**
* 方法 A：使用內建腳本
```bash
./manage start

```

* 方法 B：直接使用 Docker 指令
```bash
docker compose start

```


> 💡 這樣註冊過的 hospital/insurer DID（NYM）會一直留著，就不需要每次重輸入。

---

### 2. 啟動 Aries Agents（Hospital / Patient / Insurer）

**啟動 Agents**
這一步會啟動三個 Aries agent 以及對應的容器服務。

```bash
cd (faber-react)acapy-controllers/AliceFaberAcmeDemo/docker
docker compose up -d

```

**暫停與重啟特定 Agents**

* **若要暫時關閉 agents：**
```bash
docker compose -f docker-compose.yml stop hospital-agent patient-agent insurer-agent

```


* **之後要再開回來 agents：**
```bash
docker compose -f docker-compose.yml start hospital-agent patient-agent insurer-agent

```



**暫停與重啟全部服務（Agents + Controllers）**

* **若要暫時關掉全部：**
```bash
docker compose stop
```
或是

```bash
docker compose -f docker-compose.yml stop

```

* **之後全部再開回來：**
```bash
docker compose start
```
或是
```bash
docker compose -f docker-compose.yml start

```



**更新環境**

* **需要「重建 image」或改了程式碼：**
> 重建並啟動（容器會重建，但 volume 仍保留）


```bash
docker compose -f docker-compose.yml up --build -d

```

---

### 3. 啟動 Controllers（前後端）

```bash
cd (faber-react)acapy-controllers/AliceFaberAcmeDemo
npm run dev-all

```

執行後，Hospital / Patient / Insurer 三個 controller 會一起啟動（依你的設定對應到不同的 port）：

* 🏥 **Hospital**：[`http://localhost:5173`](http://localhost:5173)
* 🧑‍⚕️ **Patient**：[`http://localhost:5174`](http://localhost:5174)
* 🛡️ **Insurer**：[`http://localhost:5175`](http://localhost:5175)

---

### 4. 若是想重新洗掉重來

**徹底關閉 Docker（破壞性）**

 `down`（刪除容器/網路，但保留 volumes → wallet 還在）


```bash
docker compose down  

```


`down -v`（停掉 docker 並清空 wallet volumes）


```bash
docker compose down -v

```



**關閉 VON（破壞性）**

```bash
./manage down
./manage rm

```

**重新啟動（順序同上，只有 docker 修改）**

 開啟：


```bash
docker compose up --build -d

```

