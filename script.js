const HABITS = [
  { id: "fajr", name: "Fajr ki namaz", hint: "Subah ki namaz ada ki", group: "Subah" },
  { id: "quran", name: "Quran padhna", hint: "Fajr ke baad 20–30 minute", group: "Subah" },
  { id: "college", name: "College jaana", hint: "Classes aur practicals par focus", group: "Din" },
  { id: "zuhr", name: "Zuhr ki namaz", hint: "Zuhr ki namaz ada ki", group: "Din" },
  { id: "lunch", name: "Lunch aur thoda rest", hint: "Khaana khaya aur break liya", group: "Din" },
  { id: "selfstudy", name: "Self-study", hint: "College subjects / focused learning", group: "Padhai" },
  { id: "asr", name: "Asr ki namaz", hint: "Asr ki namaz ada ki", group: "Shaam" },
  { id: "walkquran", name: "Walk ya Quran", hint: "20–30 minute walk ya Quran reading", group: "Shaam" },
  { id: "maghrib", name: "Maghrib ki namaz", hint: "Maghrib ki namaz ada ki", group: "Shaam" },
  { id: "eveningstudy", name: "Shaam ki padhai", hint: "Revision, assignment ya practice", group: "Padhai" },
  { id: "isha", name: "Isha ki namaz", hint: "Isha ki namaz ada ki", group: "Raat" },
  { id: "sleep", name: "11–12 baje tak sona", hint: "Time par phone side mein rakhkar sona", group: "Raat" }
];

const MODES = {
  7: { name: "Starter", title: "7 days. Start showing up.", rewards: ["Your favourite chai or coffee break", "A guilt-free movie night", "A small treat you have been postponing", "Celebrate your first full challenge"] },
  30: { name: "Discipline", title: "30 days. One stronger you.", rewards: ["Your favourite snack or dessert", "One relaxed movie evening", "Buy a book or something useful", "Plan a small day out or personal treat"] },
  90: { name: "Transformation", title: "90 days. A new standard.", rewards: ["A proper rest evening, no guilt", "A new book or learning resource", "A small upgrade for your study setup", "Celebrate with a memorable day out"] },
  365: { name: "Life Reset", title: "365 days. A different life.", rewards: ["A favourite meal and a slow evening", "A new book, course or useful tool", "A meaningful upgrade you have saved for", "A celebration of the person you became"] }
};

const STORAGE_KEY = "the-reset-challenges-v2";
const POINTS_PER_HABIT = 10;
const PERFECT_DAY_BONUS = 20;
let activeDuration = 30;
let activeDay = null;
let currentFilter = "all";
let challengeData = loadData();
let lastRewardUnlock = null;

