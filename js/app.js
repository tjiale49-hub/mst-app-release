/* ============================================================
   分子语堂 · 每日学习仪表盘
   每日任务自动轮换 · 打卡连击 · 倒计时 · 艾宾浩斯复习
   云端进度同步（Cloudflare Worker KV）· AI 每日测验（联网）
   ============================================================ */
(function () {
  "use strict";

  var WORDS = window.MST_WORDS6 || [];
  var CHEM = window.MST_CHEM || [];
  var TIPS = window.MST_CAREER_TIPS || [];
  var QC6 = window.MST_Q_CET6 || [];
  var QCH = window.MST_Q_CHEM || [];

  var LS_SYNC = "mst_sync_cfg_v1";

  function dayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dayIndex() { return Math.floor(new Date(dayKey() + "T00:00:00").getTime() / 86400000); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var DI = dayIndex();

  /* ---------- 每日内容轮换（确定性，按日期） ---------- */
  function wordsOfDay(di) {
    if (!WORDS.length) return [];
    var s = ((di % WORDS.length) + WORDS.length) % WORDS.length * 3 % WORDS.length;
    return [WORDS[s], WORDS[(s + 1) % WORDS.length], WORDS[(s + 2) % WORDS.length]];
  }
  function chemOfDay(di) {
    if (!CHEM.length) return [];
    var s = ((di % CHEM.length) + CHEM.length) % CHEM.length;
    return [CHEM[s], CHEM[(s + 1) % CHEM.length]];
  }
  function tipOfDay(di) {
    if (!TIPS.length) return null;
    return TIPS[((di % TIPS.length) + TIPS.length) % TIPS.length];
  }
  function qOfDay(bank, di) {
    if (!bank.length) return null;
    return bank[((di % bank.length) + bank.length) % bank.length];
  }

  var todayWords = wordsOfDay(DI);
  var todayChem = chemOfDay(DI);
  var todayTip = tipOfDay(DI);
  var q6 = qOfDay(QC6, DI);
  var qch = qOfDay(QCH, DI);

  /* ---------- 完成状态 ---------- */
  var SKEY = "mst_daily_" + dayKey();
  var state = {};
  try { state = JSON.parse(localStorage.getItem(SKEY) || "{}"); } catch (e) { state = {}; }
  function saveState() { localStorage.setItem(SKEY, JSON.stringify(state)); }

  function getDays() {
    try { return JSON.parse(localStorage.getItem("mst_days") || "[]"); } catch (e) { return []; }
  }
  function markDay() {
    var days = getDays();
    var k = dayKey();
    if (days.indexOf(k) < 0) { days.push(k); localStorage.setItem("mst_days", JSON.stringify(days)); }
  }
  function calcStreak() {
    var days = getDays().sort();
    if (!days.length) return 0;
    var idx = DI;
    var set = {};
    days.forEach(function (d) { set[d] = 1; });
    var cur = dayKey();
    var probe = set[cur] ? cur : dayKeyOf(DI - 1);
    if (!set[probe]) return 0;
    var n = 0;
    var i = DI;
    while (set[dayKeyOf(i)]) { n++; i--; }
    return n;
  }
  function dayKeyOf(di) {
    var d = new Date(di * 86400000);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* ---------- 任务模型 ---------- */
  var TASK_IDS = ["w0", "w1", "w2", "c0", "c1", "tip", "q6", "qch"];
  function progress() {
    var done = TASK_IDS.filter(function (id) { return state[id]; }).length;
    return { done: done, total: TASK_IDS.length };
  }

  function renderProgress() {
    var p = progress();
    var pct = Math.round(p.done / p.total * 100);
    document.getElementById("dashBar").style.width = pct + "%";
    document.getElementById("dashBarText").textContent = p.done + " / " + p.total;
    document.getElementById("dashStreak").textContent = calcStreak();
  }

  function complete(id) {
    if (state[id]) return;
    state[id] = 1;
    saveState();
    markDay();
    renderProgress();
    var p = progress();
    if (p.done === p.total) {
      window.MST_TOAST("今日任务全部完成！连击 " + calcStreak() + " 天 🔥");
    }
  }

  /* ---------- 渲染：每日一词 ---------- */
  function renderWords() {
    var box = document.getElementById("wordZone");
    if (!box) return;
    box.innerHTML = todayWords.map(function (w, i) {
      return '<div class="task-card' + (state["w" + i] ? " done" : "") + '" data-task="w' + i + '">' +
        '<div class="task-top"><span class="task-tag">WORD 0' + (i + 1) + '</span>' +
        '<label class="task-check-wrap"><input type="checkbox" class="task-check" data-task="w' + i + '"' + (state["w" + i] ? " checked" : "") + '><span>已记</span></label></div>' +
        '<div class="word-big">' + esc(w.w) + '</div>' +
        '<div class="word-phon">' + esc(w.p) + '</div>' +
        '<div class="word-mean">' + esc(w.m) + '</div>' +
        '<div class="word-ex">' + w.e + "</div></div>";
    }).join("");
  }

  /* ---------- 渲染：每日化工 ---------- */
  function renderChem() {
    var box = document.getElementById("chemZone");
    if (!box) return;
    box.innerHTML = todayChem.map(function (c, i) {
      return '<div class="task-card' + (state["c" + i] ? " done" : "") + '" data-task="c' + i + '">' +
        '<div class="task-top"><span class="task-tag rust">CHEM 0' + (i + 1) + '</span>' +
        '<label class="task-check-wrap"><input type="checkbox" class="task-check" data-task="c' + i + '"' + (state["c" + i] ? " checked" : "") + '><span>已读</span></label></div>' +
        '<div class="chem-t">' + esc(c.t) + '<span class="chem-en">' + esc(c.en) + "</span></div>" +
        '<div class="chem-d">' + esc(c.d) + "</div></div>";
    }).join("");
  }

  /* ---------- 渲染：求职锦囊 ---------- */
  function renderTip() {
    var box = document.getElementById("tipZone");
    if (!box || !todayTip) return;
    box.innerHTML = '<div class="task-card' + (state.tip ? " done" : "") + '" data-task="tip" style="grid-column: 1 / -1;">' +
      '<div class="task-top"><span class="task-tag gold">CAREER TIP · 求职锦囊</span>' +
      '<label class="task-check-wrap"><input type="checkbox" class="task-check" data-task="tip"' + (state.tip ? " checked" : "") + '><span>已读</span></label></div>' +
      '<div class="chem-t">' + esc(todayTip.t) + "</div>" +
      '<div class="chem-d">' + esc(todayTip.d) +
      ' <a href="career.html" style="color: var(--rust); font-weight: 600;">去求职中心 →</a></div></div>';
  }

  /* ---------- 渲染：复习队列 ---------- */
  function renderReview() {
    var box = document.getElementById("reviewZone");
    if (!box) return;
    var seen = {};
    var list = [];
    [1, 2, 4, 7].forEach(function (gap) {
      wordsOfDay(DI - gap).forEach(function (w) {
        if (!seen[w.w]) { seen[w.w] = 1; list.push(w); }
      });
    });
    if (!list.length) {
      box.innerHTML = '<span style="font-family: var(--mono); font-size: 12px; color: var(--ink-3);">坚持 1 天后这里会出现你的复习词 · 艾宾浩斯曲线 1/2/4/7 天</span>';
      return;
    }
    box.innerHTML = list.map(function (w) {
      return '<span class="review-chip" title="' + esc(w.m) + '">' + esc(w.w) + "</span>";
    }).join("");
  }

  /* ---------- 渲染：每日一题 ---------- */
  function renderQuiz() {
    function one(q, id, label, tagCls) {
      if (!q) return "";
      return '<div class="quiz-q" data-quiz="' + id + '"><span class="card-tag ' + tagCls + '">' + label + '</span>' +
        '<div class="q-title" style="margin-top: 8px;"><span class="q-no">Q</span><span>' + esc(q.q) + "</span></div>" +
        '<div class="quiz-opts">' +
        q.opts.map(function (o, j) {
          return '<button class="quiz-opt" data-quiz="' + id + '" data-oi="' + j + '"><span class="opt-key">' + "ABCD".charAt(j) + '</span><span>' + esc(o) + "</span></button>";
        }).join("") +
        '</div><div class="quiz-explain">解析：' + esc(q.e) + "</div></div>";
    }
    document.getElementById("quizZone").innerHTML =
      one(q6, "q6", "六级 · 每日一题", "rust") + one(qch, "qch", "化工 · 每日一题", "teal");
  }

  document.getElementById("quizZone").addEventListener("click", function (ev) {
    var btn = ev.target.closest(".quiz-opt");
    if (!btn) return;
    var id = btn.dataset.quiz;
    var box = this.querySelector('[data-quiz="' + id + '"]');
    if (box.dataset.answered) return;
    box.dataset.answered = "1";
    var q = id === "q6" ? q6 : qch;
    var oi = +btn.dataset.oi;
    box.querySelectorAll(".quiz-opt").forEach(function (b, j) {
      b.disabled = true;
      if (j === q.a) b.classList.add("right");
      else if (j === oi) b.classList.add("wrong");
    });
    box.querySelector(".quiz-explain").classList.add("show");
    complete(id);
  });

  /* ---------- 勾选任务 ---------- */
  document.getElementById("taskArea").addEventListener("change", function (ev) {
    var cb = ev.target.closest(".task-check");
    if (!cb) return;
    var id = cb.dataset.task;
    if (cb.checked) {
      complete(id);
      var card = this.querySelector('[data-task="' + id + '"]');
      if (card) card.classList.add("done");
    } else {
      delete state[id];
      saveState();
      var card2 = this.querySelector('[data-task="' + id + '"]');
      if (card2) card2.classList.remove("done");
      renderProgress();
    }
  });

  /* ---------- 倒计时 ---------- */
  function examDate() {
    return localStorage.getItem("mst_exam_date") || "2026-12-19";
  }
  function renderCountdown() {
    var target = examDate();
    var days = Math.ceil((new Date(target + "T00:00:00").getTime() - new Date(dayKey() + "T00:00:00").getTime()) / 86400000);
    document.getElementById("cdNum").textContent = days > 0 ? days : days === 0 ? 0 : "已过";
    document.getElementById("cdNum").textContent = days > 0 ? days : (days === 0 ? "0" : "—");
    document.getElementById("cdDate").textContent = target;
    var el = document.getElementById("cdLabel");
    el.textContent = days >= 0 ? "距六级考试还有" : "考试日期已过，点击修改";
  }
  document.getElementById("cdEdit").addEventListener("click", function () {
    var v = prompt("输入六级考试日期（格式 2026-12-19，以官方通知为准）：", examDate());
    if (v === null) return;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) {
      localStorage.setItem("mst_exam_date", v.trim());
      renderCountdown();
      window.MST_TOAST("倒计时已更新为 " + v.trim());
    } else {
      window.MST_TOAST("日期格式不正确，应为 YYYY-MM-DD", "error");
    }
  });

  /* ---------- PWA 安装 ---------- */
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var btn = document.getElementById("installBtn");
    if (btn) btn.style.display = "inline-flex";
  });
  document.getElementById("installBtn").addEventListener("click", async function () {
    if (!deferredPrompt) { window.MST_TOAST("当前浏览器不支持安装，可手动“添加到主屏幕”"); return; }
    deferredPrompt.prompt();
    var r = await deferredPrompt.userChoice;
    if (r && r.outcome === "accepted") window.MST_TOAST("安装成功！可在桌面/主屏幕打开");
    deferredPrompt = null;
    this.style.display = "none";
  });
  window.addEventListener("appinstalled", function () {
    var btn = document.getElementById("installBtn");
    if (btn) btn.style.display = "none";
  });

  /* ---------- 云端进度同步（Cloudflare Worker KV） ---------- */
  function syncCfg() {
    try { return JSON.parse(localStorage.getItem(LS_SYNC) || "{}"); } catch (e) { return {}; }
  }
  function saveSyncCfg(c) { localStorage.setItem(LS_SYNC, JSON.stringify(c)); }

  function snapshot() {
    var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (/^mst_/.test(k) && k !== LS_SYNC) out[k] = localStorage.getItem(k);
    }
    return out;
  }

  function mergeInto(local, remote) {
    Object.keys(remote).forEach(function (k) {
      if (k === LS_SYNC) return;
      var rv = remote[k];
      var lv = local[k];
      if (lv === undefined) { localStorage.setItem(k, rv); return; }
      try {
        var lo = JSON.parse(lv), ro = JSON.parse(rv);
        if (Array.isArray(lo) && Array.isArray(ro)) {
          var u = lo.concat(ro.filter(function (x) { return lo.indexOf(x) < 0; }));
          localStorage.setItem(k, JSON.stringify(u));
        } else if (lo && ro && typeof lo === "object" && typeof ro === "object") {
          var m = {};
          Object.keys(lo).forEach(function (x) { m[x] = lo[x]; });
          Object.keys(ro).forEach(function (x) { if (!(x in m) || ro[x]) m[x] = ro[x]; });
          localStorage.setItem(k, JSON.stringify(m));
        } else if (rv && !lv) {
          localStorage.setItem(k, rv);
        }
      } catch (e) { /* 非 JSON 值：远端有本地无则写入 */ }
    });
  }

  async function syncAction(dir) {
    var cfg = syncCfg();
    var base = (cfg.url || "").replace(/\/+$/, "");
    if (!base) {
      var u = prompt("首次使用请先填入进度同步 Worker 地址（在工具下载页获取脚本并部署）：", "");
      if (!u) return;
      var pw = prompt("设置访问口令（与 Worker 中 AUTH_KEY 一致，可直接回车跳过）：", "");
      cfg = { url: u.trim(), pw: (pw || "").trim() };
      saveSyncCfg(cfg);
      base = cfg.url.replace(/\/+$/, "");
    }
    var btnId = dir === "up" ? "syncUp" : "syncDown";
    var btn = document.getElementById(btnId);
    btn.disabled = true;
    var old = btn.textContent;
    btn.textContent = "同步中…";
    try {
      if (dir === "up") {
        var res = await fetch(base + "/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Auth": cfg.pw || "" },
          body: JSON.stringify({ device: navigator.userAgent.slice(0, 60), time: Date.now(), data: snapshot() })
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        window.MST_TOAST("进度已上传云端 ✓");
      } else {
        var r2 = await fetch(base + "/progress", { headers: { "X-Auth": cfg.pw || "" } });
        if (!r2.ok) throw new Error("HTTP " + r2.status);
        var j = await r2.json();
        if (!j || !j.data) throw new Error("云端暂无进度");
        mergeInto({}, j.data);
        try { state = JSON.parse(localStorage.getItem(SKEY) || "{}"); } catch (e) { state = {}; }
        renderWords(); renderChem(); renderTip(); renderReview(); renderQuiz(); renderProgress();
        window.MST_TOAST("进度已从云端拉取并合并 ✓");
      }
    } catch (e) {
      window.MST_TOAST("同步失败：" + (e.message || e) + "（检查 Worker 地址与口令）", "error");
    }
    btn.disabled = false;
    btn.textContent = old;
  }
  document.getElementById("syncUp").addEventListener("click", function () { syncAction("up"); });
  document.getElementById("syncDown").addEventListener("click", function () { syncAction("down"); });

  /* ---------- AI 每日测验（联网实时生成） ---------- */
  function qaCfg() {
    try { return JSON.parse(localStorage.getItem("mst_qa_config_v1") || "{}"); } catch (e) { return {}; }
  }

  function mdLite(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  }

  async function genAiQuiz() {
    var c = qaCfg();
    if (!c.key || !c.base || !c.model) {
      window.MST_TOAST("请先在 AI 问答室配置模型（右上角 模型设置）", "error");
      setTimeout(function () { location.href = "qa.html"; }, 1200);
      return;
    }
    var btn = document.getElementById("aiQuizBtn");
    btn.disabled = true;
    btn.textContent = "AI 出题中…";
    var out = document.getElementById("aiQuizZone");
    out.innerHTML = '<div class="quiz-q"><div class="q-title"><span class="q-no">AI</span><span>正在生成今日定制测验（5 道六级 + 5 道化工）…</span></div></div>';
    try {
      var res = await fetch((c.base || "").replace(/\/+$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + c.key },
        body: JSON.stringify({
          model: (c.modelCustom || "").trim() || c.model,
          messages: [
            { role: "system", content: "你是出题官。只输出 JSON，不要任何多余文字。" },
            {
              role: "user", content: "生成10道选择题：5道大学英语六级词汇/语法题（题干可含化工语境）+ 5道化工专业知识题（化工原理、反应工程、安全环保）。难度中等。严格按如下 JSON 数组格式输出，不要 markdown 代码块：[{\"q\":\"题干\",\"opts\":[\"A\",\"B\",\"C\",\"D\"],\"a\":0,\"e\":\"一句话解析\"}] 其中 a 是正确选项下标。"
            }
          ],
          temperature: 0.8
        })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var j = await res.json();
      var txt = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || "").trim();
      txt = txt.replace(/^```(json)?/i, "").replace(/```$/,"").trim();
      var m = txt.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("解析失败");
      var list = JSON.parse(m[0]);
      if (!Array.isArray(list) || !list.length) throw new Error("题目为空");
      renderAiQuiz(list.slice(0, 10));
      window.MST_TOAST("今日 AI 定制测验已生成（每天内容都不同）");
    } catch (e) {
      out.innerHTML = '<div class="quiz-q"><div class="q-title"><span class="q-no">!</span><span>生成失败：' + esc(e.message || e) + "</span></div>" +
        '<p style="font-size:13px;color:var(--ink-2);margin-top:8px;">请确认已在 AI 问答室配置可用的模型（含 API Key），且接口允许浏览器直连（否则请用工具页的代理脚本）。</p></div>';
    }
    btn.disabled = false;
    btn.textContent = "✦ AI 出今日测验（联网）";
  }

  function renderAiQuiz(list) {
    var html = list.map(function (q, i) {
      var a = typeof q.a === "number" ? q.a : "ABCD".indexOf(q.a);
      return '<div class="quiz-q" data-ai="' + i + '"><div class="q-title"><span class="q-no">AI-' + (i + 1) + '</span><span>' + mdLite(q.q) + "</span></div>" +
        '<div class="quiz-opts">' + (q.opts || []).map(function (o, j) {
          return '<button class="quiz-opt" data-ai="' + i + '" data-oi="' + j + '" data-a="' + a + '"><span class="opt-key">' + "ABCD".charAt(j) + '</span><span>' + mdLite(o) + "</span></button>";
        }).join("") + "</div>" +
        '<div class="quiz-explain">解析：' + mdLite(q.e || "—") + "</div></div>";
    }).join("");
    document.getElementById("aiQuizZone").innerHTML = html;
  }

  document.getElementById("aiQuizBtn").addEventListener("click", genAiQuiz);
  document.getElementById("aiQuizZone").addEventListener("click", function (ev) {
    var btn = ev.target.closest(".quiz-opt");
    if (!btn) return;
    var box = this.querySelector('[data-ai="' + btn.dataset.ai + '"]');
    if (box.dataset.answered) return;
    box.dataset.answered = "1";
    var a = +btn.dataset.a;
    box.querySelectorAll(".quiz-opt").forEach(function (b, j) {
      b.disabled = true;
      if (j === a) b.classList.add("right");
      else if (b === btn) b.classList.add("wrong");
    });
    box.querySelector(".quiz-explain").classList.add("show");
  });

  /* ---------- 更新时间戳 ---------- */
  var wk = ["日", "一", "二", "三", "四", "五", "六"];
  var now = new Date();
  document.getElementById("dashDate").textContent = now.getFullYear() + " 年 " + (now.getMonth() + 1) + " 月 " + now.getDate() + " 日 · 星期" + wk[now.getDay()];
  document.getElementById("cycleInfo").textContent = "词库 " + WORDS.length + " 词 · 化工知识 " + CHEM.length + " 条 · 求职锦囊 " + TIPS.length + " 条 · 内容每日 00:00 自动轮换";

  /* ---------- 初始渲染 ---------- */
  renderWords();
  renderChem();
  renderTip();
  renderReview();
  renderQuiz();
  renderProgress();
  renderCountdown();
})();
