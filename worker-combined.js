// 喬喜科技 Cloudflare Worker — AI 聊天 + 聯絡表單
// 部署到 chels Worker，取代原有程式碼

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
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
      return new Response("Chelsea Technology API", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 路由：/contact → 聯絡表單，其他 → AI 聊天
    if (url.pathname === "/contact") {
      return handleContact(request, env);
    }
    return handleChat(request, env);
  },
};

// ==================== 聯絡表單 ====================
async function handleContact(request, env) {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  const RESEND_API_KEY = env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: "Email not configured" }), {
      status: 500, headers: cors,
    });
  }

  const { name, phone, email, message } = await request.json();

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ success: false, error: "Missing fields" }), {
      status: 400, headers: cors,
    });
  }

  const emailBody = `
<h2>網站聯絡表單 — 新訊息</h2>
<table style="border-collapse:collapse;width:100%;max-width:500px;">
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">姓名</td><td style="padding:8px;border:1px solid #ddd;">${name}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">電話</td><td style="padding:8px;border:1px solid #ddd;">${phone || '未提供'}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${email}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">訊息</td><td style="padding:8px;border:1px solid #ddd;">${message}</td></tr>
</table>
<p style="color:#999;font-size:12px;margin-top:20px;">此郵件由 thepraxisai.com 聯絡表單自動發送</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Chelsea Technology <onboarding@resend.dev>",
      to: "river@thepraxisai.com",
      subject: `[網站聯絡] ${name} 的訊息`,
      html: emailBody,
      reply_to: email,
    }),
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ success: false }), { status: 500, headers: cors });
  }

  return new Response(JSON.stringify({ success: true }), { headers: cors });
}

// ==================== AI 聊天 ====================
async function handleChat(request, env) {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  const OPENAI_API_KEY = env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500, headers: cors,
    });
  }

  const { messages } = await request.json();

  const systemPrompt = `你是喬喜科技（Chelsea Technology）的 AI 客服助理。請根據以下公司資訊，用親切、專業的繁體中文回答訪客的問題。如果問題超出以下資訊範圍，請禮貌地引導訪客透過網站聯絡表單與我們聯繫。回答請簡潔扼要。

# 公司基本資訊
- 公司名稱：喬喜科技股份有限公司（Chelsea Technology）
- 核心產品：AI 駐廠顧問
- 孵化單位：國立臺灣大學創意創業中心（NTU Garage）
- 共同創辦人：沈書禾（CTO）、張芫瑜（CEO）
- 營運長：侯允章（COO）
- Slogan：讓企業的知識不再隨人離開

# 我們解決的問題
臺灣傳統產業面臨「經驗斷層」危機。資深師傅退休、年輕人不願進入，數十年累積的工藝知識正在加速消失。喬喜科技的答案是：不用傳了，讓 AI 直接幹。

# 核心產品：AI 駐廠顧問
由專業顧問實際進駐合作企業，透過 Ontology 驅動的知識工程方法，將散落在文件、歷史案例與例外處理紀錄中的經驗，結構化地萃取並建構為企業專屬的知識模型。

三階段架構：
1. Structure（結構化）：建立企業知識的 Ontology 骨架
2. Capture（捕捉）：系統主動問老師傅問題，自動補洞
3. Deploy（部署）：AI Agent 上線，提供決策支援

# 產品價值
- 保留約 70-80% 的關鍵隱性知識
- 新人培訓期從 6-12 個月縮短至 2-4 個月
- 減少約 30-40% 的人工處理時間

# 應用場景
1. 農會信用部：POC 已完成初步驗證
2. 傳統製造業工廠
3. 基金會營運：POC 已完成初步驗證

# 定位
- 不是取代人想做的工作，是接住沒人要做的工作
- 競爭對手是人力仲介跟外包顧問`;

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
      status: res.status, headers: cors,
    });
  }

  return new Response(JSON.stringify({ reply: data.choices[0].message.content }), { headers: cors });
}
