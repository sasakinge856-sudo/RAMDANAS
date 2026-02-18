/* =========================================
   1. المحرك الأساسي (Routing)
   ========================================= */
function go(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const target = document.querySelector(id.startsWith('#') ? id : '#' + id);
    if(target) target.classList.add('active');
    
    // تحديث الحالة
    document.getElementById('activePill').innerText = "📍 " + id.replace('#','').toUpperCase();

    // تشغيل الألعاب إذا كان المسار لعبة
    if(id.startsWith('#g-')) {
        setupGame(id.replace('#g-', ''));
    }
}

/* =========================================
   2. بنك الأسئلة (Curriculum)
   ========================================= */
const subjects = {
    "ar": { name: "لغة عربية", icon: "fa-book", questions: [
        {q: "ما إعراب الطالب في: نجح الطالبُ؟", a: ["فاعل مرفوع", "مفعول به", "خبر", "نعت"], c: 0},
        {q: "مؤلف كتاب 'الأيام' هو؟", a: ["طه حسين", "العقاد", "نجيب محفوظ", "الرافعي"], c: 0}
    ]},
    "en": { name: "English", icon: "fa-language", questions: [
        {q: "She ___ to school every day.", a: ["goes", "go", "going", "gone"], c: 0},
        {q: "Opposite of 'Success' is?", a: ["Failure", "Win", "Happy", "Sad"], c: 0}
    ]},
    "math": { name: "رياضيات", icon: "fa-calculator", questions: [
        {q: "جذر 64 هو؟", a: ["8", "6", "4", "16"], c: 0},
        {q: "مجموع زوايا المثلث؟", a: ["180", "360", "90", "270"], c: 0}
    ]}
};

// توليد قائمة المواد
const eduMenu = document.getElementById('eduMenu');
Object.keys(subjects).forEach(key => {
    eduMenu.innerHTML += `
        <div class="card-tile sm" onclick="startQuiz('${key}')">
            <i class="fa-solid ${subjects[key].icon}"></i>
            <h3>${subjects[key].name}</h3>
        </div>
    `;
});

let currentQIndex = 0;
let quizScore = 0;
let activeSubject = "";

function startQuiz(sub) {
    activeSubject = sub;
    currentQIndex = 0;
    quizScore = 0;
    go('#quiz-view');
    renderQuestion();
}

function renderQuestion() {
    const data = subjects[activeSubject].questions[currentQIndex];
    document.getElementById('qSubject').innerText = subjects[activeSubject].name;
    document.getElementById('qScore').innerText = "Score: " + quizScore;
    document.getElementById('questionBox').innerText = data.q;
    
    const options = document.getElementById('answerOptions');
    options.innerHTML = "";
    data.a.forEach((opt, i) => {
        options.innerHTML += `<div class="opt" onclick="checkAns(${i}, this)">${opt}</div>`;
    });
}

function checkAns(idx, el) {
    const correct = subjects[activeSubject].questions[currentQIndex].c;
    if(idx === correct) {
        el.classList.add('correct');
        quizScore++;
    } else {
        el.classList.add('wrong');
    }
    setTimeout(() => {
        currentQIndex++;
        if(currentQIndex < subjects[activeSubject].questions.length) renderQuestion();
        else alert("انتهى الاختبار! نتيجتك: " + quizScore);
    }, 1000);
}

/* =========================================
   3. محرك الألعاب (Game Engine)
   ========================================= */
function setupGame(type) {
    const holder = document.getElementById('canvasHolder');
    const controls = document.getElementById('gameControls');
    holder.innerHTML = "";
    controls.innerHTML = "";
    go('#game-display');

    if(type === 'dino') initDino(holder, controls);
    if(type === 'frog') initFrog(holder, controls);
    if(type === 'typing') initTyping(holder, controls);
    // إضافة باقي الألعاب بنفس النمط...
}

// لعبة الديناصور الحقيقية
function initDino(h, c) {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 200;
    h.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    let dino = { y: 150, v: 0, jumping: false };
    let obstacles = [];
    let score = 0;
    let frame = 0;

    c.innerHTML = `<button class="btn-pro" style="grid-column: span 3" id="jumpBtn">قفز (Space)</button>`;
    
    function update() {
        ctx.clearRect(0,0,800,200);
        // الجاذبية
        if(dino.jumping) {
            dino.v += 0.8;
            dino.y += dino.v;
            if(dino.y >= 150) { dino.y = 150; dino.jumping = false; }
        }
        
        // رسم الديناصور
        ctx.fillStyle = "#6366f1";
        ctx.fillRect(50, dino.y, 40, 40);

        // عوائق
        if(frame % 100 === 0) obstacles.push({ x: 800, w: 20 });
        obstacles.forEach((ob, i) => {
            ob.x -= 6;
            ctx.fillStyle = "#f43f5e";
            ctx.fillRect(ob.x, 160, ob.w, 30);
            
            // تصادم
            if(ob.x < 90 && ob.x > 50 && dino.y > 120) {
                alert("Game Over! Score: " + score);
                obstacles = []; score = 0;
            }
        });
        
        obstacles = obstacles.filter(ob => ob.x > -20);
        score++;
        frame++;
        requestAnimationFrame(update);
    }
    
    document.getElementById('jumpBtn').onclick = () => {
        if(!dino.jumping) { dino.v = -15; dino.jumping = true; }
    };
    update();
}

// لعبة الضفدع الحقيقية (3 خانات)
function initFrog(h, c) {
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 400;
    h.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let frog = { lane: 1 }; // 0, 1, 2
    let cars = [];
    let score = 0;

    c.innerHTML = `
        <button class="btn-pro" onclick="window.moveF(-1)">⬆️</button>
        <div></div>
        <button class="btn-pro" onclick="window.moveF(1)">⬇️</button>
    `;

    window.moveF = (d) => { frog.lane = Math.max(0, Math.min(2, frog.lane + d)); };

    function loop() {
        ctx.clearRect(0,0,400,400);
        // رسم الطرق
        [50, 150, 250].forEach(y => {
            ctx.fillStyle = "#1e293b"; ctx.fillRect(0, y, 400, 80);
        });

        // الضفدع
        ctx.fillStyle = "#10b981";
        ctx.fillRect(50, 60 + frog.lane * 100, 40, 40);

        // سيارات
        if(Math.random() < 0.02) cars.push({ x: 400, lane: Math.floor(Math.random()*3) });
        cars.forEach((car, i) => {
            car.x -= 5;
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(car.x, 70 + car.lane * 100, 60, 40);
            if(car.x < 90 && car.x > 50 && car.lane === frog.lane) {
                alert("خسرت! سكور: " + score);
                score = 0; cars = [];
            }
        });
        score++;
        requestAnimationFrame(loop);
    }
    loop();
}
