# SSI-based Medical Insurance Claim Demo

本專案是一個結合 **SSI (Self-Sovereign Identity)**、**Hyperledger Aries / Indy** 與 FHIR 風格醫療資料的醫療理賠原型系統，模擬三個角色：

* 🏥 **Hospital**：發行就醫 Verifiable Credential (VC)
* 👤 **Patient**：以 Aries agent 持有 VC
* 🏦 **Insurer**：驗證 VC、依保單條款試算理賠、建立 claim


## 架構概觀

系統由三個 Aries agent + 三個 controller 組成：

* `hospital-agent` / `hospital-controller`
* `patient-agent` / `patient-controller`
* `insurer-agent` / `insurer-controller`

Aries agent 透過 **Hyperledger Indy ledger**（`genesis-url: http://host.docker.internal:9000/genesis`）取得 DID / schema / credential definition 等共通信任基礎。

資料流簡述：

1. 醫院依 FHIR 風格欄位建立 Encounter，發行 VC 給病患
2. 病患錢包持有 VC，於理賠申請時出示 proof
3. 保險公司驗證 VC（透過 Indy 上的 DID / cred def），轉成內部 DTO，依保單規則試算理賠並建立 claim

理賠試算邏輯實作在 `insurer-controller/server`：

* `claimPreview.js`：`credAttrsToEncounterDTO`、`credAttrsToPolicyDTO`、`previewClaimFromEncounter`
* `claimStore.js`：`createClaim` / `listClaims` / `getClaim`


## 事前準備

1. **Hyperledger Indy ledger（例如 von-network）**

   * 須有一個 Indy 網路在本機或外部執行，並提供：

     ```text
     http://host.docker.internal:9000/genesis
     ```
   * `hospital-agent`、`insurer-agent` 使用的 `--seed`（如 `faber0000...`、`acme0000...`）
     必須對應到 **已在 ledger 上註冊的 DID**（通常在啟動 ledger 的時候預先載入）。
     ```text
     http://localhost:9000
     ```

2. **環境需求**

   * Docker、Docker Compose
   * macOS / Linux / Windows 其一


## docker-compose 重點（摘要）

三個 agent（只示範 hospital-agent，其餘類似）：

```yaml
hospital-agent:
  image: ghcr.io/openwallet-foundation/acapy-agent:py3.12-1.2-lts
  command:
    [
      "start",
      "--label", "Hospital Agent",
      "--inbound-transport", "http", "0.0.0.0", "8020",
      "--outbound-transport", "http",
      "--admin", "0.0.0.0", "8021",
      "--admin-insecure-mode",
      "--endpoint", "http://hospital-agent:8020",
      "--wallet-type", "askar",
      "--wallet-name", "hospital_wallet",
      "--wallet-key", "hospital_secret_1234",
      "--seed", "faber000000000000000000000000001",
      "--genesis-url", "http://host.docker.internal:9000/genesis",
      "--auto-provision",
      "--auto-accept-invites",
      "--auto-accept-requests",
      "--auto-respond-messages",
      "--auto-respond-credential-offer",
      "--auto-respond-credential-request",
      "--auto-respond-presentation-request"
    ]
```

請確認：

* `--wallet-key` 至少 16 字元
* `--genesis-url` 指向你啟動中的 Indy ledger
* `--seed` 對應到 ledger 上已註冊的 DID（通常由 von-network 或你自己的 bootstrap 腳本寫入）

controllers：

```yaml
hospital-controller:
  build:
    context: /Users/chenyantong/Desktop/(faber-react)acapy-controllers/AliceFaberAcmeDemo/controllers/hospital-controller
  ports:
    - 9021:5050
  ...
```

`patient-controller`、`insurer-controller` 的 `context` 也請改成你實際的 `(faber-react)...` 路徑。


## 啟動步驟

1. **先啟動 Indy ledger**

   例如使用 von-network 或你自己的 Indy stack，確保：

   * ledger 服務是 `Up` 狀態
   * `http://localhost:9000/genesis` 可被本機存取（container 內用 `host.docker.internal`）

2. **啟動 Aries agents + controllers**

   在 `docker-compose.yml` 所在資料夾：

   ```bash
   docker compose down
   docker compose up --build
   ```

   或背景模式：

   ```bash
   docker compose up --build -d
   ```

3. **確認服務**

   ```bash
   docker ps
   ```

   確認：

   * `hospital-agent` / `patient-agent` / `insurer-agent` → Up
   * `hospital-controller` / `patient-controller` / `insurer-controller` → Up


## 介面網址

| 角色            | URL                     |
| ---------------| ----------------------- |
| Hospital Agent | `http://localhost:8121` |
| Patient Agent  | `http://localhost:8131` |
| Insurer Agent  | `http://localhost:8141` |


## Demo 操作

1. 在 Hospital / Patient 之間建立連線（connection）
2. Hospital 發行 Encounter VC → Patient 接受
3. 在 Patient / Insurer 之間建立連線
4. Insurer 送出 proof request → Patient 出示 VC
5. Insurer 建立 claim，並在 Claims Dashboard 看到：

   * 理賠申請列表（含預估理賠金額）
   * Claim 詳細內容與就醫摘要／DTO JSON／試算結果
