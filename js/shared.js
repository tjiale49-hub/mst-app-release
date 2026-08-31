/* 分子语堂 · 共享脚本：导航注入、页脚注入、滚动显现动画、PWA Service Worker 注册 */
(function () {
  "use strict";

  var PAGE = document.body.dataset.page || "";

  /* ---------- Logo SVG（苯环六边形） ---------- */
  window.MST_LOGO = function (size) {
    return '<svg viewBox="0 0 48 48" width="' + (size || 42) + '" height="' + (size || 42) + '" aria-hidden="true">'
      + '<polygon points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5" fill="none" stroke="#1f2d27" stroke-width="2.6"/>'
      + '<polygon points="24,10 36,17 36,31 24,38 12,31 12,17" fill="none" stroke="#c24914" stroke-width="1.6" stroke-dasharray="3 3"/>'
      + '<text x="24" y="30" text-anchor="middle" font-family="STZhongsong,SimSun,serif" font-size="16" font-weight="900" fill="#1f2d27">分</text>'
      + '</svg>';
  };

  /* ---------- 导航 ---------- */
  var links = [
    { href: "index.html", key: "home", zh: "每日任务", en: "DAILY" },
    { href: "cet6.html", key: "cet6", zh: "六级备考", en: "CET-6" },
    { href: "chem.html", key: "chem", zh: "化工学习", en: "CHEMISTRY" },
    { href: "career.html", key: "career", zh: "化工求职", en: "CAREER" },
    { href: "english.html", key: "english", zh: "英语学习", en: "ENGLISH" },
    { href: "qa.html", key: "qa", zh: "AI 问答", en: "AI Q&A" },
    { href: "tools.html", key: "tools", zh: "工具下载", en: "TOOLS" }
  ];

  function buildNav() {
    var navHtml =
      '<nav class="nav">' +
      '<a class="nav-brand" href="index.html">' +
      '<span class="nav-logo">' + window.MST_LOGO(42) + '</span>' +
      '<span class="nav-title"><span class="zh">分子语堂</span><span class="en">MOLECULE &amp; MORPHEME</span></span>' +
      '</a>' +
      '<button class="nav-burger" id="navBurger" aria-label="菜单"><span></span><span></span><span></span></button>' +
      '<div class="nav-links" id="navLinks">' +
      links.map(function (l) {
        var active = l.key === PAGE ? ' class="active"' : "";
        return '<a href="' + l.href + '"' + active + ' data-key="' + l.key + '">' + l.zh + '</a>';
      }).join("") +
      '</div>' +
      '</nav>';
    var mount = document.getElementById("nav-mount");
    if (mount) { mount.outerHTML = navHtml; }

    var burger = document.getElementById("navBurger");
    var navLinks = document.getElementById("navLinks");
    if (burger && navLinks) {
      burger.addEventListener("click", function () {
        navLinks.classList.toggle("open");
      });
    }
  }

  /* ---------- 页脚 ---------- */
  function buildFooter() {
    if (document.body.dataset.noFooter) return;
    var html =
      '<footer class="footer">' +
      '<div class="footer-inner">' +
      '<div>' +
      '<div class="f-brand">' + window.MST_LOGO(38) +
      '<div><div class="f-zh">分子语堂</div><div class="f-en">MOLECULE &amp; MORPHEME STUDY HALL</div></div>' +
      '</div>' +
      '<p>化工 × 英语双轨学习 App：每日任务自动更新、打卡连击、云端进度同步、离线可用。以工程师的严谨治化学，以语言的韵律学英语。</p>' +
      '</div>' +
      '<div>' +
      '<h4>学习模块</h4>' +
      '<ul>' +
      '<li><a href="cet6.html">六级备考中心</a></li>' +
      '<li><a href="chem.html">化工原理与工艺</a></li>' +
      '<li><a href="career.html">化工求职中心</a></li>' +
      '<li><a href="english.html">词汇 · 语法 · 读写</a></li>' +
      '</ul>' +
      '</div>' +
      '<div>' +
      '<h4>实用工具</h4>' +
      '<ul>' +
      '<li><a href="qa.html">AI 智能问答</a></li>' +
      '<li><a href="tools.html">学习工具下载</a></li>' +
      '<li><a href="tools.html#calc">化工计算器</a></li>' +
      '<li><a href="tools.html#proxy">AI 代理部署脚本</a></li>' +
      '</ul>' +
      '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
      '<span>© 2026 分子语堂 MOLECULE &amp; MORPHEME</span>' +
      '<span>REV. B / SHEET NO. MST-002</span>' +
      '</div>' +
      '</footer>';
    var mount = document.getElementById("footer-mount");
    if (mount) { mount.outerHTML = html; }
  }

  /* ---------- 滚动显现 ---------- */
  function setupReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 简易 toast ---------- */
  window.MST_TOAST = function (text, type) {
    var t = document.createElement("div");
    t.textContent = text;
    t.style.cssText =
      "position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:999;" +
      "background:#1f2d27;color:#f4f0e4;padding:12px 22px;border:2px solid #1f2d27;" +
      "box-shadow:4px 4px 0 rgba(31,45,39,.35);font-family:var(--mono);font-size:13px;letter-spacing:.5px;" +
      "animation:msgIn .3s ease both;max-width:90vw;text-align:center;";
    if (type === "error") { t.style.background = "#c24914"; }
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .4s"; t.style.opacity = "0";
      setTimeout(function () { t.remove(); }, 420);
    }, 2600);
  };

  /* ---------- PWA Service Worker 注册 ---------- */
  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        /* 静默失败：本地 file:// 协议不支持 SW，不影响使用 */
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildNav();
    buildFooter();
    setupReveal();
    registerSW();
  });
})();