function freshChallenge() {
  return { days: [], claimed: [] };
}
function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch { return {}; }
}
function currentData() {
  if (!challengeData[activeDuration]) challengeData[activeDuration] = freshChallenge();
  const data = challengeData[activeDuration];
  if (!Array.isArray(data.days)) data.days = [];
  if (!Array.isArray(data.claimed)) data.claimed = [];
  return data;
}
function dayRecord(index) {
  const data = currentData();
  if (!data.days[index]) data.days[index] = {};
  return data.days[index];
}
function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(challengeData)); }
  catch { alert("Browser storage is full or unavailable. Please check browser settings."); }
}
function dayStats(index) {
  const record = currentData().days[index] || {};
  const values = Object.values(record);
  const marked = values.filter(v => v === "done" || v === "missed").length;
  const done = values.filter(v => v === "done").length;
  const missed = values.filter(v => v === "missed").length;
  const logged = marked === HABITS.length;
  const points = done * POINTS_PER_HABIT + (logged && done === HABITS.length ? PERFECT_DAY_BONUS : 0);
  return { marked, done, missed, logged, started: marked > 0, points };
}
function totals() {
  let points = 0, done = 0, marked = 0, daysTracked = 0;
  for (let i = 0; i < activeDuration; i++) {
    const s = dayStats(i);
    points += s.points; done += s.done; marked += s.marked;
    if (s.started) daysTracked++;
  }
  return { points, done, marked, daysTracked, maxPoints: activeDuration * HABITS.length * POINTS_PER_HABIT };
}
function milestones() {
  const total = totals();
  const thresholds = [0.25, 0.5, 0.75, 1];
  const labels = ["First spark", "Building momentum", "Unstoppable", "Challenge complete"];
  return thresholds.map((ratio, i) => ({
    id: `${activeDuration}-${i}`,
    ratio,
    points: Math.ceil(total.maxPoints * ratio),
    label: labels[i],
    gift: MODES[activeDuration].rewards[i],
    unlocked: total.points >= Math.ceil(total.maxPoints * ratio),
    claimed: currentData().claimed.includes(`${activeDuration}-${i}`)
  }));
}
function renderStats() {
  const t = totals();
  const pct = Math.min(100, Math.round((t.points / t.maxPoints) * 100));
  document.getElementById("points-stat").textContent = t.points.toLocaleString();
  document.getElementById("days-tracked-stat").textContent = t.daysTracked;
  document.getElementById("days-total").textContent = ` / ${activeDuration}`;
  document.getElementById("habits-done-stat").textContent = t.done.toLocaleString();
  document.getElementById("habits-total").textContent = ` / ${activeDuration * HABITS.length}`;
  document.getElementById("overall-progress-label").textContent = `${pct}% · ${t.points.toLocaleString()} / ${t.maxPoints.toLocaleString()} points`;
  document.getElementById("overall-progress-bar").style.width = `${pct}%`;
  document.getElementById("reward-points").textContent = `${t.points.toLocaleString()} pts`;
  document.getElementById("hero-kicker").textContent = `${activeDuration} DAYS · ${MODES[activeDuration].name.toUpperCase()} CHALLENGE`;
  document.getElementById("hero-days").innerHTML = `${activeDuration}<span>DAYS</span>`;
  document.getElementById("journey-title").textContent = MODES[activeDuration].title;
  document.getElementById("days-counter").textContent = `${activeDuration} DAYS`;
}
function statusFor(s) {
  if (!s.started) return { label: "Not started", cls: "" };
  if (s.logged && s.done === HABITS.length) return { label: "Perfect day", cls: "logged" };
  if (s.logged) return { label: "Checked in", cls: "logged" };
  return { label: "In progress", cls: "started" };
}
function renderDays() {
  const grid = document.getElementById("days-grid");
  const html = [];
  for (let i = 0; i < activeDuration; i++) {
    const s = dayStats(i);
    if (currentFilter === "started" && (!s.started || s.logged)) continue;
    if (currentFilter === "logged" && !s.logged) continue;
    if (currentFilter === "pending" && s.started) continue;
    const status = statusFor(s);
    const pct = Math.round((s.done / HABITS.length) * 100);
    html.push(`<article class="day-card">
      <div class="day-card-top"><span class="day-number">Day ${i + 1}</span><span class="day-status ${status.cls}">${status.label}</span></div>
      <div class="day-count"><strong>${s.done}/${HABITS.length}</strong> habits · <b>${s.points} pts</b></div>
      <div class="progress-track day-progress"><span style="width:${pct}%"></span></div>
      <button class="day-open" type="button" data-day="${i}"><span>${s.started ? "Update check-in" : "Start this day"}</span><span>→</span></button>
    </article>`);
  }
  grid.innerHTML = html.length ? html.join("") : `<div class="empty-state">No days in this filter yet. Try another filter.</div>`;
}
function renderRewards() {
  const list = document.getElementById("reward-list");
  list.innerHTML = milestones().map((m, i) => {
    const pct = Math.round(m.ratio * 100);
    const state = m.unlocked ? "unlocked" : "locked";
    const action = m.unlocked
      ? `<button class="reward-claim" data-claim="${m.id}" type="button">${m.claimed ? "View reward" : "Reveal reward"} →</button>`
      : `<span class="reward-locked-copy">${m.points.toLocaleString()} pts needed</span>`;
    return `<article class="reward-item ${state}">
      <div class="reward-badge">${m.unlocked ? "✧" : "?"}</div>
      <div class="reward-info"><div class="reward-title-row"><strong>${m.label}</strong><span>${pct}%</span></div>
      <div class="reward-progress"><span style="width:${Math.min(100, Math.round((totals().points / m.points) * 100))}%"></span></div>
      ${action}</div>
    </article>`;
  }).join("");
}
function renderAll() { renderStats(); renderDays(); renderRewards(); }
function renderTasks() {
  const record = dayRecord(activeDay);
  document.getElementById("task-list").innerHTML = HABITS.map(h => {
    const value = record[h.id] || "";
    return `<article class="task-row"><div class="task-info"><span class="task-group">${h.group}</span><span class="task-name">${h.name}</span><span class="task-hint">${h.hint}</span></div>
      <div class="choice-group"><button class="choice-button done ${value === "done" ? "selected" : ""}" aria-pressed="${value === "done"}" data-habit="${h.id}" data-value="done" type="button">✓ Done</button>
      <button class="choice-button missed ${value === "missed" ? "selected" : ""}" aria-pressed="${value === "missed"}" data-habit="${h.id}" data-value="missed" type="button">✕ Missed</button></div></article>`;
  }).join("");
  updateModalProgress();
}
function updateModalProgress() {
  if (activeDay === null) return;
  const s = dayStats(activeDay);
  document.getElementById("modal-count").textContent = `${s.marked} of ${HABITS.length} marked`;
  document.getElementById("modal-done").textContent = `${s.done} completed · ${s.points} pts`;
  document.getElementById("modal-progress-bar").style.width = `${Math.round(s.marked / HABITS.length * 100)}%`;
}
function openCheckin(index) {
  activeDay = index;
  document.getElementById("modal-title").textContent = `Day ${index + 1}`;
  renderTasks();
  document.getElementById("checkin-modal").hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("close-modal").focus();
}
function closeCheckin() {
  document.getElementById("checkin-modal").hidden = true;
  document.body.style.overflow = "";
  activeDay = null;
  renderAll();
}
function showReward(id) {
  const m = milestones().find(item => item.id === id);
  if (!m || !m.unlocked) return;
  if (!currentData().claimed.includes(id)) {
    currentData().claimed.push(id);
    saveData();
  }
  document.getElementById("reward-modal-title").textContent = `${m.label} unlocked!`;
  document.getElementById("reward-modal-copy").textContent = `Your surprise reward: ${m.gift}. You earned this by showing up for yourself.`;
  document.getElementById("reward-modal").hidden = false;
  renderRewards();
}
function maybeUnlockNewRewards(previousPoints) {
  const before = [0.25, 0.5, 0.75, 1].filter(r => previousPoints < Math.ceil(totals().maxPoints * r));
  const newlyUnlocked = milestones().find(m => m.unlocked && !m.claimed && before.includes(m.ratio));
  if (newlyUnlocked) showReward(newlyUnlocked.id);
}

