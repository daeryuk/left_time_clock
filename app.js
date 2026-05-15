(function () {
    "use strict";
  
    const STORAGE_KEY = "parents_left_time_v2";
    const MS_DAY = 86400000;
    const MS_YEAR = 365.2425 * MS_DAY;
  
    /** 출발 기대수명(세, 대한민국 통계 수준의 근사치) */
    const BASE_EXPECTANCY = {
      male: 80.2,
      female: 86.3,
    };
  
    const SURVEY = [
      {
        id: "smoking",
        title: "흡연",
        desc: "담배·히트·전자담배 등 연소형 담배 기준",
        options: [
          { value: "never", label: "비흡연(과거 포함 완전 금연 5년 이상)", years: 0.9 },
          { value: "quit_recent", label: "최근 금연(5년 미만)", years: 0.2 },
          { value: "occasional", label: "사회적·가끔(월 몇 회 이하)", years: -0.8 },
          { value: "daily_light", label: "매일 반갑 미만", years: -3.2 },
          { value: "daily_pack", label: "매일 1갑 전후", years: -6.5 },
          { value: "heavy", label: "매일 1갑 이상·심한 노출", years: -9 },
        ],
      },
      {
        id: "alcohol",
        title: "음주",
        options: [
          { value: "none", label: "금주", years: 0.4 },
          { value: "light", label: "가끔 소량(주 1회 이하, 과음 없음)", years: 0 },
          { value: "moderate", label: "주 2~4회, 적당량", years: -0.6 },
          { value: "heavy", label: "주 5회 이상 또는 자주 과음", years: -2.8 },
          { value: "daily", label: "거의 매일 음주", years: -4.2 },
        ],
      },
      {
        id: "exercise",
        title: "유산소·근력 운동",
        options: [
          { value: "high", label: "주 5일 이상(걷기·뛰기·근력 포함)", years: 2.1 },
          { value: "mid", label: "주 3~4일", years: 1.2 },
          { value: "low", label: "주 1~2일", years: 0.3 },
          { value: "sedentary", label: "거의 안 함(앉아 있는 시간이 매우 김)", years: -1.8 },
        ],
      },
      {
        id: "diet",
        title: "식습관",
        options: [
          { value: "balanced", label: "채소·과일·단백질 균형, 가공식품 적음", years: 1 },
          { value: "average", label: "대체로 보통 외식·가정식 혼합", years: 0 },
          { value: "processed", label: "인스턴트·야식·가공육·탄수 위주가 많음", years: -1.4 },
          { value: "irregular", label: "불규칙·과식·야식이 잦음", years: -0.9 },
        ],
      },
      {
        id: "sleep",
        title: "수면",
        options: [
          { value: "good", label: "대체로 7~8시간, 숙면", years: 0.6 },
          { value: "ok", label: "6~7시간 또는 가끔 불면", years: 0 },
          { value: "short", label: "6시간 미만이 잦음", years: -1.1 },
          { value: "bad", label: "불면·수면 무호흥 의심·낮잠으로 버팀", years: -1.8 },
        ],
      },
      {
        id: "stress",
        title: "스트레스·정신 부담",
        options: [
          { value: "low", label: "낮음, 대처 가능", years: 0.4 },
          { value: "mid", label: "보통", years: 0 },
          { value: "high", label: "높음(직장·가족·경제 등)", years: -1 },
          { value: "chronic", label: "만성적 우울·불안 또는 번아웃", years: -2.2 },
        ],
      },
      {
        id: "conditions",
        title: "만성질환·복약",
        options: [
          { value: "none", label: "진단된 만성질환 없음·복약 거의 없음", years: 0.3 },
          { value: "controlled", label: "고혈압·당뇨 등 있으나 잘 조절됨", years: -0.4 },
          { value: "multiple", label: "여러 질환 또는 조절이 불안정", years: -2.5 },
          { value: "severe", label: "심혈관·신장·호흡기 중증 또는 합병증", years: -4 },
        ],
      },
      {
        id: "checkup",
        title: "건강검진",
        options: [
          { value: "annual", label: "국가·종합 검진 거의 매년", years: 0.5 },
          { value: "sometimes", label: "2~3년에 한 번", years: 0 },
          { value: "rare", label: "거의 안 함", years: -0.7 },
        ],
      },
      {
        id: "weight",
        title: "체형(BMI 대략)",
        options: [
          { value: "normal", label: "정상 범위", years: 0.4 },
          { value: "over", label: "과체중", years: -0.6 },
          { value: "obese", label: "비만", years: -1.8 },
          { value: "under", label: "저체중", years: -0.5 },
        ],
      },
      {
        id: "social",
        title: "사회활동·관계",
        options: [
          { value: "rich", label: "친구·동호회·봉사 등 활발", years: 0.7 },
          { value: "ok", label: "가족 중심으로 보통", years: 0 },
          { value: "isolated", label: "거의 고립·대화가 매우 적음", years: -1.2 },
        ],
      },
      {
        id: "safety",
        title: "안전 습관",
        options: [
          { value: "good", label: "안전벨트·보행·낙상 예방 신경 씀", years: 0.2 },
          { value: "neutral", label: "보통", years: 0 },
          { value: "risk", label: "고위험 운전·작업·낙상 환경", years: -0.8 },
        ],
      },
    ];
  
    /** @type {{ parentName?: string, birthDate: string, gender: 'male'|'female', readyForResult?: boolean, surveySkipped?: boolean, surveyDeltaYears?: number, savedAt?: string } | null} */
    let state = null;
    let countdownTimer = null;
    let expiredUiLocked = false;
  
    const els = {
      stepBirth: document.getElementById("step-birth"),
      stepSurvey: document.getElementById("step-survey"),
      stepResult: document.getElementById("step-result"),
      formBirth: document.getElementById("form-birth"),
      formSurvey: document.getElementById("form-survey"),
      birthDate: document.getElementById("birth-date"),
      btnSkip: document.getElementById("btn-skip-survey"),
      btnEdit: document.getElementById("btn-edit"),
      btnReset: document.getElementById("btn-reset"),
      cdDays: document.getElementById("cd-days"),
      cdHours: document.getElementById("cd-hours"),
      cdMins: document.getElementById("cd-mins"),
      cdSecs: document.getElementById("cd-secs"),
      resultTitle: document.getElementById("result-title"),
      resultSub: document.getElementById("result-sub"),
      statYearsLeft: document.getElementById("stat-years-left"),
      statLived: document.getElementById("stat-lived"),
      statDelta: document.getElementById("stat-delta"),
      lifeBar: document.getElementById("life-bar"),
      lifeBarFill: document.getElementById("life-bar-fill"),
      lifePct: document.getElementById("life-pct"),
    };
  
    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.birthDate && parsed.gender) {
          if (parsed.readyForResult !== true) {
            parsed.readyForResult = false;
          }
          return parsed;
        }
      } catch (_) {}
      return null;
    }
  
    function saveState() {
      if (!state) return;
      state.savedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  
    function clearState() {
      state = null;
      localStorage.removeItem(STORAGE_KEY);
    }
  
    function showStep(name) {
      ["stepBirth", "stepSurvey", "stepResult"].forEach((key) => {
        els[key].classList.remove("active");
      });
      if (name === "birth") els.stepBirth.classList.add("active");
      if (name === "survey") els.stepSurvey.classList.add("active");
      if (name === "result") els.stepResult.classList.add("active");
    }
  
    function formatMetaYears(y) {
      if (y > 0.01) return { text: `+${y.toFixed(1)}년`, cls: "up" };
      if (y < -0.01) return { text: `${y.toFixed(1)}년`, cls: "down" };
      return { text: "±0", cls: "neutral" };
    }
  
    function renderSurvey() {
      const frag = document.createDocumentFragment();
      SURVEY.forEach((q, qi) => {
        const wrap = document.createElement("div");
        wrap.className = "survey-q";
        wrap.innerHTML = `<h3 class="q-title">${qi + 1}. ${q.title}</h3>${
          q.desc ? `<p class="lead" style="margin:-0.25rem 0 0.6rem;font-size:0.82rem">${q.desc}</p>` : ""
        }`;
        const opts = document.createElement("div");
        opts.className = "q-options";
        q.options.forEach((o, oi) => {
          const id = `${q.id}_${oi}`;
          const meta = formatMetaYears(o.years);
          const lab = document.createElement("label");
          lab.className = "q-opt";
          lab.htmlFor = id;
          lab.innerHTML = `<input type="radio" name="${q.id}" id="${id}" value="${o.value}" data-years="${o.years}" ${
            oi === 0 ? "required" : ""
          } /><span>${o.label}</span><span class="q-meta ${meta.cls}">${meta.text}</span>`;
          opts.appendChild(lab);
        });
        wrap.appendChild(opts);
        frag.appendChild(wrap);
      });
      els.formSurvey.innerHTML = "";
      els.formSurvey.appendChild(frag);
    }
  
    function sumSurveyYears() {
      let sum = 0;
      for (const q of SURVEY) {
        const sel = els.formSurvey.querySelector(`input[name="${q.id}"]:checked`);
        if (!sel) return null;
        sum += Number(sel.dataset.years) || 0;
      }
      return sum;
    }
  
    function parseBirth(birthDateStr) {
      const d = new Date(birthDateStr + "T12:00:00");
      return Number.isNaN(d.getTime()) ? null : d;
    }
  
    function getTotalExpectedYears() {
      if (!state) return 0;
      const base = BASE_EXPECTANCY[state.gender] || BASE_EXPECTANCY.male;
      const delta = state.surveySkipped === true ? 0 : Number(state.surveyDeltaYears) || 0;
      return Math.max(0.5, base + delta);
    }
  
    /** 추정 사망 시각(교육용 시뮬레이션) */
    function getEstimatedEnd() {
      if (!state) return null;
      const birth = parseBirth(state.birthDate);
      if (!birth) return null;
      const years = getTotalExpectedYears();
      return new Date(birth.getTime() + years * MS_YEAR);
    }
  
    function formatDuration(ms, short) {
      const s = Math.floor(ms / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (short) {
        if (d > 0) return `${d}일 ${h}시간`;
        if (h > 0) return `${h}시간 ${m}분`;
        return `${m}분 ${sec}초`;
      }
      return `${d}일 ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
  
    function pad2(n) {
      return String(n).padStart(2, "0");
    }
  
    function updateCountdown() {
      const end = getEstimatedEnd();
      const birth = state ? parseBirth(state.birthDate) : null;
      if (!end || !birth || !state) return;
  
      const now = Date.now();
      const remaining = end.getTime() - now;
      const lived = now - birth.getTime();
  
      if (remaining <= 0) {
        els.cdDays.textContent = "00";
        els.cdHours.textContent = "00";
        els.cdMins.textContent = "00";
        els.cdSecs.textContent = "00";
        els.statYearsLeft.textContent = "평균 추정선 도달 또는 초과";
        if (!expiredUiLocked) {
          expiredUiLocked = true;
          els.resultSub.textContent =
            "통계상 ‘평균’을 넘긴 시간입니다. 추정치일 뿐이며, 오히려 축하할 일일 수 있습니다. 지금도 건강 관리는 이어가세요.";
        }
        els.lifeBarFill.style.width = "100%";
        els.lifePct.textContent = "100%+";
        els.lifeBar.setAttribute("aria-valuenow", "100");
        return;
      }
  
      expiredUiLocked = false;
  
      const totalSpan = end.getTime() - birth.getTime();
      const pct = Math.min(100, Math.max(0, (lived / totalSpan) * 100));
  
      const rs = Math.floor(remaining / 1000);
      const days = Math.floor(rs / 86400);
      const hours = Math.floor((rs % 86400) / 3600);
      const mins = Math.floor((rs % 3600) / 60);
      const secs = rs % 60;
  
      els.cdDays.textContent = String(days);
      els.cdHours.textContent = pad2(hours);
      els.cdMins.textContent = pad2(mins);
      els.cdSecs.textContent = pad2(secs);
  
      const yearsLeft = remaining / MS_YEAR;
      els.statYearsLeft.textContent = `약 ${yearsLeft.toFixed(2)}년 (${formatDuration(remaining, true)})`;
  
      els.statLived.textContent = formatDuration(lived, false);
  
      const delta = state.surveySkipped === true ? 0 : Number(state.surveyDeltaYears) || 0;
      const sign = delta >= 0 ? "+" : "";
      els.statDelta.textContent =
        state.surveySkipped === true
          ? "설문 생략 (가감 0년)"
          : `${sign}${delta.toFixed(2)}년 (기본 ${BASE_EXPECTANCY[state.gender].toFixed(1)}년 대비)`;
  
      els.lifeBarFill.style.width = `${pct.toFixed(2)}%`;
      els.lifePct.textContent = `${pct.toFixed(1)}% 경과(추정)`;
      els.lifeBar.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
  
    function startCountdownLoop() {
      if (countdownTimer) clearInterval(countdownTimer);
      updateCountdown();
      countdownTimer = setInterval(updateCountdown, 250);
    }
  
    function stopCountdownLoop() {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  
    function openResult() {
      expiredUiLocked = false;
      const name = state.parentName?.trim();
      els.resultTitle.textContent = name ? `${name}님의 추정 남은 시간` : "추정 남은 시간";
      const skipped = state.surveySkipped === true;
      els.resultSub.textContent = skipped
        ? "설문을 건너뛰어 성·연령 기준 기대수명만 적용했습니다."
        : "설문 응답을 기대수명에 가감해 반영했습니다.";
      showStep("result");
      startCountdownLoop();
      saveState();
    }
  
    function validateBirthForm() {
      const birth = els.birthDate.value;
      const gender = els.formBirth.querySelector('input[name="gender"]:checked');
      if (!birth || !gender) return false;
      const bd = parseBirth(birth);
      if (!bd || bd.getTime() > Date.now()) {
        alert("유효한 생년월일을 입력해 주세요. 미래 날짜는 사용할 수 없습니다.");
        return false;
      }
      return true;
    }
  
    els.birthDate.max = new Date().toISOString().slice(0, 10);
  
    els.formBirth.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateBirthForm()) return;
      const fd = new FormData(els.formBirth);
      state = {
        parentName: (fd.get("parentName") || "").toString().trim() || undefined,
        birthDate: fd.get("birthDate").toString(),
        gender: fd.get("gender").toString() === "female" ? "female" : "male",
        readyForResult: false,
      };
      saveState();
      showStep("survey");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  
    els.formSurvey.addEventListener("submit", (e) => {
      e.preventDefault();
      const total = sumSurveyYears();
      if (total === null) {
        alert("모든 문항에 답해 주세요.");
        return;
      }
      state.surveySkipped = false;
      state.surveyDeltaYears = Math.round(total * 100) / 100;
      state.readyForResult = true;
      openResult();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  
    els.btnSkip.addEventListener("click", () => {
      if (!state) return;
      state.surveySkipped = true;
      state.surveyDeltaYears = 0;
      state.readyForResult = true;
      openResult();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  
    els.btnEdit.addEventListener("click", () => {
      stopCountdownLoop();
      if (state) {
        state.readyForResult = false;
        delete state.surveySkipped;
        delete state.surveyDeltaYears;
        saveState();
        document.getElementById("parent-name").value = state.parentName || "";
        els.birthDate.value = state.birthDate;
        const g = els.formBirth.querySelectorAll('input[name="gender"]');
        g.forEach((r) => {
          r.checked = r.value === state.gender;
        });
      }
      showStep("birth");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  
    els.btnReset.addEventListener("click", () => {
      if (!confirm("저장된 부모님 정보와 결과를 모두 삭제할까요?")) return;
      stopCountdownLoop();
      clearState();
      els.formBirth.reset();
      els.birthDate.max = new Date().toISOString().slice(0, 10);
      showStep("birth");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  
    function init() {
      renderSurvey();
      state = loadState();
      if (state && state.birthDate && state.gender) {
        if (state.readyForResult === true) {
          openResult();
          return;
        }
        document.getElementById("parent-name").value = state.parentName || "";
        els.birthDate.value = state.birthDate;
        const g = els.formBirth.querySelectorAll('input[name="gender"]');
        g.forEach((r) => {
          r.checked = r.value === state.gender;
        });
        showStep("survey");
        return;
      }
      showStep("birth");
    }
  
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopCountdownLoop();
      else if (state && els.stepResult.classList.contains("active")) startCountdownLoop();
    });
  
    init();
  })();