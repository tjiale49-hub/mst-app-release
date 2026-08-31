/* ============================================================
   分子语堂 · 工具生成器
   全部在浏览器本地生成文件，无任何服务器依赖
   ============================================================ */
(function () {
  "use strict";

  function download(name, content, mime) {
    var blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  }

  /* ================= 1. Cloudflare Worker AI 代理 ================= */
  var WORKER = [
    "/* ============================================================",
    " * 分子语堂 · AI 接口代理 Worker（Cloudflare Workers 免费额度）",
    " * --------------------------------------------------------------",
    " * 作用：",
    " *   1. 解决浏览器直连 AI 接口的 CORS 跨域限制",
    " *   2. 可选：把 API Key 存在 Worker 环境变量里，浏览器永不接触密钥",
    " *   3. 完整透传流式（stream）响应，AI 问答室打字机效果不受影响",
    " *",
    " * 部署三步（无需命令行）：",
    " *   1. 打开 https://dash.cloudflare.com 注册/登录（免费）",
    " *   2. 左侧 Workers & Pages → Create → Create Worker → 部署后点「编辑代码」，",
    " *      粘贴本文件全部内容，保存并部署",
    " *   3. 在 Worker 的 Settings → Variables 里添加环境变量：",
    " *        TARGET_BASE = https://api.siliconflow.cn/v1   （要代理的服务商地址）",
    " *        API_KEY     = sk-xxx                          （可选，服务端密钥）",
    " *      保存后，Worker 地址形如 https://xxx.your-name.workers.dev",
    " *      在「分子语堂 AI 问答室 → 模型设置 → 自定义接口」中把 Base URL",
    " *      填为该地址即可。",
    " *",
    " * 命令行部署（可选）：在文件夹放一个 wrangler.toml：",
    " *   name = \"mst-ai-proxy\"",
    " *   main = \"mst-ai-proxy-worker.js\"",
    " *   compatibility_date = \"2024-01-01\"",
    " *   [vars]",
    " *   TARGET_BASE = \"https://api.siliconflow.cn/v1\"",
    " * 然后执行：npx wrangler deploy",
    " * ============================================================ */",
    "",
    "// 允许代理的服务商域名白名单（防止被滥用为开放代理）",
    "const ALLOWED_HOSTS = [",
    "  \"api.siliconflow.cn\",",
    "  \"open.bigmodel.cn\",",
    "  \"dashscope.aliyuncs.com\",",
    "  \"api.deepseek.com\",",
    "  \"api.moonshot.cn\"",
    "];",
    "",
    "const CORS = {",
    "  \"Access-Control-Allow-Origin\": \"*\",",
    "  \"Access-Control-Allow-Methods\": \"GET, POST, PUT, DELETE, OPTIONS\",",
    "  \"Access-Control-Allow-Headers\": \"Content-Type, Authorization\"",
    "};",
    "",
    "function json(obj, status) {",
    "  return new Response(JSON.stringify(obj), {",
    "    status: status || 200,",
    "    headers: Object.assign({ \"Content-Type\": \"application/json\" }, CORS)",
    "  });",
    "}",
    "",
    "export default {",
    "  async fetch(request, env) {",
    "    // CORS 预检",
    "    if (request.method === \"OPTIONS\") {",
    "      return new Response(null, { status: 204, headers: CORS });",
    "    }",
    "",
    "    const url = new URL(request.url);",
    "",
    "    // 健康检查",
    "    if (url.pathname === \"/\") {",
    "      return new Response(\"mst-ai-proxy running ✓\", { headers: CORS });",
    "    }",
    "",
    "    // 目标地址：环境变量 TARGET_BASE（必填）",
    "    const base = ((env && env.TARGET_BASE) || \"\").replace(/\\/+$/, \"\");",
    "    if (!base) {",
    "      return json({ error: \"未配置 TARGET_BASE 环境变量，请在 Worker 设置中添加\" }, 500);",
    "    }",
    "",
    "    let target;",
    "    try {",
    "      target = new URL(base);",
    "    } catch (e) {",
    "      return json({ error: \"TARGET_BASE 不是合法 URL：\" + base }, 500);",
    "    }",
    "    if (ALLOWED_HOSTS.indexOf(target.hostname) === -1) {",
    "      return json({ error: \"目标不在白名单：\" + target.hostname + \"（可自行在 ALLOWED_HOSTS 中添加）\" }, 403);",
    "    }",
    "",
    "    // 拼接上游地址：base + 原始路径",
    "    const upstream = base + url.pathname + url.search;",
    "",
    "    // 复制请求头；若配置了服务端密钥则替换 Authorization",
    "    const headers = new Headers(request.headers);",
    "    if (env && env.API_KEY) {",
    "      headers.set(\"Authorization\", \"Bearer \" + env.API_KEY);",
    "    }",
    "    headers.delete(\"host\");",
    "",
    "    // 转发（body 原样透传，流式响应自动保持流式）",
    "    let resp;",
    "    try {",
    "      resp = await fetch(upstream, {",
    "        method: request.method,",
    "        headers: headers,",
    "        body: request.body",
    "      });",
    "    } catch (e) {",
    "      return json({ error: \"上游请求失败：\" + e.message }, 502);",
    "    }",
    "",
    "    // 透传响应并附加 CORS 头",
    "    const out = new Response(resp.body, resp);",
    "    for (const k in CORS) out.headers.set(k, CORS[k]);",
    "    return out;",
    "  }",
    "};"
  ].join("\n");

  /* ================= 2. 化工原理速查手册 ================= */
  function handbookHTML() {
    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>化工原理速查手册 · 分子语堂</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\nbody{font-family:"Noto Sans SC","Microsoft YaHei",sans-serif;background:#f4f0e4;color:#1f2d27;line-height:1.75;padding:32px 18px 60px;background-image:linear-gradient(rgba(31,45,39,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(31,45,39,.05) 1px,transparent 1px);background-size:30px 30px}\n.wrap{max-width:900px;margin:0 auto}\nh1{font-family:"Noto Serif SC",STZhongsong,SimSun,serif;font-size:30px;letter-spacing:2px}\n.sub{font-family:Consolas,monospace;font-size:11px;color:#8b968f;letter-spacing:2px;margin:6px 0 20px}\nh2{font-family:"Noto Serif SC",STZhongsong,SimSun,serif;font-size:20px;margin:34px 0 12px;border-bottom:3px solid #1f2d27;padding-bottom:8px;letter-spacing:1px}\nh2 span{font-family:Consolas,monospace;font-size:11px;color:#c24914;letter-spacing:2px;margin-left:10px;font-weight:400}\ntable{width:100%;border-collapse:collapse;background:#fbf9f2;border:2px solid #1f2d27;font-size:13.5px}\nth{font-family:Consolas,monospace;font-size:11.5px;letter-spacing:1.5px;text-align:left;background:#1f2d27;color:#f4f0e4;padding:9px 12px}\ntd{padding:9px 12px;border-bottom:1px solid #ddd7c5;vertical-align:top}\ntr:nth-child(even) td{background:rgba(31,45,39,.03)}\n.fm{font-family:Consolas,monospace;background:#1f2d27;color:#f0ead6;padding:10px 14px;margin:10px 0;font-size:14px;overflow-x:auto}\n.note{font-size:12.5px;color:#55645c;margin-top:8px}\n.hz{height:10px;background:repeating-linear-gradient(-45deg,#c24914 0 12px,#1f2d27 12px 24px);margin:26px 0}\n@media print{body{background:none;padding:10px}}\n</style>\n</head>\n<body>\n<div class="wrap">\n<h1>化工原理速查手册</h1>\n<div class="sub">MOLECULE &amp; MORPHEME · UNIT OPERATIONS QUICK REFERENCE · REV.A</div>\n\n<h2>一、流体流动 <span>FLUID FLOW</span></h2>\n<div class="fm">连续性：u₁A₁ = u₂A₂</div>\n<div class="fm">伯努利：z₁ + p₁/ρg + u₁²/2g = z₂ + p₂/ρg + u₂²/2g + Σh_f</div>\n<div class="fm">雷诺数：Re = duρ/μ（&lt;2000 层流 / &gt;4000 湍流；层流 λ=64/Re）</div>\n<div class="fm">直管阻力：h_f = λ·(L/d)·(u²/2g)</div>\n<p class="note">泵扬程 H = 升举高度 + 两端静压差 + 动能差 + 管路总阻力。气蚀判据：NPSH安 ≥ NPSH需 + 0.5 m。</p>\n\n<h2>二、传热 <span>HEAT TRANSFER</span></h2>\n<div class="fm">傅里叶：Q = -λA(dT/dx)；平壁：Q = λAΔt/b</div>\n<div class="fm">总传热：Q = KAΔt_m，1/K = 1/α₁ + b/λ + 1/α₂ + R垢</div>\n<div class="fm">对数平均温差：Δt_m = (Δt大 - Δt小)/ln(Δt大/Δt小)</div>\n<p class="note">逆流 Δt_m ≥ 并流；换热器面积裕度常留 15%–25%。</p>\n\n<h2>三、蒸馏与精馏 <span>DISTILLATION</span></h2>\n<div class="fm">拉乌尔：p_A = p_A°·x_A；相对挥发度：α = (y/(1-y))/(x/(1-x))</div>\n<div class="fm">物料衡算：F = D + W；F·x_F = D·x_D + W·x_W</div>\n<div class="fm">回流比：R = L/D；经济回流比 ≈ (1.2–2)·R_min</div>\n<div class="fm">芬斯克（全回流最少理论板）：N_min = ln[x_D(1-x_W)/x_W(1-x_D)] / ln α</div>\n<p class="note">进料热状态 q：0 过热蒸气 → 1 饱和液体 → &gt;1 过冷液体。</p>\n\n<h2>四、吸收 <span>ABSORPTION</span></h2>\n<div class="fm">亨利定律：p* = E·x（E 越小越易溶）</div>\n<div class="fm">填料层高度：Z = H_OG · N_OG</div>\n<p class="note">气膜控制（易溶，如 NH₃-水）→ 增大气速；液膜控制（难溶，如 CO₂-水）→ 增大喷淋量。操作气速取液泛气速的 0.6–0.8 倍。</p>\n\n<h2>五、干燥 <span>DRYING</span></h2>\n<div class="fm">湿度：H = 0.622·p_v/(P - p_v)</div>\n<p class="note">恒速段＝表面汽化控制（看空气条件）；降速段＝内部迁移控制（看物料本身）。极限是平衡含水量。</p>\n\n<h2>六、反应工程 <span>REACTION ENGINEERING</span></h2>\n<div class="fm">阿伦尼乌斯：k = k₀·exp(-E_a/RT)</div>\n<p class="note">同体积下正级数反应 PFR 转化率 &gt; CSTR；需低浓度环境时选 CSTR（或多釜串联）。</p>\n\n<h2>七、常用数据 <span>DATA</span></h2>\n<table>\n<tr><th>项目</th><th>数值</th><th>项目</th><th>数值</th></tr>\n<tr><td>气体常数 R</td><td>8.314 J/(mol·K)</td><td>标况摩尔体积</td><td>22.4 L/mol</td></tr>\n<tr><td>标况温度</td><td>273.15 K</td><td>标况压力</td><td>101.325 kPa</td></tr>\n<tr><td>水比热（常温）</td><td>4.18 kJ/(kg·K)</td><td>水汽化潜热（100°C）</td><td>2257 kJ/kg</td></tr>\n<tr><td>水密度（4°C）</td><td>1000 kg/m³</td><td>空气密度（标况）</td><td>1.293 kg/m³</td></tr>\n<tr><td>1 atm</td><td>101.325 kPa = 1.0332 at</td><td>1 bar</td><td>100 kPa = 0.9869 atm</td></tr>\n<tr><td>1 kcal</td><td>4.187 kJ</td><td>1 hp</td><td>745.7 W</td></tr>\n</table>\n\n<div class="hz"></div>\n<p style="font-family:Consolas,monospace;font-size:11px;color:#8b968f">© 分子语堂 MOLECULE &amp; MORPHEME · 本手册由平台生成，可自由打印分享</p>\n</div>\n</body>\n</html>';
  }

  /* ================= 3. 离线计算器 ================= */
  function calcHTML() {
    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>化工计算器 · 分子语堂</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\nbody{font-family:"Noto Sans SC","Microsoft YaHei",sans-serif;background:#f4f0e4;color:#1f2d27;line-height:1.7;padding:32px 18px;background-image:linear-gradient(rgba(31,45,39,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(31,45,39,.05) 1px,transparent 1px);background-size:30px 30px}\n.wrap{max-width:880px;margin:0 auto}\nh1{font-family:"Noto Serif SC",STZhongsong,SimSun,serif;font-size:28px;letter-spacing:2px}\n.sub{font-family:Consolas,monospace;font-size:11px;color:#8b968f;letter-spacing:2px;margin:6px 0 28px}\n.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}\n@media(max-width:760px){.grid{grid-template-columns:1fr}}\n.panel{border:2px solid #1f2d27;background:#fbf9f2;box-shadow:4px 4px 0 rgba(31,45,39,.9);padding:20px}\n.panel h4{font-family:"Noto Serif SC",STZhongsong,SimSun,serif;font-size:17px;padding-bottom:10px;border-bottom:2px solid #1f2d27;margin-bottom:14px}\n.row{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}\n.row label{font-size:13px;font-weight:600;min-width:64px}\n.row input,.row select{flex:1;min-width:0;border:2px solid #1f2d27;background:#f4f0e4;padding:8px 10px;font-family:Consolas,monospace;font-size:13px;outline:none}\n.unit{font-family:Consolas,monospace;font-size:12px;color:#55645c;min-width:44px}\n.res{margin-top:12px;font-family:Consolas,monospace;background:#1f2d27;color:#f0ead6;padding:12px 16px;font-size:14px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}\n.res b{color:#f5c98a;font-size:17px}\n.hz{height:10px;background:repeating-linear-gradient(-45deg,#c24914 0 12px,#1f2d27 12px 24px);margin:28px 0}\n</style>\n</head>\n<body>\n<div class="wrap">\n<h1>化工计算器</h1>\n<div class="sub">MOLECULE &amp; MORPHEME · OFFLINE CHEM CALCULATOR</div>\n<div class="grid">\n<div class="panel"><h4>理想气体 PV = nRT</h4>\n<div class="row"><label>压力 P</label><input type="number" id="igP" value="101.325" step="any"><span class="unit">kPa</span></div>\n<div class="row"><label>体积 V</label><input type="number" id="igV" value="22.4" step="any"><span class="unit">L</span></div>\n<div class="row"><label>温度 t</label><input type="number" id="igT" value="0" step="any"><span class="unit">°C</span></div>\n<div class="res"><span>物质的量 n ≈</span><b id="igOut">—</b></div></div>\n<div class="panel"><h4>溶液稀释 C₁V₁ = C₂V₂</h4>\n<div class="row"><label>初始浓度</label><input type="number" id="diC1" value="1" step="any"><span class="unit">mol/L</span></div>\n<div class="row"><label>初始体积</label><input type="number" id="diV1" value="100" step="any"><span class="unit">mL</span></div>\n<div class="row"><label>目标浓度</label><input type="number" id="diC2" value="0.1" step="any"><span class="unit">mol/L</span></div>\n<div class="res"><span>需加水至 V₂ ≈</span><b id="diOut">—</b></div></div>\n<div class="panel"><h4>压力单位换算</h4>\n<div class="row"><label>数值</label><input type="number" id="prIn" value="1" step="any">\n<select id="prUnit"><option>MPa</option><option>kPa</option><option>bar</option><option>atm</option><option>psi</option><option>mmHg</option></select></div>\n<div class="res" style="display:block;line-height:2"><div>MPa <b id="prA">—</b></div><div>kPa <b id="prB">—</b></div><div>bar <b id="prC">—</b></div><div>atm <b id="prD">—</b></div><div>psi <b id="prE">—</b></div></div></div>\n<div class="panel"><h4>温度换算</h4>\n<div class="row"><label>数值</label><input type="number" id="tmIn" value="25" step="any">\n<select id="tmUnit"><option value="C">°C 摄氏</option><option value="F">°F 华氏</option><option value="K">K 开尔文</option></select></div>\n<div class="res" style="display:block;line-height:2"><div>°C <b id="tmA">—</b></div><div>°F <b id="tmB">—</b></div><div>K <b id="tmC">—</b></div></div></div>\n</div>\n<div class="hz"></div>\n<p style="font-family:Consolas,monospace;font-size:11px;color:#8b968f">© 分子语堂 MOLECULE &amp; MORPHEME · 离线可用，计算结果请自行复核</p>\n</div>\n<script>\nvar R=8.314;\nfunction fmt(n){if(!isFinite(n))return "—";var v=+n.toPrecision(4);return(Math.abs(v)>=1e5||(Math.abs(v)<1e-4&&v!==0))?v.toExponential(3):String(+v.toFixed(4)).replace(/\\.?0+$/,"")}\nfunction ig(){var P=+igP.value,V=+igV.value,T=+igT.value+273.15;igOut.textContent=fmt(P*V/(R*T))+" mol"}\nfunction di(){var C1=+diC1.value,V1=+diV1.value,C2=+diC2.value;diOut.textContent=(C2>0)?fmt(C1*V1/C2)+" mL":"—"}\nvar PR={MPa:1000,kPa:1,bar:100,atm:101.325,psi:6.8948,mmHg:0.13332};\nfunction pr(){var v=+prIn.value*PR[prUnit.value];prA.textContent=fmt(v/1000);prB.textContent=fmt(v);prC.textContent=fmt(v/100);prD.textContent=fmt(v/101.325);prE.textContent=fmt(v/6.8948)}\nfunction tm(){var v=+tmIn.value,u=tmUnit.value;var c=u==="C"?v:u==="F"?(v-32)*5/9:v-273.15;tmA.textContent=fmt(c);tmB.textContent=fmt(c*9/5+32);tmC.textContent=fmt(c+273.15)}\n["igP","igV","igT"].forEach(function(i){document.getElementById(i).addEventListener("input",ig)});\n["diC1","diV1","diC2"].forEach(function(i){document.getElementById(i).addEventListener("input",di)});\nprIn.addEventListener("input",pr);prUnit.addEventListener("change",pr);\ntmIn.addEventListener("input",tm);tmUnit.addEventListener("change",tm);\nig();di();pr();tm();\n<\/script>\n</body>\n</html>';
  }

  /* ================= 4. 化工英语术语表 CSV ================= */
  var TERMS = [
    ["流体", "fluid", "流体力学基础"], ["流速", "velocity / flow velocity", ""], ["流量", "flow rate", "体积流量 volumetric flow rate"],
    ["管道", "pipe / pipeline", ""], ["阀门", "valve", "控制阀 control valve"], ["泵", "pump", ""],
    ["离心泵", "centrifugal pump", ""], ["扬程", "head", "单位 m"], ["黏度", "viscosity", ""],
    ["密度", "density", ""], ["压力", "pressure", ""], ["表压 / 绝压", "gauge / absolute pressure", ""],
    ["层流", "laminar flow", "Re<2000"], ["湍流", "turbulent flow", "Re>4000"], ["雷诺数", "Reynolds number", ""],
    ["阻力损失", "friction loss / pressure drop", ""], ["气蚀", "cavitation", "泵入口低压"], ["孔板流量计", "orifice meter", ""],
    ["转子流量计", "rotameter", ""], ["压缩机", "compressor", ""], ["风机", "fan / blower", ""],
    ["热传导", "conduction", ""], ["对流传热", "convection", ""], ["热辐射", "radiation", ""],
    ["导热系数", "thermal conductivity", "λ，W/(m·K)"], ["传热系数", "heat transfer coefficient", "α 或 K"],
    ["换热器", "heat exchanger", ""], ["列管式换热器", "shell-and-tube exchanger", ""], ["板式换热器", "plate heat exchanger", ""],
    ["逆流 / 并流", "counter-current / co-current", ""], ["热通量", "heat flux", ""], ["污垢热阻", "fouling resistance", ""],
    ["保温层", "insulation / lagging", ""], ["热阻", "thermal resistance", "类比电阻"],
    ["蒸馏", "distillation", ""], ["精馏", "rectification", "连续多级蒸馏"], ["气液平衡", "vapor-liquid equilibrium", "VLE"],
    ["拉乌尔定律", "Raoult's law", ""], ["相对挥发度", "relative volatility", "α"], ["易挥发组分", "more volatile component", "MVC"],
    ["理论板", "theoretical plate / stage", "平衡级"], ["回流", "reflux", ""], ["回流比", "reflux ratio", "R=L/D"],
    ["再沸器", "reboiler", ""], ["冷凝器", "condenser", ""], ["塔板", "tray / plate", ""],
    ["填料", "packing", ""], ["精馏段 / 提馏段", "rectifying / stripping section", ""], ["进料", "feed", "q 线"],
    ["共沸物", "azeotrope", "恒沸物"], ["侧线采出", "side draw", ""],
    ["吸收", "absorption", ""], ["解吸 / 脱吸", "stripping / desorption", "吸收逆过程"], ["亨利定律", "Henry's law", "p*=Ex"],
    ["溶解度", "solubility", ""], ["气膜 / 液膜", "gas film / liquid film", "双膜理论"], ["填料塔", "packed column", ""],
    ["板式塔", "tray column", ""], ["液泛", "flooding", "操作上限"], ["持液量", "liquid holdup", ""],
    ["喷淋密度", "spraying density", ""], ["传质单元", "transfer unit", "NTU/HTU"], ["比表面积", "specific surface area", "填料参数"],
    ["吸收剂", "absorbent / solvent", ""], ["溶质", "solute", ""], ["惰性气体", "inert gas", ""],
    ["干燥", "drying", ""], ["湿度", "humidity / humidity ratio", "H"], ["相对湿度", "relative humidity", "φ"],
    ["干球 / 湿球温度", "dry / wet-bulb temperature", ""], ["露点", "dew point", ""], ["临界含水量", "critical moisture content", ""],
    ["自由水分 / 平衡水分", "free / equilibrium moisture", ""], ["干燥速率", "drying rate", ""],
    ["气流干燥器", "pneumatic dryer", ""], ["流化床", "fluidized bed", ""], ["喷雾干燥", "spray drying", ""],
    ["反应器", "reactor", ""], ["间歇反应器", "batch reactor", "BRT"], ["全混流反应器", "continuous stirred-tank reactor", "CSTR"],
    ["平推流反应器", "plug flow reactor", "PFR"], ["停留时间", "residence time", "分布 RTD"], ["转化率", "conversion", "X"],
    ["收率", "yield", ""], ["选择性", "selectivity", ""], ["反应速率", "reaction rate", "r"],
    ["活化能", "activation energy", "Ea"], ["催化剂", "catalyst", ""], ["催化剂中毒", "catalyst poisoning", "失活"],
    ["空速", "space velocity", "SV"], ["放热 / 吸热反应", "exothermic / endothermic reaction", ""], ["热点", "hot spot", "失控隐患"],
    ["放大", "scale-up", "实验→工业"], ["失活", "deactivation", ""],
    ["蒸发", "evaporation", ""], ["多效蒸发", "multi-effect evaporation", ""], ["萃取", "extraction", "液液 solvent extraction"],
    ["结晶", "crystallization", "过饱和度驱动"], ["过滤", "filtration", ""], ["沉降", "sedimentation / settling", ""],
    ["离心分离", "centrifugation", ""], ["膜分离", "membrane separation", ""], ["反渗透", "reverse osmosis", "RO"],
    ["吸附", "adsorption", "注意与吸收区别"],
    ["塔 / 塔", "column / tower", ""], ["储罐", "tank / vessel", ""], ["搅拌器", "agitator / stirrer", ""],
    ["法兰", "flange", ""], ["垫片", "gasket", ""], ["流量计", "flowmeter", ""], ["变送器", "transmitter", ""],
    ["联锁", "interlock", "安全仪表"],
    ["安全阀", "safety / relief valve", ""], ["爆炸下限 / 上限", "LEL / UEL", "lower/upper explosion limit"], ["闪点", "flash point", ""],
    ["自燃点", "auto-ignition temperature", ""], ["毒性", "toxicity", ""], ["腐蚀性", "corrosivity", ""],
    ["泄漏", "leak / leakage", ""], ["通风", "ventilation", ""], ["惰化", "inerting", "氮气置换"],
    ["个人防护装备", "PPE (personal protective equipment)", ""], ["废水 / 废气 / 固废", "wastewater / waste gas / solid waste", "三废"],
    ["排放标准", "emission / discharge standard", ""], ["危险化学品", "hazardous chemical", "HazMat"]
  ];

  /* ================= 5. Anki 词库 CSV（数据源：window.MST_WORDS6 主词库） ================= */

  /* ================= 6. 学习计划模板 ================= */
  var PLAN = [
    "# 分子语堂 · 双轨学习计划（周模板）",
    "",
    "> 化工为骨，英语为翼 —— 每周循环推进，12 周为一个完整周期。",
    "",
    "## 本周目标",
    "",
    "- 化工：□ 掌握《＿＿＿＿》章节，完成全部公式卡",
    "- 英语：□ 掌握 ＿＿ 张闪卡 + ＿＿ 个语法点",
    "- 交叉：□ 精读 1 篇英文文献（IMRAD 结构笔记）",
    "",
    "## 每日打卡",
    "",
    "| 日期 | 化工（45 min） | 英语（45 min） | 备注 |",
    "| ---- | -------------- | -------------- | ---- |",
    "| 周一 | □ 阅读新章节 | □ 闪卡新词 ×12 |  |",
    "| 周二 | □ 公式推导 1 遍 | □ 语法专题 1 个 |  |",
    "| 周三 | □ 例题 3 道 | □ 精读 30 min |  |",
    "| 周四 | □ 章节测验 ≥80% | □ 闪卡复习（1 天前） |  |",
    "| 周五 | □ 错题复盘 | □ 写作练习 1 段 |  |",
    "| 周六 | □ 化工英语 ESP 专题 | □ AI 问答批改作文 |  |",
    "| 周日 | □ 周复盘 + 下周计划 | □ 闪卡总复习 |  |",
    "",
    "## 艾宾浩斯复习节点",
    "",
    "| 学习日 | 第 1 次复习 | 第 2 次复习 | 第 3 次复习 | 第 4 次复习 |",
    "| ------ | ---------- | ---------- | ---------- | ---------- |",
    "| 周一   | 周二       | 周四       | 下周一     | 下下周一   |",
    "| 周三   | 周四       | 周六       | 下周三     | 下下周三   |",
    "",
    "## 错题 / 生词本",
    "",
    "### 化工错题",
    "1. [ ] 题目：＿＿＿＿　错因：概念不清 / 计算失误 / 公式误用",
    "",
    "### 英语生词",
    "1. [ ] 单词：＿＿＿＿　搭配：＿＿＿＿　例句：＿＿＿＿",
    "",
    "## 周末复盘三问",
    "",
    "1. 本周哪个知识点让我卡壳最久？下周怎么补？",
    "2. 化工与英语的交叉学习（术语、文献）完成度如何？",
    "3. 用 AI 问答解决了哪些问题？还遗留哪些？",
    "",
    "---",
    "",
    "*模板来自「分子语堂」工具站 · 复制到 Obsidian / Typora / 语雀 即可使用*"
  ].join("\n");

  /* ================= 7. 六级备考资料包（单文件 HTML） ================= */
  function cet6PackHTML() {
    var W = window.MST_WORDS6 || [];
    var E = window.MST_CN_EXPR || [];
    var Q = window.MST_Q_CET6 || [];
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    var wordsTR = W.map(function (w) {
      return '<tr><td><b>' + esc(w.w) + "</b><br><small>" + esc(w.p) + "</small></td><td>" + esc(w.m) + "</td><td>" + w.e + "</td></tr>";
    }).join("\n");
    var exprRows = E.map(function (x) { return "<tr><td>" + esc(x[0]) + "</td><td>" + esc(x[1]) + "</td></tr>"; }).join("\n");
    var quizRows = Q.map(function (q, i) {
      return '<div class="q"><b>Q' + (i + 1) + ". " + esc(q.q) + "</b><br>" +
        q.opts.map(function (o, j) { return (j === q.a ? "✔ " : "　") + "ABCD".charAt(j) + ". " + esc(o); }).join("<br>") +
        '<br><small>解析：' + esc(q.e) + "</small></div>";
    }).join("\n");
    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>六级备考资料包 · 分子语堂</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\nbody{font-family:"Noto Sans SC","Microsoft YaHei",sans-serif;background:#f4f0e4;color:#1f2d27;line-height:1.75;padding:32px 18px 60px;background-image:linear-gradient(rgba(31,45,39,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(31,45,39,.05) 1px,transparent 1px);background-size:30px 30px}\n.wrap{max-width:920px;margin:0 auto}\nh1{font-family:"Noto Serif SC",STZhongsong,SimSun,serif;font-size:30px;letter-spacing:2px}\n.sub{font-family:Consolas,monospace;font-size:11px;color:#8b968f;letter-spacing:2px;margin:6px 0 24px}\nh2{font-family:"Noto Serif SC",STZhongsong,SimSun,serif;font-size:20px;margin:34px 0 12px;border-bottom:3px solid #1f2d27;padding-bottom:8px;letter-spacing:1px}\nh2 span{font-family:Consolas,monospace;font-size:11px;color:#c24914;letter-spacing:2px;margin-left:10px;font-weight:400}\ntable{width:100%;border-collapse:collapse;background:#fbf9f2;border:2px solid #1f2d27;font-size:13px}\nth{font-family:Consolas,monospace;font-size:11.5px;letter-spacing:1.5px;text-align:left;background:#1f2d27;color:#f4f0e4;padding:8px 12px}\ntd{padding:8px 12px;border-bottom:1px solid #ddd7c5;vertical-align:top}\ntr:nth-child(even) td{background:rgba(31,45,39,.03)}\ntd b{font-size:15px}small{color:#55645c}\n.fm{font-family:Consolas,monospace;background:#1f2d27;color:#f0ead6;padding:10px 14px;margin:10px 0;font-size:13.5px}\n.note{font-size:12.5px;color:#55645c;margin-top:8px}\n.q{border:2px solid #1f2d27;background:#fbf9f2;box-shadow:3px 3px 0 rgba(31,45,39,.85);padding:14px 18px;margin:14px 0}\n.q small{display:block;margin-top:8px;color:#c24914}\nul{padding-left:22px;font-size:13.5px}\nli{margin:5px 0}\n.hz{height:10px;background:repeating-linear-gradient(-45deg,#c24914 0 12px,#1f2d27 12px 24px);margin:26px 0}\n@media print{body{background:none;padding:10px}}\n</style>\n</head>\n<body>\n<div class="wrap">\n<h1>六级备考资料包</h1>\n<div class="sub">CET-6 COMPLETE PACK · WORDS + EXPRESSIONS + ESSAY + QUIZ · 一次性打包离线版</div>\n\n<h2>一、考试结构速览 <span>STRUCTURE</span></h2>\n<table>\n<tr><th>模块</th><th>分值</th><th>时长</th><th>要点</th></tr>\n<tr><td>写作</td><td>106.5（15%）</td><td>30 min</td><td>议论文/应用文，开考即写</td></tr>\n<tr><td>听力</td><td>248.5（35%）</td><td>25 min</td><td>只放一遍，边听边涂卡</td></tr>\n<tr><td>阅读</td><td>248.5（35%）</td><td>40 min</td><td>仔细阅读优先保证正确率</td></tr>\n<tr><td>翻译</td><td>106.5（15%）</td><td>30 min</td><td>汉译英 180–200 词，中国文化为主</td></tr>\n</table>\n\n<h2>二、' + W.length + ' 高频词全表 <span>HIGH-FREQUENCY WORDS</span></h2>\n<table>\n<tr><th style="width:130px">单词</th><th style="width:200px">释义</th><th>化工/科技语境例句</th></tr>\n' + wordsTR + '\n</table>\n\n<h2>三、翻译表达库 · 中国文化（' + E.length + ' 条） <span>EXPRESSION BANK</span></h2>\n<table>\n<tr><th style="width:120px">中文</th><th>English</th></tr>\n' + exprRows + '\n</table>\n\n<h2>四、写作万能框架 + 高分句型 <span>WRITING</span></h2>\n<div class="fm">三段式：引出话题（3句）→ 论证展开（5–6句，论点+例证×2）→ 总结升华（2–3句）</div>\n<ul>\n<li>It is universally acknowledged that…（公认）</li>\n<li>Only in this way can we…（only 倒装加分项）</li>\n<li>So + adj. + be the problem that…（倒装强调）</li>\n<li>It is not until… that…（强调句）</li>\n<li>A case in point is…（举例）</li>\n<li>Were it not for…, …would…（虚拟语气）</li>\n<li>In conclusion, it is imperative that…（收尾）</li>\n</ul>\n\n<h2>五、60 天冲刺四阶段 <span>60-DAY PLAN</span></h2>\n<ul>\n<li><b>第 1–15 天 筑基</b>：每天 40 词 + 1 篇五步精听 + 1 篇仔细阅读（不计时）</li>\n<li><b>第 16–35 天 强化</b>：听力讲座逐套刷 + 每天 2 篇阅读计时 + 每周 2 篇翻译 1 篇写作</li>\n<li><b>第 36–52 天 模考</b>：每周 2 套整卷下午 3 点开考，当天复盘错题</li>\n<li><b>第 53–60 天 冲刺</b>：只看错题本、生词本、表达库与作文模板</li>\n</ul>\n<div class="note">听力五步精听法：盲听 → 逐句听写 → 对照原文标错 → 跟读模仿 → 脱稿重听。</div>\n\n<h2>六、随卷自测 ' + Q.length + ' 题 <span>QUIZ</span></h2>\n' + quizRows + '\n\n<div class="hz"></div>\n<p style="font-family:Consolas,monospace;font-size:11px;color:#8b968f">© 分子语堂 MOLECULE &amp; MORPHEME · 与线上六级备考中心同步 · 可自由打印分享</p>\n</div>\n</body>\n</html>';
  }

  /* ================= 8. 化工求职资料包（单文件 HTML） ================= */
  function careerPackHTML() {
    var T = window.MST_CAREER_TIPS || [];
    var Q = window.MST_Q_CAREER || [];
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    var tipRows = T.map(function (x, i) { return "<tr><td>" + (i + 1) + "</td><td><b>" + esc(x.t) + "</b></td><td>" + esc(x.d) + "</td></tr>"; }).join("\n");
    var quizRows = Q.map(function (q, i) {
      return '<div class="q"><b>Q' + (i + 1) + ". " + esc(q.q) + "</b><br>" +
        q.opts.map(function (o, j) { return (j === q.a ? "✔ " : "　") + "ABCD".charAt(j) + ". " + esc(o); }).join("<br>") +
        '<br><small>解析：' + esc(q.e) + "</small></div>";
    }).join("\n");
    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>化工求职资料包 · 分子语堂</title>\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\nbody{font-family:"Noto Sans SC","Microsoft YaHei",sans-serif;background:#f4f0e4;color:#1f2d27;line-height:1.75;padding:32px 18px 60px;background-image:linear-gradient(rgba(31,45,39,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(31,45,39,.05) 1px,transparent 1px);background-size:30px 30px}\n.wrap{max-width:920px;margin:0 auto}\nh1{font-family:"Noto Serif SC",STZhongsong,SimSun,serif;font-size:30px;letter-spacing:2px}\n.sub{font-family:Consolas,monospace;font-size:11px;color:#8b968f;letter-spacing:2px;margin:6px 0 24px}\nh2{font-family:"Noto Serif SC",STZhongsong,SimSun,serif;font-size:20px;margin:34px 0 12px;border-bottom:3px solid #1f2d27;padding-bottom:8px;letter-spacing:1px}\nh2 span{font-family:Consolas,monospace;font-size:11px;color:#c24914;letter-spacing:2px;margin-left:10px;font-weight:400}\ntable{width:100%;border-collapse:collapse;background:#fbf9f2;border:2px solid #1f2d27;font-size:13px}\nth{font-family:Consolas,monospace;font-size:11.5px;letter-spacing:1.5px;text-align:left;background:#1f2d27;color:#f4f0e4;padding:8px 12px}\ntd{padding:8px 12px;border-bottom:1px solid #ddd7c5;vertical-align:top}\ntr:nth-child(even) td{background:rgba(31,45,39,.03)}\nul{padding-left:22px;font-size:13.5px}\nli{margin:5px 0}\n.q{border:2px solid #1f2d27;background:#fbf9f2;box-shadow:3px 3px 0 rgba(31,45,39,.85);padding:14px 18px;margin:14px 0}\n.q small{display:block;margin-top:8px;color:#c24914}\n.fm{font-family:Consolas,monospace;background:#1f2d27;color:#f0ead6;padding:10px 14px;margin:10px 0;font-size:13.5px}\n.hz{height:10px;background:repeating-linear-gradient(-45deg,#c24914 0 12px,#1f2d27 12px 24px);margin:26px 0}\n@media print{body{background:none;padding:10px}}\n</style>\n</head>\n<body>\n<div class="wrap">\n<h1>化工求职资料包</h1>\n<div class="sub">CHEMICAL ENGINEERING CAREER PACK · JOBS + SKILLS + RESUME + INTERVIEW · 离线版</div>\n\n<h2>一、十大岗位方向速览 <span>JOB MAP</span></h2>\n<table>\n<tr><th>方向</th><th>做什么</th><th>应届起点</th></tr>\n<tr><td>工艺工程师</td><td>工艺设计/优化/开车，P&amp;ID、物料衡算</td><td>8–12k</td></tr>\n<tr><td>研发工程师</td><td>产品/催化剂/材料开发（多需硕士）</td><td>10–15k</td></tr>\n<tr><td>生产/车间管理</td><td>DCS 操作、巡检、异常处置（倒班）</td><td>6–10k</td></tr>\n<tr><td>安全 HSE</td><td>风险管理、HAZOP、合规（注安是硬通货）</td><td>7–11k</td></tr>\n<tr><td>质量 QA/QC</td><td>QC 检测分析 / QA 体系（药企主场）</td><td>7–10k</td></tr>\n<tr><td>设备工程师</td><td>泵/换热器/塔器选型与检修</td><td>7–11k</td></tr>\n<tr><td>设计院</td><td>基础/详细设计（学历内卷）</td><td>10–14k</td></tr>\n<tr><td>技术销售/FAE</td><td>帮客户选型，提成上不封顶</td><td>底薪+提成</td></tr>\n<tr><td>新能源/新材料</td><td>锂电材料、氢能、CCUS、电子化学品</td><td>10–15k</td></tr>\n<tr><td>交叉转行</td><td>专利代理、环评、ESG、数字化</td><td>跨度大</td></tr>\n</table>\n\n<h2>二、技能补强三级清单 <span>SKILL MATRIX</span></h2>\n<ul>\n<li><b>TIER 1 通用</b>：化工原理（重算轻背）· Aspen（跑通一条完整流程）· CAD（画 PFD）· Excel 进阶 · 六级 425+ · 安全意识</li>\n<li><b>TIER 2 分岗</b>：研发→四大化学+表征；工艺→P&amp;ID+衡算+设备设计；质量→GMP+HPLC；设备→API/TEMA/GB150；安全→危化品条例+JSA；新能源→电化学</li>\n<li><b>TIER 3 加分</b>：Python 数据分析 · 一页作品集 · 注册化工基础 · 六西格玛 DMAIC · P&amp;ID 图例量 · 英文 MSDS 精读</li>\n</ul>\n\n<h2>三、简历量化公式 <span>RESUME</span></h2>\n<div class="fm">动词开头 + 你做了什么 + 数字收尾</div>\n<ul>\n<li>❌ 参与了换热器改造 → ✔ 核算 K 值提出螺纹管方案，传热面积减少 18%</li>\n<li>❌ 负责实验室管理 → ✔ 建立试剂台账，盘点耗时 3h→40min</li>\n<li>❌ 学习了 Aspen → ✔ 复现甲醇精馏工艺，模拟与文献偏差 &lt;5%</li>\n<li>骨架：教育背景 → 技能清单 → 2 段量化项目 → 荣誉证书（一页纸）</li>\n</ul>\n\n<h2>四、技术面高频八题 <span>INTERVIEW</span></h2>\n<ul>\n<li>讲讲精馏原理（画平衡线+操作线）</li>\n<li>换热器设计步骤（负荷→K→LMTD→面积→裕度）</li>\n<li>层流湍流判断，Re 物理意义</li>\n<li>易溶气体吸收阻力在哪侧？怎么强化？</li>\n<li>CSTR 与 PFR 区别及选型</li>\n<li>强放热反应防热点失控措施</li>\n<li>HAZOP 与引导词方法</li>\n<li>讲一段失败经历与复盘</li>\n</ul>\n<div class="fm">STAR：情境-任务-行动-结果 · 60% 篇幅给"我做了什么"</div>\n\n<h2>五、' + T.length + ' 条求职锦囊全表 <span>CAREER TIPS</span></h2>\n<table>\n<tr><th style="width:36px">#</th><th style="width:110px">主题</th><th>内容</th></tr>\n' + tipRows + '\n</table>\n\n<h2>六、求职自测 ' + Q.length + ' 题 <span>QUIZ</span></h2>\n' + quizRows + '\n\n<div class="hz"></div>\n<p style="font-family:Consolas,monospace;font-size:11px;color:#8b968f">© 分子语堂 MOLECULE &amp; MORPHEME · 与线上求职中心同步 · 薪资为参考区间，因城市而异</p>\n</div>\n</body>\n</html>';
  }

  /* ================= 9. 进度同步 Worker（Cloudflare KV） ================= */
  var SYNC_WORKER = [
    "/* ============================================================",
    " * 分子语堂 · 学习进度云端同步 Worker（Cloudflare Workers + KV）",
    " * --------------------------------------------------------------",
    " * 作用：多设备同步学习进度（每日任务、生词本、测验记录等），",
    " *       数据存在你自己的 Cloudflare KV 里，只有你可见。",
    " *",
    " * 部署四步（无需命令行）：",
    " *   1. 打开 https://dash.cloudflare.com 注册/登录（免费）",
    " *   2. 左侧 Storage & Databases → KV → Create namespace，",
    " *      名字填 mst_progress，创建后记住 Namespace ID",
    " *   3. 左侧 Workers & Pages → Create → Create Worker → 部署后",
    " *      点「编辑代码」，粘贴本文件全部内容，保存并部署",
    " *   4. Worker 的 Settings → Variables and Secrets：",
    " *      添加 Bindings（KV Namespace Bindings）：",
    " *        Variable name = PROGRESS  → 选择刚建的 mst_progress",
    " *      （可选）添加环境变量 AUTH_KEY = 你的口令，防止他人读写",
    " *",
    " * 使用：回到「分子语堂」首页，点「上传进度到云端」时填入",
    " *       Worker 地址（形如 https://xxx.your-name.workers.dev）",
    " *       与口令即可。之后任何设备打开网站都能拉取进度。",
    " * ============================================================ */",
    "",
    "const CORS = {",
    "  \"Access-Control-Allow-Origin\": \"*\",",
    "  \"Access-Control-Allow-Methods\": \"GET, POST, OPTIONS\",",
    "  \"Access-Control-Allow-Headers\": \"Content-Type, X-Auth\"",
    "};",
    "",
    "function json(obj, status) {",
    "  return new Response(JSON.stringify(obj), {",
    "    status: status || 200,",
    "    headers: Object.assign({ \"Content-Type\": \"application/json\" }, CORS)",
    "  });",
    "}",
    "",
    "export default {",
    "  async fetch(request, env) {",
    "    if (request.method === \"OPTIONS\") {",
    "      return new Response(null, { status: 204, headers: CORS });",
    "    }",
    "",
    "    const url = new URL(request.url);",
    "",
    "    if (url.pathname === \"/\") {",
    "      return new Response(\"mst-progress-sync running ✓\", { headers: CORS });",
    "    }",
    "",
    "    if (url.pathname !== \"/progress\") {",
    "      return json({ error: \"not found\" }, 404);",
    "    }",
    "",
    "    // 口令校验：设置 AUTH_KEY 后必须匹配（不设置则放行）",
    "    if (env.AUTH_KEY && request.headers.get(\"X-Auth\") !== env.AUTH_KEY) {",
    "      return json({ error: \"unauthorized\" }, 401);",
    "    }",
    "",
    "    if (!env.PROGRESS) {",
    "      return json({ error: \"未绑定 KV：请在 Worker 设置里添加名为 PROGRESS 的 KV 绑定\" }, 500);",
    "    }",
    "",
    "    if (request.method === \"POST\") {",
    "      // 上传进度快照",
    "      let body;",
    "      try {",
    "        body = await request.json();",
    "      } catch (e) {",
    "        return json({ error: \"invalid json\" }, 400);",
    "      }",
    "      if (!body || typeof body !== \"object\" || !body.data) {",
    "        return json({ error: \"missing data\" }, 400);",
    "      }",
    "      const stamp = {",
    "        device: (body.device || \"unknown\").slice(0, 80),",
    "        time: body.time || Date.now(),",
    "        data: body.data",
    "      };",
    "      await env.PROGRESS.put(\"snapshot\", JSON.stringify(stamp));",
    "      return json({ ok: true, saved: Object.keys(stamp.data).length, time: stamp.time });",
    "    }",
    "",
    "    if (request.method === \"GET\") {",
    "      // 拉取最新快照",
    "      const raw = await env.PROGRESS.get(\"snapshot\");",
    "      if (!raw) return json({ error: \"云端暂无进度\" }, 404);",
    "      return json(JSON.parse(raw));",
    "    }",
    "",
    "    return json({ error: \"method not allowed\" }, 405);",
    "  }",
    "};"
  ].join("\n");

  /* ================= 绑定下载 ================= */
  /* ---------- 动态计数：数据更新后页面文案自动同步 ---------- */
  function syncCounts() {
    function set(cls, val) {
      document.querySelectorAll("." + cls).forEach(function (el) { el.textContent = val; });
    }
    set("dynWCount", (window.MST_WORDS6 || []).length);
    set("dynECount", (window.MST_CN_EXPR || []).length);
    set("dynQCount", (window.MST_Q_CET6 || []).length);
    set("dynCTipsCount", (window.MST_CAREER_TIPS || []).length);
    set("dynQCareerCount", (window.MST_Q_CAREER || []).length);
    set("dynTermsCount", TERMS.length);
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncCounts();
    document.querySelectorAll("[data-tool]").forEach(function (card) {
      var btn = card.querySelector("button");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var t = card.dataset.tool;
        if (t === "proxy") {
          download("mst-ai-proxy-worker.js", WORKER, "text/javascript;charset=utf-8");
          window.MST_TOAST("已下载 Worker 脚本 · 按文件头部说明部署");
        } else if (t === "handbook") {
          download("化工原理速查手册.html", handbookHTML(), "text/html;charset=utf-8");
          window.MST_TOAST("已下载速查手册 · 双击即可打开");
        } else if (t === "calcx") {
          download("化工计算器.html", calcHTML(), "text/html;charset=utf-8");
          window.MST_TOAST("已下载离线计算器");
        } else if (t === "terms") {
          var rows = [["中文", "English", "备注"]].concat(TERMS.map(function (r) {
            return [r[0], r[1], r[2] || ""];
          }));
          var csv = "\uFEFF" + rows.map(function (r) {
            return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(",");
          }).join("\r\n");
          download("化工英语术语表.csv", csv, "text/csv;charset=utf-8");
          window.MST_TOAST("已下载术语表（" + TERMS.length + " 条）");
        } else if (t === "anki") {
          var DICT = window.MST_WORDS6 || [];
          var wrows = [["正面：单词 [音标]", "背面：释义 + 化工例句"]].concat(DICT.map(function (w) {
            return [w.w + " " + w.p, w.m + "\n例句：" + w.e];
          }));
          var wcsv = "\uFEFF" + wrows.map(function (r) {
            return r.map(function (c) { return '"' + String(c).replace(/"/g, '""').replace(/\n/g, "<br>") + '"'; }).join(",");
          }).join("\r\n");
          download("核心词汇-Anki导入.csv", wcsv, "text/csv;charset=utf-8");
          window.MST_TOAST("已下载词库（" + DICT.length + " 词全量）· Anki 中选「允许 HTML」导入");
        } else if (t === "plan") {
          download("双轨学习计划-周模板.md", PLAN, "text/markdown;charset=utf-8");
          window.MST_TOAST("已下载学习计划模板");
        } else if (t === "cet6pack") {
          download("六级备考资料包.html", cet6PackHTML(), "text/html;charset=utf-8");
          window.MST_TOAST("已下载六级资料包 · 词汇+表达+写作+测验全在里面");
        } else if (t === "careerpack") {
          download("化工求职资料包.html", careerPackHTML(), "text/html;charset=utf-8");
          window.MST_TOAST("已下载求职资料包 · 岗位+技能+简历+面试全在里面");
        } else if (t === "syncworker") {
          download("mst-progress-sync-worker.js", SYNC_WORKER, "text/javascript;charset=utf-8");
          window.MST_TOAST("已下载同步 Worker · 按文件头部说明部署后填入首页");
        }
      });
    });
  });
})();
