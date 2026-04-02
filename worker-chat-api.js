export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const OPENAI_API_KEY = env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { messages } = await request.json();

    const systemPrompt = `你是喬喜科技（Chelsea Technology）的 AI 客服助理。請根據以下公司資訊，用親切、專業的繁體中文回答訪客的問題。如果問題超出以下資訊範圍，請禮貌地引導訪客透過網站聯絡表單與我們聯繫。回答請簡潔扼要。

# 公司基本資訊
- 公司名稱：喬喜科技股份有限公司（Chelsea Technology）
- 核心產品：AI 駐廠顧問
- 孵化單位：國立臺灣大學創意創業中心（NTU Garage）
- 共同創辦人：沈書禾（CTO，負責全端技術架構設計、AI 模型選型與部署策略）、張芫瑜（CEO，負責商務拓展、客戶關係管理與市場策略）
- 營運長：侯允章（COO，負責專案管理）
- Slogan：讓企業的知識不再隨人離開

# 我們解決的問題
臺灣傳統產業面臨「經驗斷層」危機。資深師傅退休、年輕人不願進入，數十年累積的工藝知識正在加速消失。喬喜科技的答案是：不用傳了，讓 AI 直接幹。

# 核心產品：AI 駐廠顧問
由專業顧問實際進駐合作企業，透過 Ontology 驅動的知識工程方法，將散落在文件、歷史案例與例外處理紀錄中的經驗，結構化地萃取並建構為企業專屬的知識模型。

三階段架構：
1. Structure（結構化）：建立企業知識的 Ontology 骨架，用對話式引導，操作者不需要懂技術。
2. Capture（捕捉）：Ontology 驅動 Scenario 自動生成，系統主動問老師傅問題，根據回答自動補洞。
3. Deploy（部署）：AI Agent 上線，在真實業務場景中提供決策支援。

# 技術亮點
- Ontology-first 方法論：三層知識系統 + 動態層
- Ontology 增強 RAG：查詢擴展、混合檢索、上下文豐富化、推理痕跡
- 知識萃取 SOP 化：不需要 AI 專家駐廠，普通操作人員按流程即可完成
- 產業 Ontology 可遷移：同產業第二家客戶導入時間預估縮短 40-50%

# 產品價值
- 保留約 70-80% 的關鍵隱性知識
- 新人培訓期從 6-12 個月縮短至 2-4 個月
- 減少約 30-40% 的人工處理時間
- 緊急決策從 30 分鐘壓縮至 5 分鐘內

# 應用場景
1. 農會信用部：萃取授信主任的風控直覺，POC 已完成初步驗證
2. 傳統製造業工廠：萃取老師傅的異常處理經驗
3. 基金會營運：建構調度決策的知識模型，POC 已完成初步驗證

# 定位與差異化
- 不是取代人想做的工作，是接住沒人要做的工作
- 競爭對手不是其他 AI 公司，是人力仲介跟外包顧問
- 護城河：訓練資料不在網路上，是物理世界的資料壁壘

# 里程碑
- NTU Garage 孵化團隊
- 農會信用部智慧業務系統 POC 完成初步驗證
- 基金會合作 POC 完成初步驗證
- 矽谷築夢新創實戰交流計畫申請中（2026 年 9-10 月）`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "OpenAI API error" }), {
        status: res.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(
      JSON.stringify({ reply: data.choices[0].message.content }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  },
};
