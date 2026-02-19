// ========= helpers =========
const $ = (s, p=document)=>p.querySelector(s);
const $$ = (s, p=document)=>Array.from(p.querySelectorAll(s));

function shuffle(a){
  const arr = a.slice();
  for(let i=arr.length-1;i>0;i--){
    const j=(Math.random()*(i+1))|0;
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function setPill(t){
  const pill = $("#pill");
  if(pill) pill.textContent = t;
}

// ========= floating fx =========
const fxEmojis = ["🪐","🎮","✨","💎","🧠","🌈","🎭","🧩","🔥","🍭","💫","🛸","🟣","🟦","🟨","⭐","🎯"];
function initFX(){
  const fx = $("#fx");
  if(!fx) return;

  const spawn = ()=>{
    fx.innerHTML="";
    const count = innerWidth < 420 ? 14 : 22;

    for(let i=0;i<count;i++){
      const el = document.createElement("div");
      el.textContent = fxEmojis[(Math.random()*fxEmojis.length)|0];
      el.style.position="absolute";
      el.style.fontSize="clamp(18px, 4vw, 30px)";
      el.style.filter="drop-shadow(0 10px 18px rgba(0,0,0,.35))";
      el.style.opacity=".85";

      const left = Math.random()*100;
      const dur = 9 + Math.random()*11;
      const delay = -Math.random()*dur;

      el.style.left = left+"vw";
      el.style.top = (90+Math.random()*20)+"vh";

      el.animate(
        [
          { transform:`translate3d(${left-50}vw, 110svh, 0) rotate(0deg)` },
          { transform:`translate3d(${left-50}vw, -20svh, 0) rotate(360deg)` }
        ],
        { duration: dur*1000, iterations: Infinity, easing: "linear", delay: delay*1000 }
      );

      fx.appendChild(el);
    }
  };

  spawn();
  addEventListener("resize", spawn);
}

// ========= theme toggle =========
const THEMES = ["neo","minimal","arc","gold"];
const THEME_VARS = {
  neo:    { "--bg0":"#070914","--bg1":"#0b1436","--a1":"#ffd666","--a2":"#22d3ee","--a3":"#a855f7" },
  minimal:{ "--bg0":"#07080c","--bg1":"#11131a","--a1":"#7dd3fc","--a2":"#2cff9f","--a3":"#c084fc" },
  arc:    { "--bg0":"#120616","--bg1":"#250b30","--a1":"#ff6bd6","--a2":"#ffd666","--a3":"#22d3ee" },
  gold:   { "--bg0":"#120b02","--bg1":"#2a1706","--a1":"#ffd666","--a2":"#f59e0b","--a3":"#22d3ee" }
};

function applyTheme(name){
  const vars = THEME_VARS[name] || THEME_VARS.neo;
  for(const k in vars) document.documentElement.style.setProperty(k, vars[k]);
  localStorage.setItem("themeV3", name);
  const statTheme = $("#statTheme");
  if(statTheme) statTheme.textContent = name;
  setPill("🎨 " + name);
}

function initTheme(){
  const btn = $("#themeBtn");
  const saved = localStorage.getItem("themeV3") || "neo";
  applyTheme(saved);

  btn?.addEventListener("click", ()=>{
    const cur = localStorage.getItem("themeV3") || "neo";
    const idx = THEMES.indexOf(cur);
    const next = THEMES[(idx+1)%THEMES.length];
    applyTheme(next);
  });
}

// ========= router =========
const ROUTES = new Set($$(".page").map(p => p.dataset.route));
function routeFromHash(){
  const raw = (location.hash || "#home").slice(1);
  return ROUTES.has(raw) ? raw : "home";
}
function showRoute(route){
  $$(".page").forEach(p => p.classList.toggle("active", p.dataset.route === route));
  $$(".navBtn").forEach(b => b.classList.toggle("active", (b.getAttribute("data-go")||"")==="#"+route));
  setPill("📍 " + route);
  onEnterRoute(route);
}
addEventListener("hashchange", ()=>showRoute(routeFromHash()));
document.addEventListener("click",(e)=>{
  const go = e.target.closest("[data-go]")?.getAttribute("data-go");
  if(go) location.hash = go;
});

// ========= quiz engine =========
function mountQuizPicker(mountEl, levels, title){
  if(!mountEl) return;

  const levelKeys = Object.keys(levels);

  mountEl.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
      <div>
        <div style="font-weight:1000; font-size:16px">${title}</div>
        <div class="muted" style="font-size:12.5px">اختار مستوى وبعدين ابدأ.</div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${levelKeys.map(k=>`<button class="btn ghost" data-level="${k}">${k}</button>`).join("")}
      </div>
    </div>
    <div id="quizBox" style="margin-top:12px"></div>
  `;

  const box = $("#quizBox", mountEl);
  const startLevel = (key)=> runQuiz(box, levels[key] || [], key);

  mountEl.querySelectorAll("[data-level]").forEach(b=>{
    b.addEventListener("click", ()=>startLevel(b.dataset.level));
  });

  startLevel(levelKeys[0]);
}

function runQuiz(el, questions, tag){
  let idx=0, score=0;
  let q = shuffle(questions);

  const render = ()=>{
    const item = q[idx];
    const choices = shuffle(item.choices.map((c,i)=>({text:c, i})));

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div class="pill">سؤال ${idx+1} / ${q.length}</div>
        <div class="pill">النتيجة: ${score}</div>
        <div class="pill">${tag}</div>
      </div>

      <div style="margin-top:10px;font-weight:1000;line-height:1.7">${item.q}</div>

      <div style="display:grid; gap:8px; margin-top:10px">
        ${choices.map(ch=>`
          <button class="choice" data-ans="${ch.i}">${ch.text}</button>
        `).join("")}
      </div>

      <div style="display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap; margin-top:12px">
        <button class="btn ghost" id="prev" ${idx===0?"disabled":""}>رجوع</button>
        <button class="btn ghost" id="reset">إعادة</button>
        <button class="btn" id="next">${idx===q.length-1 ? "إنهاء" : "التالي"}</button>
      </div>

      <p class="muted" id="hint" style="margin-top:8px"></p>
    `;

    const hint = $("#hint", el);

    el.querySelectorAll(".choice").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        el.querySelectorAll(".choice").forEach(x=>x.disabled=true);
        const picked = +btn.dataset.ans;

        if(picked === item.answer){
          btn.classList.add("ok");
          score++;
          hint.textContent = "✅ صح";
        } else {
          btn.classList.add("bad");
          const correct = Array.from(el.querySelectorAll(".choice")).find(x=>+x.dataset.ans===item.answer);
          if(correct) correct.classList.add("ok");
          hint.textContent = "❌ غلط";
        }
      });
    });

    $("#prev", el).onclick = ()=>{ if(idx>0){ idx--; render(); } };
    $("#reset", el).onclick = ()=>{ idx=0; score=0; q=shuffle(questions); render(); };
    $("#next", el).onclick = ()=>{
      if(idx === q.length-1){
        el.innerHTML = `
          <div class="pill">النتيجة النهائية: ${score} / ${q.length}</div>
          <div class="card">
            <p class="muted">عايز تعيد؟ دوس إعادة.</p>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px">
              <button class="btn" id="again">إعادة</button>
              <button class="btn ghost" data-go="#home">الرئيسية</button>
            </div>
          </div>
        `;
        $("#again", el).onclick = ()=>{ idx=0; score=0; q=shuffle(questions); render(); };
      } else {
        idx++;
        render();
      }
    };
  };

  render();
}

