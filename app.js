// 너굴의 향신료상점 — 두 페이지(index.html, spice.html)가 이 파일 하나를 함께 씁니다.
const DATA_URL = "spices.json";

async function loadSpices() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error("spices.json을 불러오지 못했습니다");
  return res.json();
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- 서랍장 (index.html) ---------- */
function renderCabinet(spices) {
  const cabinet = document.getElementById("cabinet");
  cabinet.innerHTML = spices
    .map(
      (s) => `
      <button class="drawer" data-id="${esc(s.id)}" data-category="${esc(s.category)}"
              aria-label="${esc(s.name)} 서랍 열기">
        <span class="label">
          <span class="label-name">${esc(s.name)}</span>
          <span class="label-en">${esc(s.name_en)}</span>
        </span>
        <span class="handle" aria-hidden="true"></span>
      </button>`
    )
    .join("");

  // 클릭하면 서랍이 빠지는 연출 후 상세 페이지로 이동
  cabinet.addEventListener("click", (e) => {
    const drawer = e.target.closest(".drawer");
    if (!drawer) return;
    drawer.classList.add("opening");
    setTimeout(() => {
      location.href = `spice.html?id=${encodeURIComponent(drawer.dataset.id)}`;
    }, 280);
  });

  // 분류 필터
  document.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      cabinet.querySelectorAll(".drawer").forEach((d) => {
        d.hidden = f !== "all" && d.dataset.category !== f;
      });
    });
  });
}

/* ---------- 명칭 표 ----------
   한국어 / 영어 / 학명은 고정, 그 아래로 other_names 배열의 언어가 순서대로 붙습니다.
   other_names 예: [{ "lang": "그리스어", "name": "κανέλα", "roman": "kanéla" }]  (roman은 선택) */
function namesTable(s) {
  const rows = [
    ["한국어", esc(s.name)],
    ["영어", esc(s.name_en)],
    ["학명", esc(s.latin), "latin"],
    ...(s.other_names || []).map((o) => [
      esc(o.lang),
      `<span lang="${esc(o.code || "")}">${esc(o.name)}</span>` +
        (o.roman ? `<span class="roman">${esc(o.roman)}</span>` : ""),
    ]),
  ];
  return `<table class="names-table"><tbody>${rows
    .map(([k, v, cls]) => `<tr><th scope="row">${k}</th><td${cls ? ` class="${cls}"` : ""}>${v}</td></tr>`)
    .join("")}</tbody></table>`;
}

/* ---------- 화학 성분 표 ----------
   compounds 예: [{ "name": "신남알데하이드", "name_en": "Cinnamaldehyde", "formula": "C9H8O", "note": "계피 향의 주성분" }]
   화학식의 숫자는 자동으로 아래첨자로 바뀝니다. 비어 있으면 빈 표가 나옵니다. */
const formula = (f) => esc(f || "").replace(/(\d+)/g, "<sub>$1</sub>");
function compoundsTable(list = []) {
  const rows = list.length
    ? list
        .map(
          (c) => `<tr>
            <td>${esc(c.name || "")}${c.name_en ? `<span class="roman">${esc(c.name_en)}</span>` : ""}</td>
            <td class="formula">${formula(c.formula)}</td>
            <td>${esc(c.note || "")}</td>
          </tr>`
        )
        .join("")
    : `<tr class="empty"><td colspan="3">아직 정리 중이에요</td></tr>`;
  return `<table class="compounds-table">
    <thead><tr><th scope="col">성분</th><th scope="col">화학식</th><th scope="col">비고</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

/* ---------- 상세 페이지 (spice.html) ---------- */
function renderDetail(spices) {
  const main = document.getElementById("detail");
  const id = new URLSearchParams(location.search).get("id");
  const idx = spices.findIndex((s) => s.id === id);

  if (idx === -1) {
    main.innerHTML = `<p class="error">그런 서랍은 없어요. <a href="index.html">서랍장으로 돌아가기</a></p>`;
    return;
  }

  const s = spices[idx];
  document.title = `${s.name} · 너굴의 향신료상점`;
  const byId = Object.fromEntries(spices.map((x) => [x.id, x]));
  const chips = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join("");
  const pairChips = (s.pairs || [])
    .filter((p) => byId[p])
    .map((p) => `<li><a href="spice.html?id=${encodeURIComponent(p)}">${esc(byId[p].name)}</a></li>`)
    .join("");

  main.innerHTML = `
    <article class="card">
      <div class="card-side">
        <div class="card-image">
          <img src="${esc(s.image)}" alt="${esc(s.name)}"
               onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'placeholder',textContent:'${esc(s.emoji || "🫙")}'}))">
        </div>
        <dl class="origin">
          <dt>원산지</dt>
          <dd>${esc(s.origin)}</dd>
        </dl>
        ${s.credit ? `<p class="credit">이미지: ${esc(s.credit)}</p>` : ""}
      </div>
      <div class="card-body">
        <span class="tag">${esc(s.category)}</span>
        <h2>${esc(s.name)}</h2>
        ${namesTable(s)}
        <p class="summary">${esc(s.summary)}</p>
        <p>${esc(s.description)}</p>

        <h3>이렇게 써요</h3>
        <ul class="chips">${chips(s.uses)}</ul>

        ${pairChips ? `<h3>잘 어울리는 친구</h3><ul class="chips">${pairChips}</ul>` : ""}

        <h3>주요 화학 성분</h3>
        ${compoundsTable(s.compounds)}
      </div>
    </article>`;

  // 이전/다음 서랍
  const prev = spices[(idx - 1 + spices.length) % spices.length];
  const next = spices[(idx + 1) % spices.length];
  document.getElementById("pager").innerHTML = `
    <a href="spice.html?id=${encodeURIComponent(prev.id)}">← ${esc(prev.name)}</a>
    <a href="spice.html?id=${encodeURIComponent(next.id)}">${esc(next.name)} →</a>`;
}

/* ---------- 시작 ---------- */
loadSpices()
  .then((spices) => {
    if (document.getElementById("cabinet")) renderCabinet(spices);
    if (document.getElementById("detail")) renderDetail(spices);
  })
  .catch((err) => {
    const target = document.getElementById("cabinet") || document.getElementById("detail");
    target.innerHTML = `<p class="error">${esc(err.message)}<br>(로컬에서는 파일을 직접 열지 말고 간이 서버로 열어 주세요)</p>`;
    console.error(err);
  });
