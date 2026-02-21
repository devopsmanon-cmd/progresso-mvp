/* Progresso Ultra MVP
   - Landing + App
   - LocalStorage
   - CRUD + Drag & Drop
   - CSV Export
   - Daily limit + remaining
   - i18n FR/EN (persisted)
*/

(function(){
  const STORAGE_KEY = "progresso_ultra_v1";
  const LANG_KEY = "progresso_lang";
  // ---------- i18n ----------
  const I18N = {
    fr: {
      landing_subtitle: "Tracker intelligent de candidatures",
      open_app: "Ouvrir l’app",
      hero_title: "Suivi clair. Relances maîtrisées. Décisions rapides.",
      hero_text: "Progresso te permet de suivre tes candidatures dans un pipeline simple : À envoyer → Accepté, avec notes, relances et export CSV.",
      start_now: "Commencer maintenant",
      see_pipeline: "Voir le pipeline",
      feat_kanban_title: "Pipeline Kanban",
      feat_kanban_text: "Glisser-déposer tes candidatures par statut.",
      feat_follow_title: "Relance",
      feat_follow_text: "Ajoute une date de relance + notes entreprise.",
      feat_csv_title: "Export CSV",
      feat_csv_text: "Télécharge ton historique en 1 clic.",
      landing_note: "Version MVP Free — données stockées localement sur ton appareil.",

      app_subtitle: "Tracker intelligent de candidatures",
      landing: "Landing",
      export_csv: "Exporter CSV",
      add_btn: "+ Ajouter",

      stat_total: "Total",
      stat_interviews: "Entretiens",
      stat_accepted: "Acceptés",
      stat_rejected: "Refus",
      stat_remaining: "Restantes aujourd’hui",
      stat_overdue: "Relances en retard",
      overdue_banner: (n) => `⚠ ${n} relance${n > 1 ? "s" : ""} en retard`,

      project_label: "Projet :",
      project_hint: "1 projet (MVP)",

      modal_new: "Nouvelle candidature",
      modal_edit: "Modifier candidature",
      field_company: "Entreprise *",
      field_role: "Poste",
      field_status: "Statut",
      field_followup: "Date de relance",
      field_notes: "Notes entreprise",
      delete: "Supprimer",
      cancel: "Annuler",
      save: "Enregistrer",

      alert_limit: (n) => `Limite atteinte : ${n} candidatures aujourd’hui.`,
      alert_company_required: "Entreprise obligatoire.",
      confirm_delete: "Supprimer cette candidature ?",

      badge_follow: (d) => `Relance : ${d}`,
      badge_overdue: "Relance en retard",
      badge_notes: "Notes",

      statuses: {
        to_send: "À envoyer",
        sent: "Envoyé",
        follow_up: "Relance",
        interview: "Entretien",
        rejected: "Refus",
        accepted: "Accepté",
      }
    },
    en: {
      landing_subtitle: "Smart application tracker",
      open_app: "Open app",
      hero_title: "Clear tracking. Controlled follow-ups. Fast decisions.",
      hero_text: "Progresso helps you track your job applications in a simple pipeline: To send → Accepted, with notes, follow-ups and CSV export.",
      start_now: "Start now",
      see_pipeline: "See pipeline",
      feat_kanban_title: "Kanban Pipeline",
      feat_kanban_text: "Drag & drop applications by status.",
      feat_follow_title: "Follow-up",
      feat_follow_text: "Add a follow-up date + company notes.",
      feat_csv_title: "CSV Export",
      feat_csv_text: "Download your history in one click.",
      landing_note: "Free MVP — data stored locally on your device.",

      app_subtitle: "Smart application tracker",
      landing: "Landing",
      export_csv: "Export CSV",
      add_btn: "+ Add",

      stat_total: "Total",
      stat_interviews: "Interviews",
      stat_accepted: "Accepted",
      stat_rejected: "Rejected",
      stat_remaining: "Remaining today",
      stat_overdue: "Overdue follow-ups",
      overdue_banner: (n) => `⚠ ${n} overdue follow-up${n > 1 ? "s" : ""}`,

      project_label: "Project:",
      project_hint: "1 project (MVP)",

      modal_new: "New application",
      modal_edit: "Edit application",
      field_company: "Company *",
      field_role: "Role",
      field_status: "Status",
      field_followup: "Follow-up date",
      field_notes: "Company notes",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",

      alert_limit: (n) => `Limit reached: ${n} applications today.`,
      alert_company_required: "Company is required.",
      confirm_delete: "Delete this application?",

      badge_follow: (d) => `Follow-up: ${d}`,
      badge_overdue: "Overdue follow-up",
      badge_notes: "Notes",

      statuses: {
        to_send: "To send",
        sent: "Sent",
        follow_up: "Follow-up",
        interview: "Interview",
        rejected: "Rejected",
        accepted: "Accepted",
      }
    }
  };

  function getLang(){
    const saved = localStorage.getItem(LANG_KEY);
    return (saved === "en" || saved === "fr") ? saved : "fr";
  }
  function setLang(lang){
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    applyI18n();
  }
  function t(){
    return I18N[getLang()];
  }
  function applyI18n(){
    const dict = t();
    document.querySelectorAll("[data-i18n]").forEach(node => {
      const key = node.getAttribute("data-i18n");
      const val = dict[key];
      if (typeof val === "string") node.textContent = val;
    });
  }

  // ---------- State ----------
  const STATUSES = ["to_send","sent","follow_up","interview","rejected","accepted"];

  function defaultState(){
    return {
      projectName: "Recherche DevOps 2026",
      applications: [], // {id, company, role, status, followUp, notes, createdAt, updatedAt}
      dailyLimit: 10,
    };
  }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if(!parsed || !Array.isArray(parsed.applications)) return defaultState();
      return { ...defaultState(), ...parsed };
    }catch{
      return defaultState();
    }
  }
  function saveState(state){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid(){
    return "app_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function todayISO(){
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDate(iso){
    if(!iso) return "";
    const [y,m,d] = iso.split("-");
    if(!y||!m||!d) return iso;
    return getLang()==="fr" ? `${d}/${m}/${y}` : `${y}-${m}-${d}`;
  }
  function isOverdue(app){
    return !!(app.followUp && app.followUp < todayISO());
  }
  function sortAppsForColumn(list){
    return list.slice().sort((a,b) => {
      const ao = isOverdue(a) ? 1 : 0;
      const bo = isOverdue(b) ? 1 : 0;
      if(bo !== ao) return bo - ao;

      const ad = a.followUp || "9999-12-31";
      const bd = b.followUp || "9999-12-31";
      if(ad !== bd) return ad.localeCompare(bd);

      return (b.updatedAt || "").localeCompare(a.updatedAt || "") || (b.id || "").localeCompare(a.id || "");
    });
  }

  // ---------- Landing init ----------
  function initLanding(){
    // set initial lang in UI
    const lang = getLang();
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    applyI18n();

    const select = document.getElementById("langSelectLanding");
    if(select){
      select.value = lang;
      select.addEventListener("change", () => setLang(select.value));
    }
  }
function handleDailyReset(){
  const today = new Date().toISOString().slice(0,10);
  const lastDate = localStorage.getItem(DATE_KEY);

  if(lastDate !== today){
    localStorage.setItem(DATE_KEY, today);
    localStorage.setItem(REMAINING_KEY, DAILY_LIMIT);
  }

  return parseInt(localStorage.getItem(REMAINING_KEY),10);
}
  // ---------- App ----------
  function initApp(){
    const state = loadState();
    // Set lang
    const lang = getLang();
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    applyI18n();

    // Elements (safe getters)
    const $ = (id) => document.getElementById(id);

    const pipeline = $("pipeline");
    const projectName = $("projectName");
    const btnAdd = $("btnAdd");
    const fabAdd = $("fabAdd");
    const btnExport = $("btnExport");

    const statTotal = $("statTotal");
    const statInterview = $("statInterview");
    const statAccepted = $("statAccepted");
    const statRejected = $("statRejected");
    const statRemaining = $("statRemaining");
    const statOverdue = $("statOverdue");
    const overdueBanner = $("overdueBanner");

    const modal = $("modal");
    const form = $("form");
    const modalTitle = $("modalTitle");
    const editingId = $("editingId");
    const company = $("company");
    const role = $("role");
    const status = $("status");
    const followUp = $("followUp");
    const notes = $("notes");
    const btnClose = $("btnClose");
    const btnCancel = $("btnCancel");
    const btnDelete = $("btnDelete");

    // Language select
    const langSelect = $("langSelectApp");
    if(langSelect){
      langSelect.value = lang;
      langSelect.addEventListener("change", () => {
        setLang(langSelect.value);
        // re-render labels/status select + cards
        fillStatusSelect();
        render();
      });
    }

    // Guard: if required elements missing, stop gracefully
    const required = [pipeline, projectName, btnAdd, btnExport, statTotal, statInterview, statAccepted, statRejected, statRemaining, statOverdue,
                      modal, form, modalTitle, editingId, company, role, status, followUp, notes, btnClose, btnCancel, btnDelete];
    if(required.some(x => !x)){
      console.error("Progresso: Missing required DOM elements. Check app.html IDs.");
      return;
    }

    function countTodayAdds(){
      const tday = todayISO();
      return state.applications.filter(a => (a.createdAt||"").slice(0,10) === tday).length;
    }
    function remainingToday(){
      return Math.max(0, state.dailyLimit - countTodayAdds());
    }
    function canAddToday(){
      return countTodayAdds() < state.dailyLimit;
    }
    function countOverdue(){
      return state.applications.filter(isOverdue).length;
    }

    function statusLabel(key){
      return t().statuses[key] || key;
    }

    function buildColumns(){
      pipeline.innerHTML = "";
      STATUSES.forEach((key) => {
        const col = document.createElement("div");
        col.className = "column";
        col.dataset.status = key;

        const header = document.createElement("div");
        header.className = "col-header";

        const title = document.createElement("div");
        title.className = "col-title";
        title.textContent = statusLabel(key);

        const count = document.createElement("div");
        count.className = "col-count";
        count.id = `count_${key}`;
        count.textContent = "0";

        header.append(title, count);

        const body = document.createElement("div");
        body.className = "col-body";
        body.dataset.dropzone = key;

        body.addEventListener("dragover", (e) => {
          e.preventDefault();
          body.classList.add("dragover");
        });
        body.addEventListener("dragleave", () => body.classList.remove("dragover"));
        body.addEventListener("drop", (e) => {
          e.preventDefault();
          body.classList.remove("dragover");
          const id = e.dataTransfer.getData("text/plain");
          if(!id) return;
          moveToStatus(id, key);
        });

        col.append(header, body);
        pipeline.append(col);
      });
    }

   function createCard(app){
  const card = document.createElement("div");
  card.className = "card";

  // animation apparition
  card.classList.add("enter");
  requestAnimationFrame(() => {
    card.classList.add("enter-active");
    card.classList.remove("enter");
  });

  card.draggable = true;
  card.dataset.id = app.id;
      card.addEventListener("dragstart", (e) => {
        card.classList.add("dragging");
        e.dataTransfer.setData("text/plain", app.id);
        e.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", () => card.classList.remove("dragging"));

      card.addEventListener("click", () => openEdit(app.id));

      const top = document.createElement("div");
      top.className = "card__top";

      const left = document.createElement("div");

      const c = document.createElement("div");
      c.className = "card__company";
      c.textContent = app.company || "(—)";

      const r = document.createElement("div");
      r.className = "card__role";
      r.textContent = app.role ? app.role : "—";

      left.append(c, r);

      const meta = document.createElement("div");
      meta.className = "card__meta";

      const right = document.createElement("div");
      right.className = `badge status s-${app.status}`;
      right.textContent = statusLabel(app.status);
      meta.append(right);

      if(app.followUp){
        const today = todayISO();
        if(app.followUp < today){
          const overdue = document.createElement("span");
          overdue.className = "badge-overdue";
          overdue.textContent = t().badge_overdue;
          meta.append(overdue);
        }
      }

      top.append(left, meta);

      const badges = document.createElement("div");
      badges.className = "badges";

      if(app.followUp){
        const b = document.createElement("div");
        b.className = "badge";
        b.textContent = t().badge_follow(formatDate(app.followUp));
        badges.append(b);
      }
      if(app.notes){
        const b = document.createElement("div");
        b.className = "badge";
        b.textContent = t().badge_notes;
        badges.append(b);
      }

      card.append(top);
      if(badges.childNodes.length) card.append(badges);
      return card;
    }

    function render(){
      projectName.value = state.projectName || "";

      // Clear columns
      STATUSES.forEach((key) => {
        const body = pipeline.querySelector(`.col-body[data-dropzone="${key}"]`);
        if(body) body.innerHTML = "";
      });

      // Render per column with overdue-first sorting
      STATUSES.forEach((key) => {
        const body = pipeline.querySelector(`.col-body[data-dropzone="${key}"]`);
        if(!body) return;
        const apps = sortAppsForColumn(state.applications.filter(a => a.status === key));
        apps.forEach(app => body.append(createCard(app)));
      });

      // Column counts + update titles (in case language changed)
      STATUSES.forEach((key) => {
        const n = state.applications.filter(a => a.status === key).length;
        const c = document.getElementById(`count_${key}`);
        if(c) c.textContent = String(n);

        const col = pipeline.querySelector(`.column[data-status="${key}"] .col-title`);
        if(col) col.textContent = statusLabel(key);
      });

      // Stats
      statTotal.textContent = String(state.applications.length);
      statInterview.textContent = String(state.applications.filter(a => a.status === "interview").length);
      statAccepted.textContent = String(state.applications.filter(a => a.status === "accepted").length);
      statRejected.textContent = String(state.applications.filter(a => a.status === "rejected").length);
      statRemaining.textContent = String(remainingToday());
      const overdue = countOverdue();
      statOverdue.textContent = String(overdue);
      if(overdueBanner){
        overdueBanner.hidden = overdue === 0;
        overdueBanner.textContent = t().overdue_banner(overdue);
      }

      saveState(state);
    }

    function fillStatusSelect(){
      status.innerHTML = "";
      STATUSES.forEach((key) => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = statusLabel(key);
        status.append(opt);
      });
    }

    function openCreate(){
      if(!canAddToday()){
        alert(t().alert_limit(state.dailyLimit));
        return;
      }

      modalTitle.textContent = t().modal_new;
      editingId.value = "";
      company.value = "";
      role.value = "";
      status.value = "to_send";
      followUp.value = "";
      notes.value = "";
      btnDelete.hidden = true;

      if(typeof modal.showModal === "function") modal.showModal();
      else alert("Dialog not supported by your browser.");
    }

    function openEdit(id){
      const app = state.applications.find(a => a.id === id);
      if(!app) return;

      modalTitle.textContent = t().modal_edit;
      editingId.value = id;
      company.value = app.company || "";
      role.value = app.role || "";
      status.value = app.status || "to_send";
      followUp.value = app.followUp || "";
      notes.value = app.notes || "";
      btnDelete.hidden = false;

      if(typeof modal.showModal === "function") modal.showModal();
    }

    function closeModal(){
      if(modal.open) modal.close();
    }

    function addApplication(data){
      const now = new Date().toISOString();
      state.applications.push({
        id: uid(),
        company: data.company.trim(),
        role: (data.role||"").trim(),
        status: data.status || "to_send",
        followUp: data.followUp || "",
        notes: (data.notes||"").trim(),
        createdAt: now,
        updatedAt: now,
      });
      render();
    }

    function updateApplication(id, data){
      const idx = state.applications.findIndex(a => a.id === id);
      if(idx === -1) return;
      state.applications[idx] = {
        ...state.applications[idx],
        company: data.company.trim(),
        role: (data.role||"").trim(),
        status: data.status,
        followUp: data.followUp || "",
        notes: (data.notes||"").trim(),
        updatedAt: new Date().toISOString(),
      };
      render();
    }

    function deleteApplication(id){
      state.applications = state.applications.filter(a => a.id !== id);
      render();
    }

    function moveToStatus(id, newStatus){
      const app = state.applications.find(a => a.id === id);
      if(!app) return;
      app.status = newStatus;
      app.updatedAt = new Date().toISOString();
      render();
    }

    function csvEscape(v){
      const s = String(v ?? "");
      return `"${s.replace(/"/g, '""')}"`;
    }

    function exportCSV(){
      const headers = ["id","company","role","status","followUp","notes","createdAt","updatedAt","project"];
      const rows = state.applications.map(a => ([
        a.id,
        a.company,
        a.role,
        statusLabel(a.status),
        a.followUp,
        a.notes,
        a.createdAt,
        a.updatedAt,
        state.projectName || ""
      ]));

      const csv = [
        headers.map(csvEscape).join(","),
        ...rows.map(r => r.map(csvEscape).join(","))
      ].join("\n");

      const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `progresso_${todayISO()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    // Events
    btnAdd.addEventListener("click", openCreate);
    fabAdd && fabAdd.addEventListener("click", openCreate);
    btnExport.addEventListener("click", exportCSV);

    projectName.addEventListener("input", (e) => {
      state.projectName = String(e.target.value || "").slice(0,40);
      saveState(state);
    });

    btnClose.addEventListener("click", closeModal);
    btnCancel.addEventListener("click", closeModal);

    btnDelete.addEventListener("click", () => {
      const id = editingId.value;
      if(!id) return;
      if(!confirm(t().confirm_delete)) return;
      deleteApplication(id);
      closeModal();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = {
        company: company.value,
        role: role.value,
        status: status.value,
        followUp: followUp.value,
        notes: notes.value,
      };

      if(!data.company || !data.company.trim()){
        alert(t().alert_company_required);
        return;
      }

      const id = editingId.value;
      if(id) updateApplication(id, data);
      else addApplication(data);

      closeModal();
    });

    // Click outside dialog closes it
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const inDialog = rect.top <= e.clientY && e.clientY <= rect.bottom &&
                       rect.left <= e.clientX && e.clientX <= rect.right;
      if(!inDialog) closeModal();
    });

    // Init
    fillStatusSelect();
    buildColumns();
    applyI18n();
    render();
  }

  // Expose init functions for pages
  window.Progresso = { initLanding, initApp, setLang, getLang };

})();
// ------------------------------
// Drag & Drop (Trello-like)
// ------------------------------
let draggedId = null;


  function enableDragAndDrop() {
  // 1) rendre les cartes draggable
  document.querySelectorAll(".card").forEach((card) => {
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", (e) => {
      card.classList.add("dragging");
      e.dataTransfer.setData("text/plain", card.dataset.id);
      e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });
  });

  // 2) gérer le drop sur les colonnes
  document.querySelectorAll(".column").forEach((col) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault(); // obligatoire
      col.classList.add("drop-hover");
    });

    col.addEventListener("dragleave", () => {
      col.classList.remove("drop-hover");
    });

    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("drop-hover");

      const id = e.dataTransfer.getData("text/plain");
      if (!id) return;

      moveCardToStatus(id, col.dataset.status);
    });
  });
}

// Fonction attendue : adapte-la à ton stockage
function moveCardToStatus(id, newStatus) {
  // 👉 Ici on utilise TON tableau de candidatures en mémoire
  // Remplace "state.items" par ton vrai store si besoin
  const item = state.items.find(x => String(x.id) === String(id));
  if (!item) return;

  item.status = newStatus;

  saveState();   // ta fonction existante
  renderApp();   // ta fonction existante

  // IMPORTANT : on réactive le drag&drop après re-render
  enableDragAndDrop();
}
enableDragAndDrop();