// ========= puzzles =========
function mountPuzzles(mountEl, puzzles){
  if(!mountEl) return;

  const render = (arr)=>{
    mountEl.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div>
          <div style="font-weight:1000; font-size:16px">ألغاز</div>
          <div class="muted" style="font-size:12.5px">اضغط "إظهار الحل".</div>
        </div>
        <button class="btn ghost" id="shuffleP">تبديل</button>
      </div>

      <div style="display:grid; gap:10px; margin-top:12px" id="pList">
        ${arr.map(p=>`
          <div class="card" style="margin-top:0">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
              <div style="font-weight:1000">${p.title}</div>
              <div class="pill">${p.type}</div>
            </div>
            <p class="muted" style="margin-top:8px">${p.q}</p>
            <button class="btn ghost" data-open="${p.id}" style="margin-top:10px">إظهار الحل</button>
            <div class="status" id="ans_${p.id}"></div>
          </div>
        `).join("")}
      </div>
    `;

    $("#shuffleP", mountEl).onclick = ()=>render(shuffle(arr));

    mountEl.querySelectorAll("[data-open]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const id = b.dataset.open;
        const item = arr.find(x=>x.id===id);
        const box = $("#ans_"+id);
        if(!box || !item) return;
        box.textContent = item.answer;
        box.classList.add("show");
      });
    });
  };

  render(puzzles);
}

// ========= Messages form =========
function initMessagesForm(){
  const form = $("#msgForm");
  const statusEl = $("#msgStatus");
  const clearBtn = $("#msgClear");
  if(!form || !statusEl || !clearBtn) return;

  const setStatus = (m)=>{
    statusEl.textContent = m;
    statusEl.classList.add("show");
  };

  clearBtn.onclick = ()=>{
    form.reset();
    statusEl.classList.remove("show");
  };

  form.onsubmit = async (e)=>{
    e.preventDefault();
    setStatus("جاري الإرسال…");
    try{
      const res = await fetch(form.action, {
        method:"POST",
        body: new FormData(form),
        headers: { "Accept":"application/json" }
      });
      if(res.ok){
        setStatus("✅ تم إرسال الرسالة.");
        form.reset();
      } else {
        setStatus("❌ فشل الإرسال. حاول تاني.");
      }
    } catch {
      setStatus("❌ مشكلة اتصال. اتأكد من الإنترنت.");
    }
  };
}

// ========= Games (light versions) =========
const mounted = new Set();

function mountReaction(el){
  if(!el) return;
  el.innerHTML = `
    <div style="text-align:center">
      <div class="pill" id="best">أفضل زمن: —</div>
      <div style="height:12px"></div>
      <div id="box" style="
        border:1px solid rgba(255,255,255,.14);
        border-radius:18px;
        padding:26px 12px;
        background:rgba(0,0,0,.18);
        font-weight:1000;
        font-size:18px;
        user-select:none;
        cursor:pointer;
      ">جاهز</div>

      <div style="display:flex; gap:10px; justify-content:space-between; flex-wrap:wrap; margin-top:12px">
        <button class="btn ghost" id="start">ابدأ</button>
        <button class="btn ghost" id="reset">إعادة</button>
        <button class="btn" data-go="#games">رجوع للألعاب</button>
      </div>
    </div>
  `;

  const box = $("#box", el);
  const bestEl = $("#best", el);
  const startBtn = $("#start", el);
  const resetBtn = $("#reset", el);

  let state="idle";
  let tStart=0, timeout=null;
  let best = +localStorage.getItem("reactBestV3") || 0;
  bestEl.textContent = best ? ("أفضل زمن: " + best + "ms") : "أفضل زمن: —";

  const setBox = (text, good=false)=>{
    box.textContent = text;
    box.style.background = good ? "color-mix(in srgb, var(--a2) 18%, rgba(0,0,0,.18))" : "rgba(0,0,0,.18)";
    box.style.borderColor = good ? "color-mix(in srgb, var(--a2) 55%, rgba(255,255,255,.14))" : "rgba(255,255,255,.14)";
  };

  const start = ()=>{
    if(state==="waiting") return;
    state="waiting";
    setBox("استنى…");
    const delay = 900 + Math.random()*2200;
    clearTimeout(timeout);
    timeout = setTimeout(()=>{
      state="go";
      setBox("اضغط!", true);
      tStart = performance.now();
    }, delay);
  };

  box.addEventListener("click", ()=>{
    if(state==="go"){
      const ms = Math.round(performance.now() - tStart);
      state="done";
      setBox("زمنك: " + ms + "ms", true);
      if(!best || ms < best){
        best = ms;
        localStorage.setItem("reactBestV3", String(best));
        bestEl.textContent = "أفضل زمن: " + best + "ms";
      }
    } else if(state==="waiting"){
      clearTimeout(timeout);
      state="idle";
      setBox("بدري! جرّب تاني.");
    }
  });

  const reset = ()=>{
    clearTimeout(timeout);
    state="idle";
    setBox("جاهز");
  };

  startBtn.onclick=start;
  resetBtn.onclick=reset;
  reset();
}

function mountTyping(el){
  if(!el) return;

  el.innerHTML = `
    <div>
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div class="pill" id="score">Score: 0</div>
        <div class="pill" id="time">Time: 30</div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between; margin-top:10px">
        <div class="pill" id="word" style="font-weight:1000; font-size:16px">—</div>
        <input class="field" id="inp" placeholder="اكتب هنا…" autocomplete="off" />
      </div>

      <div style="display:flex; gap:10px; justify-content:space-between; flex-wrap:wrap; margin-top:12px">
        <button class="btn ghost" id="start">ابدأ</button>
        <button class="btn ghost" id="reset">إعادة</button>
        <button class="btn" data-go="#games">رجوع للألعاب</button>
      </div>
    </div>
  `;

  const scoreEl = $("#score", el);
  const timeEl  = $("#time", el);
  const wordEl  = $("#word", el);
  const inp     = $("#inp", el);
  const startBtn= $("#start", el);
  const resetBtn= $("#reset", el);

  const words = shuffle([
    "رمضان","مذاكرة","مدرسة","نجاح","تفوق","سؤال","إجابة","تركيز","معلومة","اختبار",
    "planet","matrix","function","grammar","reading","capital","science","history","email","coding"
  ]);

  let idx=0, score=0, time=30, running=false, timer=null;

  const nextWord = ()=>{
    wordEl.textContent = words[idx % words.length];
    idx++;
  };

  const stop = ()=>{
    running=false;
    clearInterval(timer); timer=null;
    wordEl.textContent="انتهى!";
    inp.blur();
  };

  const start = ()=>{
    if(running) return;
    running=true; score=0; time=30; idx=0;
    scoreEl.textContent="Score: 0";
    timeEl.textContent="Time: 30";
    inp.value=""; inp.focus();
    nextWord();

    timer=setInterval(()=>{
      time--;
      timeEl.textContent="Time: " + time;
      if(time<=0) stop();
    }, 1000);
  };

  const reset = ()=>{
    stop();
    score=0; time=30; idx=0;
    scoreEl.textContent="Score: 0";
    timeEl.textContent="Time: 30";
    wordEl.textContent="—";
    inp.value="";
  };

  inp.addEventListener("keydown",(e)=>{
    if(e.key!=="Enter" || !running) return;
    const target = wordEl.textContent.trim().toLowerCase();
    const typed  = inp.value.trim().toLowerCase();
    if(typed === target){
      score++;
      scoreEl.textContent="Score: " + score;
    }
    inp.value="";
    nextWord();
  });

  startBtn.onclick=start;
  resetBtn.onclick=reset;
  reset();
}

function mountWhack(el){
  if(!el) return;

  el.innerHTML = `
    <div>
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div class="pill" id="score">Score: 0</div>
        <div class="pill" id="time">Time: 30</div>
      </div>

      <div id="arena" style="
        width:min(520px,100%);
        margin-top:10px;
        display:grid;
        grid-template-columns:repeat(3, minmax(0,1fr));
        gap:10px;
      "></div>

      <div style="display:flex; gap:10px; justify-content:space-between; flex-wrap:wrap; margin-top:12px">
        <button class="btn ghost" id="start">ابدأ</button>
        <button class="btn ghost" id="reset">إعادة</button>
        <button class="btn" data-go="#games">رجوع للألعاب</button>
      </div>
    </div>
  `;

  const arena = $("#arena", el);
  const scoreEl = $("#score", el);
  const timeEl  = $("#time", el);
  const startBtn= $("#start", el);
  const resetBtn= $("#reset", el);

  const pool = ["😂","🔥","💎","🧠","🎯","⚡","🟣","🍭","🪐","👑"];
  let score=0, time=30, running=false, interval=null, popTimeout=null;
  let activeIndex=-1;

  const build = ()=>{
    arena.innerHTML="";
    for(let i=0;i<9;i++){
      const hole=document.createElement("button");
      hole.type="button";
      hole.textContent="·";
      hole.style.aspectRatio="1/1";
      hole.style.borderRadius="18px";
      hole.style.border="1px solid rgba(255,255,255,.14)";
      hole.style.background="rgba(0,0,0,.18)";
      hole.style.color="rgba(255,255,255,.9)";
      hole.style.fontSize="32px";
      hole.style.cursor="pointer";
      hole.onclick=()=>{
        if(!running) return;
        if(i===activeIndex){
          score++;
          scoreEl.textContent="Score: " + score;
          activeIndex=-1;
          hole.textContent="·";
        }
      };
      arena.appendChild(hole);
    }
  };

  const pop = ()=>{
    if(!running) return;
    if(activeIndex>=0) arena.children[activeIndex].textContent="·";
    activeIndex = (Math.random()*9)|0;
    arena.children[activeIndex].textContent = pool[(Math.random()*pool.length)|0];

    const life = 350 + Math.random()*450;
    popTimeout=setTimeout(()=>{
      if(activeIndex>=0){
        arena.children[activeIndex].textContent="·";
        activeIndex=-1;
      }
      pop();
    }, life);
  };

  const stop = ()=>{
    running=false;
    clearInterval(interval); interval=null;
    clearTimeout(popTimeout); popTimeout=null;
    if(activeIndex>=0) arena.children[activeIndex].textContent="·";
    activeIndex=-1;
  };

  const start = ()=>{
    if(running) return;
    running=true; score=0; time=30; activeIndex=-1;
    scoreEl.textContent="Score: 0";
    timeEl.textContent="Time: 30";
    interval=setInterval(()=>{
      time--;
      timeEl.textContent="Time: " + time;
      if(time<=0) stop();
    }, 1000);
    pop();
  };

  const reset = ()=>{
    stop();
    score=0; time=30;
    scoreEl.textContent="Score: 0";
    timeEl.textContent="Time: 30";
  };

  build();
  startBtn.onclick=start;
  resetBtn.onclick=reset;
}

function mountMaze(el){
  if(!el) return;

  // 10x10 maze
  const map = [
    [0,1,0,0,0,0,1,0,0,0],
    [0,1,0,1,1,0,1,0,1,0],
    [0,0,0,0,1,0,0,0,1,0],
    [1,1,1,0,1,1,1,0,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,0,1,1,0],
    [0,0,0,0,0,1,0,0,0,0],
    [0,1,1,1,0,1,1,1,1,0],
    [0,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,1,1,0,0,0],
  ];

  let player = {r:0,c:0};
  const goal = {r:9,c:9};
  let moves = 0;

  el.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
      <div class="pill" id="moves">Moves: 0</div>
      <div class="pill" id="state">جاهز</div>
      <button class="btn" data-go="#games">رجوع للألعاب</button>
    </div>

    <div style="margin-top:12px; width:min(520px,100%);">
      <div id="grid" style="display:grid; grid-template-columns:repeat(10, minmax(0,1fr)); gap:6px;"></div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px">
        <button class="btn ghost" id="up">⬆️</button>
        <button class="btn ghost" id="down">⬇️</button>
        <button class="btn ghost" id="left">⬅️</button>
        <button class="btn ghost" id="right">➡️</button>
        <button class="btn ghost" id="reset">إعادة</button>
      </div>
    </div>
  `;

  const gridEl = $("#grid", el);
  const movesEl = $("#moves", el);
  const stateEl = $("#state", el);

  const render = ()=>{
    gridEl.innerHTML="";
    for(let r=0;r<10;r++){
      for(let c=0;c<10;c++){
        const d = document.createElement("div");
        d.style.aspectRatio="1/1";
        d.style.borderRadius="10px";
        d.style.border="1px solid rgba(255,255,255,.10)";
        d.style.background = "rgba(255,255,255,.06)";
        if(map[r][c]===1) d.style.background="rgba(255,255,255,.16)";
        if(r===goal.r && c===goal.c) d.style.background="color-mix(in srgb, var(--a1) 35%, rgba(255,255,255,.06))";
        if(r===player.r && c===player.c) d.style.background="color-mix(in srgb, var(--a2) 35%, rgba(255,255,255,.06))";
        gridEl.appendChild(d);
      }
    }
    movesEl.textContent = "Moves: " + moves;
  };

  const canMove = (r,c)=> r>=0 && r<10 && c>=0 && c<10 && map[r][c]===0;

  const move = (dr,dc)=>{
    const nr=player.r+dr, nc=player.c+dc;
    if(canMove(nr,nc)){
      player = {r:nr,c:nc};
      moves++;
      if(player.r===goal.r && player.c===goal.c) stateEl.textContent="✅ وصلت!";
      else stateEl.textContent="شغال…";
      render();
    }
  };

  const reset = ()=>{
    player={r:0,c:0}; moves=0; stateEl.textContent="جاهز";
    render();
  };

  $("#up", el).onclick=()=>move(-1,0);
  $("#down", el).onclick=()=>move(1,0);
  $("#left", el).onclick=()=>move(0,-1);
  $("#right", el).onclick=()=>move(0,1);
  $("#reset", el).onclick=reset;

  window.addEventListener("keydown",(e)=>{
    if(routeFromHash()!=="g-maze") return;
    if(e.key==="ArrowUp") move(-1,0);
    if(e.key==="ArrowDown") move(1,0);
    if(e.key==="ArrowLeft") move(0,-1);
    if(e.key==="ArrowRight") move(0,1);
  });

  reset();
}

function mount2048(el){
  if(!el) return;

  const levels = ["😀","😄","😎","🥳","🤩","👑","🪐","🌟","💎","🔥"];
  let board = Array(16).fill(0);
  let score=0;
  let best = +localStorage.getItem("e2048BestV3") || 0;

  el.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
      <div class="pill" id="score">Score: 0</div>
      <div class="pill" id="best">Best: ${best}</div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn ghost" id="reset">إعادة</button>
        <button class="btn" data-go="#games">رجوع للألعاب</button>
      </div>
    </div>

    <div id="grid" style="
      width:min(420px,100%);
      margin-top:12px;
      display:grid;
      grid-template-columns:repeat(4, minmax(0,1fr));
      gap:10px;
    "></div>
    <p class="muted" style="margin-top:10px">اسحب/استخدم الأسهم لدمج نفس الإيموجي.</p>
  `;

  const gridEl = $("#grid", el);
  const scoreEl = $("#score", el);
  const bestEl = $("#best", el);

  function addRandom(){
    const empty = board.map((v,i)=>v===0?i:-1).filter(i=>i>=0);
    if(!empty.length) return;
    const i = empty[(Math.random()*empty.length)|0];
    board[i] = Math.random()<0.9 ? 1 : 2;
  }

  function render(){
    gridEl.innerHTML="";
    for(let i=0;i<16;i++){
      const v=board[i];
      const cell=document.createElement("div");
      cell.style.aspectRatio="1/1";
      cell.style.borderRadius="16px";
      cell.style.border="1px solid rgba(255,255,255,.14)";
      cell.style.background="rgba(0,0,0,.18)";
      cell.style.display="grid";
      cell.style.placeItems="center";
      cell.style.fontSize="26px";
      cell.style.fontWeight="1000";
      cell.textContent = v===0 ? "" : levels[v-1];
      gridEl.appendChild(cell);
    }
    scoreEl.textContent="Score: " + score;
    if(score>best){
      best=score;
      localStorage.setItem("e2048BestV3", String(best));
      bestEl.textContent="Best: " + best;
    }
  }

  function compress(line){
    const a=line.filter(x=>x!==0);
    while(a.length<4) a.push(0);
    return a;
  }
  function merge(line){
    for(let i=0;i<3;i++){
      if(line[i] && line[i]===line[i+1]){
        line[i]=Math.min(line[i]+1, levels.length);
        line[i+1]=0;
        score += line[i]*5;
      }
    }
    return line;
  }

  function move(dir){
    const old=board.slice();

    const getRow=(r)=>board.slice(r*4,r*4+4);
    const setRow=(r,arr)=>{for(let i=0;i<4;i++) board[r*4+i]=arr[i];};

    const getCol=(c)=>[board[c],board[c+4],board[c+8],board[c+12]];
    const setCol=(c,arr)=>{board[c]=arr[0];board[c+4]=arr[1];board[c+8]=arr[2];board[c+12]=arr[3];};

    if(dir==="left" || dir==="right"){
      for(let r=0;r<4;r++){
        let line=getRow(r);
        if(dir==="right") line.reverse();
        line=compress(line);
        line=merge(line);
        line=compress(line);
        if(dir==="right") line.reverse();
        setRow(r,line);
      }
    }else{
      for(let c=0;c<4;c++){
        let line=getCol(c);
        if(dir==="down") line.reverse();
        line=compress(line);
        line=merge(line);
        line=compress(line);
        if(dir==="down") line.reverse();
        setCol(c,line);
      }
    }

    const changed = old.some((v,i)=>v!==board[i]);
    if(changed){ addRandom(); render(); }
  }

  function reset(){
    board=Array(16).fill(0);
    score=0;
    addRandom(); addRandom();
    render();
  }

  // swipe
  let sx=0, sy=0;
  gridEl.addEventListener("pointerdown",(e)=>{ sx=e.clientX; sy=e.clientY; });
  gridEl.addEventListener("pointerup",(e)=>{
    const dx=e.clientX-sx, dy=e.clientY-sy;
    if(Math.abs(dx)<25 && Math.abs(dy)<25) return;
    if(Math.abs(dx)>Math.abs(dy)) move(dx>0?"right":"left");
    else move(dy>0?"down":"up");
  });

  window.addEventListener("keydown",(e)=>{
    if(routeFromHash()!=="g-2048") return;
    if(e.key==="ArrowLeft") move("left");
    if(e.key==="ArrowRight") move("right");
    if(e.key==="ArrowUp") move("up");
    if(e.key==="ArrowDown") move("down");
  });

  $("#reset", el).onclick=reset;
  reset();
}

// ========= mount per route =========
function setStats(){
  const qEl = $("#statQuestions");
  const pEl = $("#statPuzzles");
  if(qEl) qEl.textContent = String(window.__META__?.totalQuestions ?? "—");
  if(pEl) pEl.textContent = String(window.__META__?.totalPuzzles ?? "—");
  const st = $("#statTheme");
  if(st) st.textContent = localStorage.getItem("themeV3") || "neo";
}

function onEnterRoute(route){
  setStats();

  if(route==="general" && !mounted.has(route)){
    mounted.add(route);
    mountQuizPicker($("#mount_general"), window.QUIZZES.general, "General Quiz");
  }
  if(route==="countries" && !mounted.has(route)){
    mounted.add(route);
    mountQuizPicker($("#mount_countries"), window.QUIZZES.countries, "Countries Quiz");
  }

  if(route==="p3-ar" && !mounted.has(route)){ mounted.add(route); runQuiz($("#mount_p3_ar"), window.QUIZZES.p3_ar, "عربي"); }
  if(route==="p3-en" && !mounted.has(route)){ mounted.add(route); runQuiz($("#mount_p3_en"), window.QUIZZES.p3_en, "English"); }
  if(route==="p3-math" && !mounted.has(route)){ mounted.add(route); runQuiz($("#mount_p3_math"), window.QUIZZES.p3_math, "Math"); }
  if(route==="p3-sci" && !mounted.has(route)){ mounted.add(route); runQuiz($("#mount_p3_sci"), window.QUIZZES.p3_sci, "Science"); }
  if(route==="p3-ss" && !mounted.has(route)){ mounted.add(route); runQuiz($("#mount_p3_ss"), window.QUIZZES.p3_ss, "Social"); }
  if(route==="p3-it" && !mounted.has(route)){ mounted.add(route); runQuiz($("#mount_p3_it"), window.QUIZZES.p3_it, "IT"); }

  if(route==="puzzles" && !mounted.has(route)){
    mounted.add(route);
    mountPuzzles($("#mount_puzzles"), window.PUZZLES);
  }

  if(route==="messages"){ initMessagesForm(); }

  if(route==="g-reaction" && !mounted.has(route)){ mounted.add(route); mountReaction($("#mount_reaction")); }
  if(route==="g-typing" && !mounted.has(route)){ mounted.add(route); mountTyping($("#mount_typing")); }
  if(route==="g-whack" && !mounted.has(route)){ mounted.add(route); mountWhack($("#mount_whack")); }
  if(route==="g-maze" && !mounted.has(route)){ mounted.add(route); mountMaze($("#mount_maze")); }
  if(route==="g-2048" && !mounted.has(route)){ mounted.add(route); mount2048($("#mount_2048")); }
}

// ========= init =========
initFX();
initTheme();
showRoute(routeFromHash());
