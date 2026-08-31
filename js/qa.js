/* ============================================================
   分子语堂 · AI 问答室
   多模型配置（内置免费预设 + 自定义）· 流式对话 · 本地会话
   ============================================================ */
(function () {
  "use strict";

  /* ================= 服务商预设 ================= */
  var PROVIDERS = [
    {
      id: "siliconflow", name: "硅基流动", free: true,
      desc: "注册送 2000 万 tokens，多款免费模型 · cloud.siliconflow.cn",
      base: "https://api.siliconflow.cn/v1",
      models: [
        { id: "Qwen/Qwen2.5-7B-Instruct", free: true },
        { id: "THUDM/glm-4-9b-chat", free: true },
        { id: "Qwen/Qwen2.5-72B-Instruct" },
        { id: "deepseek-ai/DeepSeek-V3" }
      ]
    },
    {
      id: "zhipu", name: "智谱 AI", free: true,
      desc: "GLM-4-Flash 完全免费 · bigmodel.cn",
      base: "https://open.bigmodel.cn/api/paas/v4",
      models: [
        { id: "glm-4-flash", free: true },
        { id: "glm-4-air" },
        { id: "glm-4-plus" }
      ]
    },
    {
      id: "dashscope", name: "阿里云百炼", free: false,
      desc: "新用户免费额度 · bailian.console.aliyun.com",
      base: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      models: [
        { id: "qwen-turbo" },
        { id: "qwen-plus" },
        { id: "qwen-max" }
      ]
    },
    {
      id: "deepseek", name: "DeepSeek", free: false,
      desc: "性价比之选 · platform.deepseek.com",
      base: "https://api.deepseek.com/v1",
      models: [
        { id: "deepseek-chat" },
        { id: "deepseek-reasoner" }
      ]
    },
    {
      id: "moonshot", name: "月之暗面 Kimi", free: false,
      desc: "长文本见长 · platform.moonshot.cn",
      base: "https://api.moonshot.cn/v1",
      models: [
        { id: "moonshot-v1-8k" },
        { id: "moonshot-v1-32k" },
        { id: "moonshot-v1-128k" }
      ]
    },
    {
      id: "custom", name: "自定义接口", free: false,
      desc: "任意 OpenAI 兼容端点（含自建代理）",
      base: "",
      models: []
    }
  ];

  /* ================= 角色预设 ================= */
  var PERSONAS = {
    general: "你是「分子语堂」学习平台的 AI 助手，专注于化工（Chemical Engineering）与英语（English）两大领域。回答务必准确、结构清晰；默认使用中文回答，关键专业术语后附英文原文。",
    chem: "你是一位经验丰富的化工专业教师，正在辅导学生。涉及化工原理（流体流动、传热、蒸馏、吸收、干燥）、反应工程、工艺与安全等主题时：给出公式（纯文本形式，变量含义逐一说明）、适用条件与一个典型例题；关键术语附英文；解释由浅入深，先直觉后公式。",
    eng: "你是一位专业英语教师，擅长四六级、学术英语与化工英语 ESP 教学。用中文讲解，配英文例句；批改英文写作时逐句指出错误（语法、搭配、时态），给出修改后版本与理由；讲解长难句时拆分主干、从句与修饰成分。",
    translator: "你是一位化工文献翻译专家。中译英：输出地道的学术英语，遵循 IMRAD 文体规范；英译中：译文准确流畅，专业术语首次出现时括注英文原文；遇到长难句，先拆解结构再给译文。",
    cet6: "你是一位大学英语六级（CET-6）备考教练，目标帮助考生考到 425 以上并冲刺 500+。职责：① 讲解高频词汇时给出词频标注、记忆锚点（词根词缀）与真题语境例句；② 讲解长难句先拆主干再分析从句；③ 批改写作时按六级评分维度（内容切题、语言准确、衔接连贯）逐句给出分数与修改建议；④ 讲解翻译时先给参考译文，再逐句分析得分点与易错点；⑤ 随时可出题：词汇单选、翻译段落、写作模拟题各一套，并在用户作答后评分。回答用中文，英文例句保留英文。",
    career: "你是一位化工行业资深职业导师，深耕化工领域校招与社招辅导。职责：① 简历：逐句改写为「动词开头+数字收尾」的量化表述，指出应届简历常见硬伤；② 面试：模拟技术面（化工原理、Aspen、设计计算）与 HR 面（STAR 法则），对用户的回答给出 1-10 分评分与改进版；③ 岗位与行业：讲解工艺/研发/生产/安全/质量/设备/设计院/销售/新能源等方向的门槛、发展与薪资区间；④ 规划：根据用户年级与目标给出可执行的补强清单（证书优先级、软件技能、作品集）。回答用中文，务实直接，避免空话。"
  };
  var PERSONA_NAMES = {
    general: "通用助手", chem: "化工导师", eng: "英语教师", translator: "文献翻译官",
    cet6: "六级教练", career: "求职导师"
  };

  /* ================= 状态 ================= */
  var LS_CFG = "mst_qa_config_v1";
  var LS_SESS = "mst_qa_sessions_v1";
  var LS_CUR = "mst_qa_current_v1";

  var DEFAULT_CFG = { provider: "siliconflow", base: "https://api.siliconflow.cn/v1", key: "", model: "Qwen/Qwen2.5-7B-Instruct", modelCustom: "", persona: "general", temp: 0.7 };

  function loadCfg() {
    try { return Object.assign({}, DEFAULT_CFG, JSON.parse(localStorage.getItem(LS_CFG) || "{}")); }
    catch (e) { return Object.assign({}, DEFAULT_CFG); }
  }
  function saveCfg(c) { localStorage.setItem(LS_CFG, JSON.stringify(c)); }

  var cfg = loadCfg();

  var sessions = [];
  try { sessions = JSON.parse(localStorage.getItem(LS_SESS) || "[]"); } catch (e) { sessions = []; }
  var curId = localStorage.getItem(LS_CUR) || null;
  if (!curId || !sessions.some(function (s) { return s.id === curId; })) {
    curId = null;
  }

  var streaming = false;
  var aborter = null;

  /* ================= DOM ================= */
  var $ = function (id) { return document.getElementById(id); };
  var msgsEl = $("qaMsgsInner");
  var msgsScroll = $("qaMsgs");
  var inputEl = $("qaInput");
  var sendBtn = $("qaSend");
  var modal = $("settingsModal");

  /* ================= 轻量 Markdown ================= */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function mdToHtml(md) {
    var s = esc(md || "");
    var blocks = [];
    s = s.replace(/```(\w*)\n?([\s\S]*?)(?:```|$)/g, function (m, lang, code) {
      blocks.push('<pre><code>' + code.replace(/\n$/, "") + '</code></pre>');
      return "\u0000B" + (blocks.length - 1) + "\u0000";
    });
    s = s.replace(/`([^`\n]+)`/g, function (m, c) {
      blocks.push("<code>" + c + "</code>");
      return "\u0000B" + (blocks.length - 1) + "\u0000";
    });
    s = s.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
         .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
         .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
    s = s.replace(/^&gt;\s?(.+)$/gm, "<blockquote>$1</blockquote>");
    s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/\|\s*---[\s:|-]+\|/g, "|SEPLINE|");

    var lines = s.split("\n");
    var out = [];
    var inUl = false, inOl = false;
    var tableBuf = [];

    function flushLists() {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (inOl) { out.push("</ol>"); inOl = false; }
    }
    function flushTable() {
      if (!tableBuf.length) return;
      var rows = tableBuf.filter(function (r) { return r.indexOf("|SEPLINE|") === -1; });
      var html = "<table><tr>";
      rows[0].split("|").filter(function (c) { return c.trim() !== ""; }).forEach(function (c) { html += "<th>" + c.trim() + "</th>"; });
      html += "</tr>";
      rows.slice(1).forEach(function (r) {
        html += "<tr>";
        r.split("|").filter(function (c) { return c.trim() !== ""; }).forEach(function (c) { html += "<td>" + c.trim() + "</td>"; });
        html += "</tr>";
      });
      html += "</table>";
      out.push(html);
      tableBuf = [];
    }

    lines.forEach(function (line) {
      var l = line.trim();
      if (l.indexOf("|") >= 0 && l.split("|").length >= 3) { flushLists(); tableBuf.push(l); return; }
      flushTable();
      var mUl = l.match(/^[-*+]\s+(.+)$/);
      var mOl = l.match(/^(\d+)[.、]\s+(.+)$/);
      var mH = l.match(/^<(h[123]|blockquote)>/);
      if (mUl) {
        if (!inUl) { flushLists(); out.push("<ul>"); inUl = true; }
        out.push("<li>" + mUl[1] + "</li>");
      } else if (mOl) {
        if (!inOl) { flushLists(); out.push("<ol>"); inOl = true; }
        out.push("<li>" + mOl[2] + "</li>");
      } else if (mH || l === "") {
        flushLists();
        if (l === "") { out.push("<p></p>"); } else { out.push(l); }
      } else {
        flushLists();
        out.push("<p>" + l + "</p>");
      }
    });
    flushLists();
    flushTable();
    s = out.join("");
    s = s.replace(/<p><\/p>/g, "");
    s = s.replace(/\u0000B(\d+)\u0000/g, function (m, i) { return blocks[+i]; });
    return s;
  }

  /* ================= 会话管理 ================= */
  function persistSessions() {
    localStorage.setItem(LS_SESS, JSON.stringify(sessions.slice(0, 40)));
    localStorage.setItem(LS_CUR, curId || "");
  }

  function curSession() {
    return sessions.find(function (s) { return s.id === curId; }) || null;
  }

  function newSession() {
    var s = { id: "s" + Date.now() + Math.random().toString(36).slice(2, 6), title: "新对话", messages: [], updated: Date.now() };
    sessions.unshift(s);
    curId = s.id;
    persistSessions();
    renderSessions();
    renderChat();
  }

  function renderSessions() {
    var box = $("qaSessions");
    box.innerHTML = sessions.map(function (s) {
      return '<div class="qa-session' + (s.id === curId ? " on" : "") + '" data-id="' + s.id + '">' +
        '<span class="s-title">' + esc(s.title) + '</span>' +
        '<button class="s-del" data-del="' + s.id + '" title="删除">✕</button></div>';
    }).join("") || '<div style="text-align:center; font-family: var(--mono); font-size: 11px; color: var(--ink-3); padding: 20px 0; letter-spacing: 1px;">NO SESSIONS YET</div>';
  }

  $("qaSessions").addEventListener("click", function (ev) {
    var del = ev.target.closest("[data-del]");
    if (del) {
      ev.stopPropagation();
      var did = del.dataset.del;
      sessions = sessions.filter(function (s) { return s.id !== did; });
      if (curId === did) { curId = sessions.length ? sessions[0].id : null; if (!curId) newSession(); }
      persistSessions();
      renderSessions();
      renderChat();
      return;
    }
    var item = ev.target.closest(".qa-session");
    if (item) {
      curId = item.dataset.id;
      persistSessions();
      renderSessions();
      renderChat();
      closeMobileSide();
    }
  });

  $("qaNew").addEventListener("click", function () {
    var cur = curSession();
    if (cur && cur.messages.length === 0) { window.MST_TOAST("已在空对话中"); closeMobileSide(); return; }
    newSession();
    closeMobileSide();
  });

  /* ================= 渲染对话 ================= */
  function nearBottom() {
    return msgsScroll.scrollHeight - msgsScroll.scrollTop - msgsScroll.clientHeight < 120;
  }
  function scrollBottom(force) {
    if (force || nearBottom()) msgsScroll.scrollTop = msgsScroll.scrollHeight;
  }

  var SUGGESTS = [
    { cls: "chem", tag: "化工原理", t: "用高中生能听懂的方式解释精馏塔的工作原理" },
    { cls: "", tag: "公式求助", t: "伯努利方程每一项的物理意义是什么？举一个泵送水的例子" },
    { cls: "", tag: "英语批改", t: "批改这段英文摘要：The experiment show that the heat transfer coefficient increase with the flow rate." },
    { cls: "", tag: "文献翻译", t: "把这句翻译成学术英语：随着回流比增大，塔顶产品纯度提高，但能耗显著上升。" }
  ];

  function renderEmpty() {
    msgsEl.innerHTML =
      '<div class="qa-empty">' +
      '<svg width="72" height="72" viewBox="0 0 48 48" style="margin: 0 auto 18px;">' +
      '<polygon points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5" fill="none" stroke="#1f2d27" stroke-width="2.4"/>' +
      '<text x="24" y="30" text-anchor="middle" font-family="STZhongsong,SimSun,serif" font-size="17" font-weight="900" fill="#c24914">问</text></svg>' +
      '<div class="big">今天想学点什么？</div>' +
      '<div class="sub">ASK ABOUT CHEMICAL ENGINEERING · ENGLISH · ANYTHING</div>' +
      '<div class="qa-suggests">' +
      SUGGESTS.map(function (s) {
        return '<button class="qa-suggest ' + s.cls + '" data-q="' + esc(s.t) + '">' +
          '<span class="sg-tag">' + s.tag + '</span><span class="sg-t">' + esc(s.t) + "</span></button>";
      }).join("") +
      "</div></div>";
  }

  function msgHtml(role, content, streamingFlag, mi) {
    var isUser = role === "user";
    var body = isUser ? mdToHtml(content) : (mdToHtml(content) + (streamingFlag ? '<span class="cursor-blink"></span>' : ""));
    var ava = isUser
      ? '<div class="msg-ava">你</div>'
      : '<div class="msg-ava"><svg viewBox="0 0 48 48"><polygon points="24,4 42,13.5 42,32.5 24,42 6,32.5 6,13.5" fill="none" stroke="#fff" stroke-width="2.6"/><text x="24" y="30" text-anchor="middle" font-size="16" font-weight="900" fill="#fff" font-family="STZhongsong,SimSun,serif">分</text></svg></div>';
    var actions = (!isUser && !streamingFlag)
      ? '<div class="msg-actions"><button class="msg-action" data-act="copy">⧉ 复制</button><button class="msg-action" data-act="regen">↻ 重新生成</button></div>'
      : "";
    return '<div class="msg ' + (isUser ? "user" : "ai") + '" data-mi="' + (mi === undefined ? -1 : mi) + '">' + ava +
      '<div class="msg-body"><div class="msg-name">' + (isUser ? "YOU" : "MST-AI") + '</div>' +
      '<div class="msg-content">' + body + "</div>" + actions + "</div></div>";
  }

  function renderChat() {
    var s = curSession();
    if (!s || !s.messages.length) { renderEmpty(); return; }
    msgsEl.innerHTML = s.messages.map(function (m, i) {
      if (m.error) {
        return '<div class="msg ai" data-mi="' + i + '"><div class="msg-ava">!</div><div class="msg-body"><div class="msg-name">SYSTEM</div><div class="msg-content msg-error">' + esc(m.content) + "</div></div></div>";
      }
      return msgHtml(m.role, m.content, false, i);
    }).join("");
    scrollBottom(true);
  }

  msgsEl.addEventListener("click", function (ev) {
    var sug = ev.target.closest(".qa-suggest");
    if (sug) { inputEl.value = sug.dataset.q; inputEl.focus(); return; }
    var act = ev.target.closest(".msg-action");
    if (act) {
      var node = act.closest(".msg");
      var s = curSession();
      if (!s) return;
      var target = s.messages[+node.dataset.mi];
      if (act.dataset.act === "copy") {
        if (!target) return;
        navigator.clipboard.writeText(target.content).then(function () { window.MST_TOAST("已复制到剪贴板"); });
      } else if (act.dataset.act === "regen" && !streaming) {
        var lastUser = -1;
        for (var i = s.messages.length - 1; i >= 0; i--) { if (s.messages[i].role === "user") { lastUser = i; break; } }
        if (lastUser >= 0 && lastUser === s.messages.length - 2) {
          s.messages = s.messages.slice(0, lastUser + 1);
          persistSessions();
          renderChat();
          callAI(s);
        }
      }
    }
  });

  /* ================= API 调用 ================= */
  function activeModel() {
    return (cfg.modelCustom || "").trim() || cfg.model || "";
  }

  function buildMessages(s) {
    var sys = (PERSONAS[cfg.persona] || PERSONAS.general);
    var hist = s.messages.filter(function (m) { return !m.error; }).slice(-20);
    return [{ role: "system", content: sys }].concat(hist);
  }

  function apiErrorText(e) {
    var msg = e && e.message ? e.message : String(e);
    if (/Failed to fetch|NetworkError|TypeError/i.test(msg)) {
      return "网络请求失败：" + msg +
        "\n\n可能原因：\n① 未配置 API Key —— 点击右上角「模型设置」\n② 服务商不支持浏览器直连（CORS 跨域）—— 到工具页下载 Cloudflare Worker 代理脚本，部署后填入代理地址\n③ Base URL 填写有误";
    }
    return "请求出错：" + msg;
  }

  async function callAI(s) {
    if (streaming) return;
    if (!cfg.key.trim()) {
      openSettings();
      window.MST_TOAST("请先在设置中填写 API Key", "error");
      return;
    }
    streaming = true;
    setSendMode(true);

    var sObj = s || curSession();
    if (!sObj) { sObj = newSessionObj(); }

    var holder = document.createElement("div");
    holder.innerHTML = msgHtml("assistant", "", true, sObj.messages.length);
    var node = holder.firstChild;
    var contentEl = node.querySelector(".msg-content");
    if (msgsEl.querySelector(".qa-empty")) msgsEl.innerHTML = "";
    msgsEl.appendChild(node);
    scrollBottom(true);

    var acc = "";
    var lastPaint = 0;
    aborter = new AbortController();

    function paint(force) {
      var now = Date.now();
      if (!force && now - lastPaint < 90) return;
      lastPaint = now;
      contentEl.innerHTML = mdToHtml(acc) + '<span class="cursor-blink"></span>';
      scrollBottom(false);
    }

    try {
      var base = (cfg.base || "").replace(/\/+$/, "");
      var res = await fetch(base + "/chat/completions", {
        method: "POST",
        signal: aborter.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + cfg.key.trim()
        },
        body: JSON.stringify({
          model: activeModel(),
          messages: buildMessages(sObj),
          stream: true,
          temperature: cfg.temp
        })
      });

      if (!res.ok) {
        var et = await res.text().catch(function () { return ""; });
        throw new Error("HTTP " + res.status + " " + et.slice(0, 300));
      }

      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buf = "";
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buf += decoder.decode(chunk.value, { stream: true });
        var lines = buf.split("\n");
        buf = lines.pop();
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line || line.indexOf("data:") !== 0) continue;
          var data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            var j = JSON.parse(data);
            var d = j.choices && j.choices[0] ? (j.choices[0].delta ? j.choices[0].delta.content : (j.choices[0].message ? j.choices[0].message.content : "")) : "";
            if (d) { acc += d; paint(false); }
          } catch (e) { /* 忽略不完整分片 */ }
        }
      }

      if (!acc.trim()) acc = "（模型未返回内容，请检查模型名称是否正确）";
      sObj.messages.push({ role: "assistant", content: acc });
      sObj.updated = Date.now();
      persistSessions();
      renderSessions();
      contentEl.innerHTML = mdToHtml(acc);
      var actions = document.createElement("div");
      actions.className = "msg-actions";
      actions.innerHTML = '<button class="msg-action" data-act="copy">⧉ 复制</button><button class="msg-action" data-act="regen">↻ 重新生成</button>';
      node.querySelector(".msg-body").appendChild(actions);
      scrollBottom(false);
    } catch (e) {
      if (e.name === "AbortError") {
        if (acc.trim()) {
          sObj.messages.push({ role: "assistant", content: acc + "\n\n（已手动停止）" });
          persistSessions();
          contentEl.innerHTML = mdToHtml(acc + "\n\n*（已手动停止）*");
        } else {
          node.remove();
        }
      } else {
        var errText = apiErrorText(e);
        contentEl.classList.add("msg-error");
        contentEl.innerText = "⚠ " + errText;
        sObj.messages.push({ role: "assistant", error: true, content: errText });
        persistSessions();
      }
    } finally {
      streaming = false;
      aborter = null;
      setSendMode(false);
    }
  }

  function newSessionObj() {
    var s = { id: "s" + Date.now(), title: "新对话", messages: [], updated: Date.now() };
    sessions.unshift(s);
    curId = s.id;
    return s;
  }

  function setSendMode(stop) {
    sendBtn.innerHTML = stop
      ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    sendBtn.title = stop ? "停止生成" : "发送";
  }

  async function send() {
    var text = inputEl.value.trim();
    if (!text || streaming) return;
    var s = curSession();
    if (!s) s = newSessionObj();

    s.messages.push({ role: "user", content: text });
    if (s.title === "新对话") {
      s.title = text.slice(0, 24) + (text.length > 24 ? "…" : "");
      renderSessions();
    }
    persistSessions();
    inputEl.value = "";
    inputEl.style.height = "auto";
    renderChat();
    callAI(s);
  }

  sendBtn.addEventListener("click", function () {
    if (streaming && aborter) { aborter.abort(); return; }
    send();
  });

  inputEl.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      send();
    }
  });

  inputEl.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 160) + "px";
  });

  /* ================= 设置弹窗 ================= */
  var tempProvider = cfg.provider;

  function fillModelSelect(pid) {
    var p = PROVIDERS.find(function (x) { return x.id === pid; });
    var sel = $("cfgModel");
    if (!p || !p.models.length) {
      sel.innerHTML = '<option value="">— 手动填写模型名 —</option>';
      sel.disabled = true;
    } else {
      sel.disabled = false;
      sel.innerHTML = p.models.map(function (m) {
        return '<option value="' + m.id + '">' + m.id + (m.free ? "　「免费」" : "") + "</option>";
      }).join("");
    }
  }

  function renderProviderGrid() {
    $("providerGrid").innerHTML = PROVIDERS.map(function (p) {
      return '<button class="provider' + (p.id === tempProvider ? " on" : "") + '" data-p="' + p.id + '">' +
        '<span class="p-name">' + p.name + (p.free ? '<span class="p-free">有免费模型</span>' : "") + "</span>" +
        '<span class="p-desc">' + p.desc + "</span></button>";
    }).join("");
  }

  function openSettings() {
    tempProvider = cfg.provider;
    renderProviderGrid();
    $("cfgBase").value = cfg.base;
    $("cfgKey").value = cfg.key;
    fillModelSelect(tempProvider);
    if (cfg.model) $("cfgModel").value = cfg.model;
    $("cfgModelCustom").value = cfg.modelCustom || "";
    $("cfgTemp").value = cfg.temp;
    $("cfgTempVal").textContent = cfg.temp;
    modal.classList.add("show");
  }

  function closeSettings() { modal.classList.remove("show"); }

  $("qaSettingsBtn").addEventListener("click", openSettings);
  $("modelChip").addEventListener("click", openSettings);
  $("settingsClose").addEventListener("click", closeSettings);
  modal.addEventListener("click", function (ev) { if (ev.target === modal) closeSettings(); });

  $("providerGrid").addEventListener("click", function (ev) {
    var btn = ev.target.closest(".provider");
    if (!btn) return;
    tempProvider = btn.dataset.p;
    renderProviderGrid();
    var p = PROVIDERS.find(function (x) { return x.id === tempProvider; });
    if (p && p.base) $("cfgBase").value = p.base;
    fillModelSelect(tempProvider);
    var sel = $("cfgModel");
    if (p && p.models.length) {
      var freeFirst = p.models.find(function (m) { return m.free; }) || p.models[0];
      sel.value = freeFirst.id;
    }
    $("cfgModelCustom").value = "";
  });

  $("cfgTemp").addEventListener("input", function () {
    $("cfgTempVal").textContent = this.value;
  });

  $("cfgSave").addEventListener("click", function () {
    var p = PROVIDERS.find(function (x) { return x.id === tempProvider; });
    var selVal = $("cfgModel").value || "";
    var custom = $("cfgModelCustom").value.trim();
    var model = custom || selVal || (p && p.models.length ? p.models[0].id : "");
    cfg.provider = tempProvider;
    cfg.base = $("cfgBase").value.trim();
    cfg.key = $("cfgKey").value.trim();
    cfg.model = model;
    cfg.modelCustom = custom;
    cfg.temp = parseFloat($("cfgTemp").value) || 0.7;
    saveCfg(cfg);
    updateModelChip();
    closeSettings();
    window.MST_TOAST("配置已保存 ✓");
  });

  $("cfgTest").addEventListener("click", async function () {
    var btn = this;
    btn.disabled = true;
    btn.textContent = "测试中…";
    var base = $("cfgBase").value.trim().replace(/\/+$/, "");
    var key = $("cfgKey").value.trim();
    var model = $("cfgModelCustom").value.trim() || $("cfgModel").value;
    if (!base || !key || !model) {
      window.MST_TOAST("请先填写 Base URL / Key / 模型", "error");
      btn.disabled = false; btn.textContent = "测试连接";
      return;
    }
    try {
      var res = await fetch(base + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: "Hi" }], max_tokens: 5 })
      });
      if (res.ok) {
        window.MST_TOAST("连接成功 ✓ 模型响应正常");
      } else {
        var t = await res.text().catch(function () { return ""; });
        window.MST_TOAST("HTTP " + res.status + "：" + t.slice(0, 120), "error");
      }
    } catch (e) {
      window.MST_TOAST("连接失败（网络或 CORS 跨域）— 可用工具页代理脚本", "error");
    }
    btn.disabled = false;
    btn.textContent = "测试连接";
  });

  /* ================= 角色切换 ================= */
  $("personaSel").addEventListener("change", function () {
    cfg.persona = this.value;
    saveCfg(cfg);
    window.MST_TOAST("已切换为「" + (PERSONA_NAMES[cfg.persona] || "通用助手") + "」");
  });

  /* ================= 顶栏状态 ================= */
  function updateModelChip() {
    var name = activeModel() || "未配置模型";
    $("modelName").textContent = cfg.key ? name : name + " · 点击设置";
    $("modelDot").className = "m-dot" + (cfg.key ? "" : " off");
  }

  /* ================= 移动端侧栏 ================= */
  function closeMobileSide() { $("qaSide").classList.remove("mobile-open"); }
  $("qaSideToggle").addEventListener("click", function () {
    $("qaSide").classList.toggle("mobile-open");
  });
  $("qaSide").addEventListener("click", function (ev) {
    if (ev.target === this) closeMobileSide();
  });

  /* ================= 初始化 ================= */
  document.addEventListener("DOMContentLoaded", function () {
    $("personaSel").value = cfg.persona in PERSONAS ? cfg.persona : "general";
    updateModelChip();
    renderSessions();
    if (!curId) newSession(); else renderChat();
    inputEl.focus();
  });
})();
