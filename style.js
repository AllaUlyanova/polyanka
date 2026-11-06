/* Общий скрипт стилей «Лайт» и «Продающий»: шапка, палитры для галереи, мессенджеры, запись и калькулятор. Без библиотек. */
(() => {
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // шапка: тень после прокрутки
  const bar = document.querySelector("[data-s-bar]");
  const onScroll = () => bar && bar.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // палитры для галереи: ?p=Б или postMessage({ palette: "Б" }) из окна галереи
  const pals = body.dataset.sPalettes ? JSON.parse(body.dataset.sPalettes) : null;
  const applyPalette = (k) => {
    if (!pals || !pals[k]) return;
    for (const [v, hex] of Object.entries(pals[k].vars)) document.documentElement.style.setProperty("--c-" + v, hex);
  };
  if (pals) {
    const q = new URLSearchParams(location.search).get("p"); if (q) applyPalette(q);
    addEventListener("message", (e) => { if (e.data && e.data.palette) applyPalette(e.data.palette); });
  }

  // появление секций (только «Продающий»)
  const rev = document.querySelectorAll(".s-reveal");
  if (rev.length && "IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    rev.forEach((el) => io.observe(el));
  } else rev.forEach((el) => el.classList.add("is-in"));

  // ---- сообщение в мессенджер
  const brand = (document.querySelector(".s-bar__brand") || {}).textContent || "";
  let message = "Здравствуйте! Пишу с сайта «" + brand.trim() + "».";
  const bubble = document.querySelector("[data-s-bubble]");
  const setMessage = (t) => { message = t; if (bubble) bubble.textContent = t; };
  const isSlot = (s) => !s || /\{\{/.test(s);
  const digits = (s) => String(s).replace(/\D/g, "");
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-s-msg]"); if (!a) return;
    e.preventDefault();
    if (a.hasAttribute("data-s-needs-consent") && !a.closest("form").querySelector("[data-s-consent]").checked) return;
    const kind = a.dataset.sMsg;
    if (kind === "max") {
      // MAX не принимает готовый текст по ссылке: копируем его и открываем чат
      try { await navigator.clipboard.writeText(message); } catch (_) {}
      const note = document.querySelector("[data-s-copied]");
      if (note) { note.hidden = false; setTimeout(() => (note.hidden = true), 4000); }
      window.open(body.dataset.max, "_blank", "noopener"); return;
    }
    // Telegram и MAX не принимают готовый текст по ссылке: копируем его и открываем чат
    try { await navigator.clipboard.writeText(message); } catch (_) {}
    const note = a.closest("form, .s-contacts")?.parentElement?.querySelector("[data-s-copied]") || document.querySelector("[data-s-copied]");
    if (note) { note.hidden = false; setTimeout(() => (note.hidden = true), 4000); }
    const tg = body.dataset.tg; const user = isSlot(tg) ? "" : String(tg).replace(/^@|https?:\/\/t\.me\//g, "");
    window.open("https://t.me/" + user, "_blank", "noopener");
  });

// ---- согласие на обработку данных (152-ФЗ): кнопка отправки неактивна без галочки
  document.addEventListener("change", (e) => {
    const c = e.target.closest("[data-s-consent]"); if (!c) return;
    c.closest("form").querySelectorAll("[data-s-needs-consent]").forEach((b) => b.setAttribute("aria-disabled", c.checked ? "false" : "true"));
  });

  // ---- MAX: кнопки и согласие видны, только когда в data-max указана ссылка на чат; иначе – звонок
  (() => {
    const has = /^https:\/\/max\.ru\//.test(body.dataset.max || "");
    document.querySelectorAll("[data-s-msg=max], [data-s-maxonly]").forEach((el) => (el.hidden = !has));
    document.querySelectorAll("[data-s-nomax]").forEach((el) => (el.hidden = has));
  })();

  // ---- cookie-баннер и Яндекс Метрика (152-ФЗ): Метрика грузится только после «Принять»
  (() => {
    const KEY = "cookie_consent", DAYS = 365;
    const getChoice = () => { const m = document.cookie.match(/(?:^|; )cookie_consent=([^;]*)/); return m ? m[1] : ""; };
    const setChoice = (v) => { document.cookie = KEY + "=" + v + "; max-age=" + DAYS * 86400 + "; path=/; SameSite=Lax"; };
    const loadMetrika = () => {
      const id = body.dataset.ym; if (!/^\d+$/.test(id || "") || window.__ymLoaded) return;
      window.__ymLoaded = true;
      (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      window.ym(+id, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
    };
    let box = null;
    const close = () => { if (box) { box.remove(); box = null; } };
    const choose = (v) => { setChoice(v); close(); if (v === "all") loadMetrika(); };
    const show = () => {
      if (box) return;
      box = document.createElement("div");
      box.className = "s-cookie"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Файлы cookie");
      box.innerHTML = '<p>Сайт использует cookie. Необходимые работают всегда, Яндекс Метрика включится только после «Принять». Подробнее – в <a href="privacy.html">политике обработки персональных данных</a>.</p><div class="s-cookie__btns"><button type="button" class="s-btn s-btn--sm" data-c="all">Принять</button><button type="button" class="s-btn s-btn--sm s-btn--ghost" data-c="necessary">Только необходимые</button></div>';
      box.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b) choose(b.dataset.c); });
      document.body.appendChild(box);
    };
    document.addEventListener("click", (e) => { if (e.target.closest("[data-s-cookie-open]")) { e.preventDefault(); show(); } });
    const c = getChoice();
    if (c === "all") loadMetrika(); else if (c !== "necessary") show();
  })();

  // неразрывные пробелы: сумма не рвётся переносом
  const rub = (n) => Math.round(n).toLocaleString("ru-RU").replace(/[   ]/g, " ") + " ₽";

  // ---- онлайн-запись
  const booking = document.querySelector("[data-s-booking]");
  if (booking) {
    const daysBox = booking.querySelector("[data-s-days]"), timesBox = booking.querySelector("[data-s-times]");
    const closed = (booking.dataset.closed || "").split(",").filter(Boolean).map(Number);
    const slots = (booking.dataset.slots || "").split(",").filter(Boolean);
    const wd = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], mon = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    const today = new Date(); let made = 0;
    for (let i = 0; made < +booking.dataset.days && i < 21; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      if (closed.includes(d.getDay())) continue;
      const label = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : wd[d.getDay()] + ", " + d.getDate() + " " + mon[d.getMonth()];
      const full = (i < 2 ? label.toLowerCase() + ", " : "") + wd[d.getDay()] + " " + d.getDate() + " " + mon[d.getMonth()];
      daysBox.insertAdjacentHTML("beforeend", `<label class="s-chip"><input type="radio" name="day" value="${made}" data-full="${full}"${made === 0 ? " checked" : ""}><span>${label}</span></label>`);
      made++;
    }
    const drawTimes = () => {
      const first = daysBox.querySelector("input:checked")?.value === "0" && !closed.includes(today.getDay()); // правка: в выходной первый день в списке – уже завтра
      const nowH = today.getHours() + today.getMinutes() / 60;
      timesBox.innerHTML = "";
      let firstFree = true;
      slots.forEach((t) => {
        const [h, m] = t.split(":").map(Number); const past = first && h + m / 60 <= nowH + 1;
        timesBox.insertAdjacentHTML("beforeend", `<label class="s-chip"${past ? ' aria-disabled="true"' : ""}><input type="radio" name="time" value="${t}"${past ? " disabled" : firstFree ? " checked" : ""}><span>${t}</span></label>`);
        if (!past) firstFree = false;
      });
      if (firstFree) timesBox.insertAdjacentHTML("beforeend", `<p class="s-demo">На сегодня окна закончились – выберите другой день.</p>`);
    };
    const update = () => {
      const s = booking.querySelector("input[name=svc]:checked"), d = daysBox.querySelector("input:checked"), t = timesBox.querySelector("input:checked");
      const price = s && s.dataset.price ? " (" + (s.dataset.from ? "от " : "") + rub(+s.dataset.price) + ")" : "";
      setMessage(booking.dataset.message.replace("{услуга}", s ? s.dataset.name + price : "").replace("{день}", d ? d.dataset.full : "").replace("{время}", t ? t.value : "время уточню"));
    };
    daysBox.addEventListener("change", () => { drawTimes(); update(); });
    booking.addEventListener("change", update);
    drawTimes();
    // на сегодня окна закончились – сразу выбираем следующий день
    if (!timesBox.querySelector("input:not([disabled])")) { const next = daysBox.querySelectorAll("input")[1]; if (next) { next.checked = true; drawTimes(); } }
    update();
  }

  // ---- калькулятор
  const calc = document.querySelector("[data-s-calc]");
  if (calc) {
    const per = JSON.parse(calc.dataset.per || "{}"); // { "canvas": "area" } – цена варианта умножается на значение поля area
    const totalEl = calc.querySelector("[data-s-total]");
    let shown = 0;
    const animateTo = (v) => {
      if (reduce) { totalEl.textContent = rub(v); shown = v; return; }
      const from = shown, t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 280); totalEl.textContent = rub(from + (v - from) * k); if (k < 1) requestAnimationFrame(step); else shown = v; };
      requestAnimationFrame(step);
    };
    const val = (id) => { const el = calc.querySelector(`input[type=range][name="${id}"]`); return el ? +el.value : 1; };
    const update = () => {
      let total = +calc.dataset.base || 0; const picks = [];
      // поля в порядке, как они стоят в форме: так и сообщение читается по-человечески
      calc.querySelectorAll("input").forEach((el) => {
        if (el.type === "range") {
          calc.querySelector(`[data-s-out="${el.name}"]`).textContent = el.value;
          total += (+el.dataset.price || 0) * +el.value;
          picks.push(el.dataset.say ? el.dataset.say.replace("{v}", el.value) : el.dataset.label.toLowerCase() + " " + el.value + (el.dataset.unit ? " " + el.dataset.unit : ""));
        } else if (el.type === "radio" && el.checked) {
          total += (+el.dataset.price || 0) * (per[el.name] ? val(per[el.name]) : 1);
          picks.push(el.dataset.label.toLowerCase());
        } else if (el.type === "checkbox" && el.checked) {
          total += (+el.dataset.price || 0) * (per[el.name] ? val(per[el.name]) : 1);
          picks.push(el.dataset.label.toLowerCase());
        }
      });
      const min = +calc.dataset.min || 0; let minNote = "";
      if (min && total < min) { total = min; minNote = " (" + calc.dataset.minNote + ")"; }
      animateTo(total);
      setMessage(calc.dataset.message.replace("{выбор}", picks.join(", ")).replace("{итого}", rub(total) + minNote));
    };
    calc.addEventListener("input", update); calc.addEventListener("change", update); update();
  }
})();
