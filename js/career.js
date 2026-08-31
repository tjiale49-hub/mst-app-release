/* ============================================================
   分子语堂 · 化工求职中心 · 求职自测
   ============================================================ */
(function () {
  "use strict";

  var QUIZ = window.MST_Q_CAREER || [];
  var LS_KEY = "mst_career_quiz_done_v1";
  var done = {};
  try { done = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e) { done = {}; }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render() {
    var box = document.getElementById("careerQuizZone");
    box.innerHTML = QUIZ.map(function (q, i) {
      var d = done[i];
      var html = '<div class="card quiz-q" data-qi="' + i + '" style="padding:18px 20px;">' +
        '<div class="q-title"><span class="q-no">Q' + (i + 1) + '</span><span>' + esc(q.q) + '</span></div>' +
        '<div class="quiz-opts">';
      html += q.opts.map(function (o, j) {
        var cls = "quiz-opt";
        if (d !== undefined) {
          if (j === q.a) cls += " right";
          else if (d === j) cls += " wrong";
        }
        return '<button class="' + cls + '" data-qi="' + i + '" data-oi="' + j + '"' + (d !== undefined ? " disabled" : "") + '><span class="opt-key">' + "ABCD".charAt(j) + '</span><span>' + esc(o) + '</span></button>';
      }).join("");
      html += '</div><div class="quiz-explain' + (d !== undefined ? " show" : "") + '">解析：' + esc(q.e) + "</div></div>";
      return html;
    }).join("");
  }

  document.getElementById("careerQuizZone").addEventListener("click", function (ev) {
    var btn = ev.target.closest(".quiz-opt");
    if (!btn || btn.disabled) return;
    done[+btn.dataset.qi] = +btn.dataset.oi;
    localStorage.setItem(LS_KEY, JSON.stringify(done));
    render();
  });

  render();
})();
