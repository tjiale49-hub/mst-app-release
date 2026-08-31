/* ============================================================
   分子语堂 · 六级备考中心
   词汇中心（网格/闪卡/搜索/生词本）· 翻译表达库 · 全真自测
   ============================================================ */
(function () {
  "use strict";

  var WORDS = window.MST_WORDS6 || [];
  var EXPRS = window.MST_CN_EXPR || [];
  var QUIZ = window.MST_Q_CET6 || [];
  var LS_UNKNOWN = "mst_cet6_unknown_v1";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ============================================================
     SEC.02 词汇中心
     ============================================================ */
  var unknown = {};
  try { unknown = JSON.parse(localStorage.getItem(LS_UNKNOWN) || "{}"); } catch (e) { unknown = {}; }
  function saveUnknown() { localStorage.setItem(LS_UNKNOWN, JSON.stringify(unknown)); }

  var order = WORDS.map(function (_, i) { return i; });
  var flashOrder = order.slice();
  var flashIdx = 0;
  var flashMode = false;
  var flipped = false;

  var LS_DONE = "mst_cet6_quiz_done_v1";
  var quizDone = {};
  try { quizDone = JSON.parse(localStorage.getItem(LS_DONE) || "{}"); } catch (e) { quizDone = {}; }
  var quizRight = 0;

  function sortedFlash() {
    return flashOrder.slice().sort(function (a, b) {
      var ua = unknown[WORDS[a].w] ? 1 : 0;
      var ub = unknown[WORDS[b].w] ? 1 : 0;
      if (ua !== ub) return ub - ua;
      return 0;
    });
  }

  function renderGrid() {
    var q = (document.getElementById("vSearch").value || "").trim().toLowerCase();
    var box = document.getElementById("vGrid");
    var list = order.filter(function (i) {
      if (!q) return true;
      var w = WORDS[i];
      return (w.w + " " + w.m + " " + w.e).toLowerCase().indexOf(q) >= 0;
    });
    if (!list.length) {
      box.innerHTML = '<div class="card" style="grid-column:1/-1; font-family:var(--mono); font-size:13px; color:var(--ink-3);">没有匹配的词 —— 换个关键词试试。</div>';
      return;
    }
    box.innerHTML = list.map(function (i) {
      var w = WORDS[i];
      return '<div class="card vcard reveal in' + (unknown[w.w] ? " vunknown" : "") + '" data-vi="' + i + '" style="cursor:pointer; padding:16px 18px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:baseline; gap:8px;">' +
        '<b style="font-family:var(--serif); font-size:19px;">' + esc(w.w) + '</b>' +
        '<span style="font-family:var(--mono); font-size:10.5px; color:var(--ink-3);">' + esc(w.p) + '</span></div>' +
        '<div style="font-size:13px; font-weight:600; margin-top:8px;">' + esc(w.m) + '</div>' +
        '<div class="vex" style="font-size:12.5px; color:var(--ink-2); margin-top:8px; font-style:italic; border-top:1px dashed var(--grid-strong); padding-top:8px;">' + w.e + '</div>' +
        (unknown[w.w] ? '<div style="font-family:var(--mono); font-size:10px; color:var(--rust); margin-top:8px; letter-spacing:1px;">★ 生词本</div>' : "") +
        '</div>';
    }).join("");
  }

  document.getElementById("vSearch").addEventListener("input", renderGrid);

  document.getElementById("vShuffle").addEventListener("click", function () {
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    flashOrder = order.slice();
    if (flashMode) { flashIdx = 0; flipped = false; renderFlash(); }
    else { renderGrid(); }
    window.MST_TOAST("顺序已打乱");
  });

  document.getElementById("vModeBtn").addEventListener("click", function () {
    flashMode = !flashMode;
    document.getElementById("vGrid").style.display = flashMode ? "none" : "grid";
    document.getElementById("vFlash").style.display = flashMode ? "block" : "none";
    this.textContent = flashMode ? "☰ 列表模式" : "⇄ 闪卡模式";
    this.classList.toggle("on", flashMode);
    if (flashMode) { flashIdx = 0; flipped = false; renderFlash(); }
  });

  function renderFlash() {
    var sorted = sortedFlash();
    if (!sorted.length) return;
    if (flashIdx >= sorted.length) flashIdx = 0;
    if (flashIdx < 0) flashIdx = sorted.length - 1;
    var w = WORDS[sorted[flashIdx]];
    document.getElementById("vFlashcard").classList.remove("flipped");
    flipped = false;
    document.getElementById("vFCat").textContent = unknown[w.w] ? "CET-6 · 生词" : "CET-6";
    document.getElementById("vFWord").textContent = w.w;
    document.getElementById("vFPhon").textContent = w.p;
    document.getElementById("vFDef").innerHTML = esc(w.m) + (unknown[w.w] ? ' <span style="color:var(--rust); font-size:12px;">★ 生词本</span>' : "");
    document.getElementById("vFEx").innerHTML = w.e;
    document.getElementById("vFCount").textContent = (flashIdx + 1) + " / " + sorted.length;
  }

  document.getElementById("vFlashcard").addEventListener("click", function () {
    flipped = !flipped;
    this.classList.toggle("flipped", flipped);
  });
  document.getElementById("vFPrev").addEventListener("click", function () { flashIdx--; renderFlash(); });
  document.getElementById("vFNext").addEventListener("click", function () { flashIdx++; renderFlash(); });
  document.getElementById("vFUnknown").addEventListener("click", function () {
    var sorted = sortedFlash();
    var w = WORDS[sorted[flashIdx]];
    if (w) {
      unknown[w.w] = 1;
      saveUnknown();
      window.MST_TOAST("「" + w.w + "」已加入生词本，将优先复习");
      renderFlash();
    }
  });

  /* ============================================================
     SEC.06 翻译表达库
     ============================================================ */
  function topicOf(cn) {
    if (/春节|中秋|端午|元宵|团圆|灯笼|舞龙|饺子|月饼|粽子|节日|清明|重阳|七夕|腊八|生肖|属相|节气|庙会|祭祀|祭祖|年夜饭|压岁钱|春联|鞭炮|赏月|赛龙舟|登高|赏菊/.test(cn)) return "fest";
    if (/长城|故宫|兵马俑|寺庙|丝绸之路|黄山|泰山|长江|黄河|珠江|太湖|西湖|桂林|九寨沟|布达拉宫|莫高窟|苏州园林|大运河|都江堰|景德镇/.test(cn)) return "geo";
    if (/人工智能|科技|高铁|移动支付|电子商务|新能源|碳中和|造纸|印刷|火药|指南针|发明|大数据|云计算|机器人|自动化|航天|探月|空间站|5G|数字经济|直播|网购|智能手机|快递|共享|桥梁|港口|铁路网/.test(cn)) return "tech";
    if (/改革|一带一路|可持续|城市化|基础设施|脱贫|小康|经济|越来越多|发展|贫困|创新|人才|绿色|生态|环境|污染|循环|社会|保障|医疗|教育|乡村|城镇|贸易|生产总值|收入|水平|强国|振兴|现代化|环保|减排|再生/.test(cn)) return "econ";
    if (/朝代|皇帝|历史|儒家|孔子|道教|佛教|文物|秦始皇|唐太宗|古都|文明古国|唐诗|名著|商队/.test(cn)) return "hist";
    return "culture";
  }

  var exprTopic = "all";
  function renderExpr() {
    var box = document.getElementById("exprGrid");
    var list = EXPRS.map(function (x, i) { return { i: i, zh: x[0], en: x[1], t: topicOf(x[0]) }; });
    if (exprTopic !== "all") list = list.filter(function (x) { return x.t === exprTopic; });
    box.innerHTML = list.map(function (x) {
      return '<div class="card reveal in" style="padding:14px 18px; border-left:4px solid var(--teal);">' +
        '<div style="font-family:var(--serif); font-size:16px; font-weight:900;">' + esc(x.zh) + '</div>' +
        '<div style="font-family:var(--mono); font-size:12.5px; color:var(--teal-deep); margin-top:6px;">' + esc(x.en) + '</div></div>';
    }).join("") || '<div class="card" style="grid-column:1/-1; font-family:var(--mono); font-size:13px; color:var(--ink-3);">该主题暂无条目。</div>';
  }

  document.querySelectorAll("[data-topic]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-topic]").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      exprTopic = b.dataset.topic;
      renderExpr();
    });
  });

  /* ============================================================
     SEC.08 全真自测
     ============================================================ */
  function renderQuiz() {
    var box = document.getElementById("cet6QuizZone");
    box.innerHTML = QUIZ.map(function (q, i) {
      var done = quizDone[i];
      var html = '<div class="quiz-q" data-qi="' + i + '">' +
        '<div class="q-title"><span class="q-no">Q' + (i + 1) + '</span><span>' + esc(q.q) + '</span></div>' +
        '<div class="quiz-opts">';
      html += q.opts.map(function (o, j) {
        var cls = "quiz-opt";
        if (done !== undefined) {
          cls += j === q.a ? " right" : (done === j ? " wrong" : "");
        }
        return '<button class="' + cls + '" data-qi="' + i + '" data-oi="' + j + '"' + (done !== undefined ? " disabled" : "") + '><span class="opt-key">' + "ABCD".charAt(j) + '</span><span>' + esc(o) + '</span></button>';
      }).join("");
      html += '</div><div class="quiz-explain' + (done !== undefined ? " show" : "") + '">解析：' + esc(q.e) + "</div></div>";
      return html;
    }).join("");
    quizRight = Object.keys(quizDone).filter(function (k) { return quizDone[k] === QUIZ[k].a; }).length;
    document.getElementById("cqScore").textContent = quizRight;
    document.getElementById("cqBar").style.width = Math.round(Object.keys(quizDone).length / QUIZ.length * 100) + "%";
  }

  document.getElementById("cet6QuizZone").addEventListener("click", function (ev) {
    var btn = ev.target.closest(".quiz-opt");
    if (!btn || btn.disabled) return;
    var qi = +btn.dataset.qi;
    var oi = +btn.dataset.oi;
    quizDone[qi] = oi;
    localStorage.setItem(LS_DONE, JSON.stringify(quizDone));
    renderQuiz();
    if (oi === QUIZ[qi].a) window.MST_TOAST("回答正确 ✓");
  });

  document.getElementById("cet6Reset").addEventListener("click", function () {
    quizDone = {};
    localStorage.setItem(LS_DONE, "{}");
    renderQuiz();
    window.MST_TOAST("已重置，可以重新开始");
  });

  /* ============================================================
     SEC.02b 大纲总词表（四+六级 5278 词，来源: exam-data/CETVocabulary）
     ============================================================ */
  var FULL = window.MST_WORDS6_FULL || [];
  var fullPage = 0;
  var PAGE_SIZE = 300;

  function fullCats() {
    var seen = {};
    var list = [];
    FULL.forEach(function (x) { if (x.c && !seen[x.c]) { seen[x.c] = 1; list.push(x.c); } });
    return list.sort(function (a, b) { return a.localeCompare(b, "zh"); });
  }

  function initFullCatSelect() {
    var sel = document.getElementById("vFullCat");
    if (!sel) return;
    fullCats().forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      sel.appendChild(o);
    });
  }

  function fullFiltered() {
    var q = (document.getElementById("vFullSearch").value || "").trim().toLowerCase();
    var mode = document.getElementById("vFullFilter").value;
    var cat = document.getElementById("vFullCat").value;
    return FULL.filter(function (x) {
      if (mode === "six" && !x.s) return false;
      if (mode === "four" && x.s) return false;
      if (cat && x.c !== cat) return false;
      if (q && (x.w + " " + x.m).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  function renderFullList(reset) {
    var list = fullFiltered();
    var box = document.getElementById("vFullList");
    var more = document.getElementById("vFullMore");
    if (reset) fullPage = 0;
    var end = (fullPage + 1) * PAGE_SIZE;
    var slice = list.slice(0, end);
    if (!list.length) {
      box.innerHTML = '<div class="card" style="font-family:var(--mono); font-size:13px; color:var(--ink-3);">没有匹配的词 —— 换个关键词试试。</div>';
      more.style.display = "none";
      return;
    }
    box.innerHTML = slice.map(function (x, i) {
      return '<div style="display:flex; gap:12px; align-items:baseline; padding:9px 14px; border-bottom:1px dashed var(--grid-strong);' + (i % 2 ? ' background:rgba(31,45,39,.03);' : '') + '">' +
        '<span style="font-family:var(--mono); font-size:10px; color:var(--ink-3); min-width:36px; text-align:right;">' + (i + 1) + '</span>' +
        '<b style="font-family:var(--serif); font-size:16px; min-width:150px; display:inline-block;">' + esc(x.w) + (x.s ? ' <span style="color:var(--rust); font-size:12px;">★</span>' : "") + '</b>' +
        '<span style="font-family:var(--mono); font-size:10px; color:var(--ink-3); min-width:60px; display:inline-block;">词频 ' + x.f + '</span>' +
        '<span style="font-size:13px; color:var(--ink-2); flex:1;">' + esc(x.m) + '</span>' +
        '<span style="font-family:var(--mono); font-size:10px; color:var(--ink-3); white-space:nowrap;">' + esc(x.c) + '</span>' +
        '</div>';
    }).join("");
    more.style.display = end < list.length ? "inline-flex" : "none";
    if (end >= list.length) {
      more.style.display = "none";
    }
    var shown = '<p style="font-family:var(--mono); font-size:11px; color:var(--ink-3); margin-top:14px;">已显示 ' + slice.length + ' / ' + list.length + ' 词</p>';
    box.insertAdjacentHTML("beforeend", shown);
  }

  function switchVocabTab(tab) {
    var isCore = tab === "core";
    document.getElementById("vCoreZone").style.display = isCore ? "block" : "none";
    document.getElementById("vFullZone").style.display = isCore ? "none" : "block";
    document.getElementById("vTabCore").classList.toggle("on", isCore);
    document.getElementById("vTabFull").classList.toggle("on", !isCore);
    if (!isCore) renderFullList(true);
  }

  document.getElementById("vTabCore").addEventListener("click", function () { switchVocabTab("core"); });
  document.getElementById("vTabFull").addEventListener("click", function () { switchVocabTab("full"); });
  document.getElementById("vFullSearch").addEventListener("input", function () { renderFullList(true); });
  document.getElementById("vFullFilter").addEventListener("change", function () { renderFullList(true); });
  document.getElementById("vFullCat").addEventListener("change", function () { renderFullList(true); });
  document.getElementById("vFullMore").addEventListener("click", function () { fullPage++; renderFullList(false); });
  initFullCatSelect();

  /* ---------- 动态计数：数据更新后页面文案自动同步 ---------- */
  function syncCounts() {
    function set(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    }
    set("heroWCount", WORDS.length);
    set("heroFCount", FULL.length);
    set("heroECount", EXPRS.length);
    set("vocabCount", WORDS.length);
    set("vocabCount2", WORDS.length);
    set("fullCount", FULL.length);
    set("fullCount2", FULL.length);
    set("fullCount3", FULL.length);
    document.querySelectorAll(".dynWCount").forEach(function (el) { el.textContent = WORDS.length; });
    document.querySelectorAll(".dynQCount").forEach(function (el) { el.textContent = QUIZ.length; });
  }

  /* ---------- 初始渲染 ---------- */
  syncCounts();
  renderGrid();
  renderExpr();
  renderQuiz();
})();