document.getElementById("challenge-select").addEventListener("change", e => {
  activeDuration = Number(e.target.value);
  currentFilter = "all";
  document.querySelectorAll("[data-filter]").forEach(b => b.classList.toggle("active", b.dataset.filter === "all"));
  renderAll();
});
document.getElementById("days-grid").addEventListener("click", e => {
  const btn = e.target.closest("[data-day]");
  if (btn) openCheckin(Number(btn.dataset.day));
});
document.getElementById("task-list").addEventListener("click", e => {
  const btn = e.target.closest("[data-habit][data-value]");
  if (!btn || activeDay === null) return;
  const previous = totals().points;
  dayRecord(activeDay)[btn.dataset.habit] = btn.dataset.value;
  saveData();
  renderTasks();
  renderAll();
  maybeUnlockNewRewards(previous);
});
document.getElementById("close-modal").addEventListener("click", closeCheckin);
document.getElementById("done-modal").addEventListener("click", closeCheckin);
document.getElementById("checkin-modal").addEventListener("click", e => { if (e.target.id === "checkin-modal") closeCheckin(); });
document.getElementById("close-reward").addEventListener("click", () => { document.getElementById("reward-modal").hidden = true; });
document.getElementById("reward-modal").addEventListener("click", e => { if (e.target.id === "reward-modal") e.currentTarget.hidden = true; });
document.getElementById("reward-list").addEventListener("click", e => {
  const btn = e.target.closest("[data-claim]");
  if (btn) showReward(btn.dataset.claim);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (activeDay !== null) closeCheckin();
    document.getElementById("reward-modal").hidden = true;
  }
});
document.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
  currentFilter = btn.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(b => b.classList.toggle("active", b === btn));
  renderDays();
}));
document.getElementById("reset-button").addEventListener("click", () => {
  if (!confirm(`Reset all progress for the ${activeDuration}-day challenge? This cannot be undone.`)) return;
  challengeData[activeDuration] = freshChallenge();
  saveData();
  renderAll();
});
renderAll();
