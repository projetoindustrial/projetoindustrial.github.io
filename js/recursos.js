// Recursos O&G — Catálogo com busca e filtros

(function () {
  let allRecursos = [];
  let filtered = [];
  let currentTema = 'todos';
  let paginasTematicas = {};

  const grid = document.getElementById('recursosGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');
  const totalCount = document.getElementById('totalCount');
  const searchInput = document.getElementById('globalSearch');
  const filterPlataforma = document.getElementById('filterPlataforma');
  const filterTipo = document.getElementById('filterTipo');
  const filterCategoria = document.getElementById('filterCategoria');
  const clearBtn = document.getElementById('clearFilters');
  const resetEmpty = document.getElementById('resetEmpty');
  const tematicasBar = document.getElementById('tematicasBar');

  // ===== Load data =====
  async function loadData() {
    try {
      const res = await fetch('data/recursos-og-offshore.json');
      if (!res.ok) throw new Error('Falha ao carregar JSON');
      const data = await res.json();

      allRecursos = data.recursos || [];
      paginasTematicas = data.paginas_tematicas || {};

      if (totalCount) totalCount.textContent = data.meta?.total || allRecursos.length;

      populateFilters(data.filtros || {});
      applyFilters();
    } catch (err) {
      console.error(err);
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Erro ao carregar recursos</h3>
          <p>Verifique se o arquivo <code>data/recursos-og-offshore.json</code> está presente.</p>
        </div>`;
    }
  }

  // ===== Populate select filters =====
  function populateFilters(filtros) {
    const addOptions = (select, items) => {
      if (!select || !items) return;
      // Keep "Todas/Todos"
      items.forEach(item => {
        if (!item) return;
        const opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        select.appendChild(opt);
      });
    };

    addOptions(filterPlataforma, filtros.plataformas);
    addOptions(filterTipo, filtros.tipos);
    addOptions(filterCategoria, filtros.categorias);
  }

  // ===== Thematic filter logic =====
  function matchesTema(recurso, tema) {
    if (tema === 'todos') return true;
    const config = paginasTematicas[tema];
    if (!config || !config.filtros_sugeridos) return true;

    const f = config.filtros_sugeridos;

    // Plataformas
    if (f.plataformas && f.plataformas.length) {
      if (f.plataformas.includes(recurso.plataforma)) return true;
    }

    // Tags contains
    if (f.tags_contem && f.tags_contem.length) {
      const tags = (recurso.tags || []).map(t => t.toLowerCase());
      if (f.tags_contem.some(t => tags.some(rt => rt.includes(t.toLowerCase())))) return true;
    }

    // Categorias
    if (f.categorias && f.categorias.length) {
      if (f.categorias.includes(recurso.categoria)) return true;
    }

    // If no specific match rules hit, check tags more loosely for known themes
    const tagsStr = (recurso.tags || []).join(' ').toLowerCase() + ' ' +
                    (recurso.categoria || '').toLowerCase() + ' ' +
                    (recurso.area || '').toLowerCase() + ' ' +
                    (recurso.observacoes || '').toLowerCase();

    const keywords = {
      'vagas-comunidades': ['whatsapp', 'telegram', 'discord', 'grupo whatsapp', 'canal', 'vagas offshore', 'vagas de emprego', 'boarding vacancy', 'grupo de vagas', 'grupo de empregos', 'página de vagas', 'pagina de vagas'],
      'manutencao-pcm': ['manutenção', 'manutencao', 'pcm', 'confiabilidade'],
      'hse-seguranca': ['hse', 'segurança', 'seguranca', 'sms', 'sesmt'],
      'dados-regulacao': ['anp', 'bsee', 'boem', 'dados', 'regulação', 'regulacao', 'estatíst'],
      'empresas-carreiras': ['carreira', 'carreiras', 'vagas', 'emprego', 'operadora'],
      'normas-certificacao': ['norma', 'certificação', 'certificacao', 'acredit'],
      'subsea-integridade': ['subsea', 'integridade', 'inspeção', 'inspecao'],
      'portos-logistica': ['porto', 'portos', 'logística', 'logistica', 'terminal'],
      'petroquimica': ['petroquím', 'petroquim']
    };

    const keys = keywords[tema] || [];
    return keys.some(k => tagsStr.includes(k));
  }

  // ===== Main filter =====
  function applyFilters() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    const plat = filterPlataforma?.value || '';
    const tipo = filterTipo?.value || '';
    const cat = filterCategoria?.value || '';

    filtered = allRecursos.filter(r => {
      // Thematic
      if (!matchesTema(r, currentTema)) return false;

      // Platform
      if (plat && r.plataforma !== plat) return false;

      // Type
      if (tipo && r.tipo !== tipo) return false;

      // Category
      if (cat && r.categoria !== cat) return false;

      // Text search
      if (q) {
        const haystack = [
          r.categoria, r.area, r.tipo, r.plataforma,
          r.observacoes, r.link,
          ...(r.tags || [])
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    render();
  }

  // ===== Render cards =====
  function render() {
    if (!grid) return;

    resultsCount.textContent = `${filtered.length} recurso${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    grid.innerHTML = filtered.map(r => {
      const tagsHtml = (r.tags || []).slice(0, 4).map(t =>
        `<span class="recurso-tag">${escapeHtml(t)}</span>`
      ).join('');

      const link = r.link && r.link.startsWith('http') ? r.link : '#';
      const hasLink = link !== '#';

      return `
        <a class="recurso-card" href="${escapeHtml(link)}" target="${hasLink ? '_blank' : '_self'}" rel="noopener noreferrer">
          <div class="recurso-top">
            <span class="recurso-plataforma">${escapeHtml(r.plataforma || '—')}</span>
            <span class="recurso-tipo">${escapeHtml(r.tipo || '')}</span>
          </div>
          <h3>${escapeHtml(r.categoria || r.area || 'Recurso')}</h3>
          ${r.area ? `<div class="recurso-area">${escapeHtml(r.area)}</div>` : ''}
          ${r.observacoes ? `<p class="recurso-obs">${escapeHtml(r.observacoes)}</p>` : ''}
          ${tagsHtml ? `<div class="recurso-tags">${tagsHtml}</div>` : ''}
          ${hasLink ? `<span class="recurso-link">Acessar →</span>` : ''}
        </a>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ===== Clear filters =====
  function clearAll() {
    if (searchInput) searchInput.value = '';
    if (filterPlataforma) filterPlataforma.value = '';
    if (filterTipo) filterTipo.value = '';
    if (filterCategoria) filterCategoria.value = '';
    currentTema = 'todos';
    document.querySelectorAll('.tema-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.tema-chip[data-tema="todos"]')?.classList.add('active');
    applyFilters();
  }

  // ===== Events =====
  searchInput?.addEventListener('input', debounce(applyFilters, 220));
  filterPlataforma?.addEventListener('change', applyFilters);
  filterTipo?.addEventListener('change', applyFilters);
  filterCategoria?.addEventListener('change', applyFilters);
  clearBtn?.addEventListener('click', clearAll);
  resetEmpty?.addEventListener('click', clearAll);

  tematicasBar?.addEventListener('click', (e) => {
    const chip = e.target.closest('.tema-chip');
    if (!chip) return;
    // Links navigate to subpages; only buttons with data-tema filter in-place
    if (chip.tagName === 'A' && chip.getAttribute('href') && !chip.dataset.tema) {
      return; // allow default navigation
    }
    e.preventDefault();
    document.querySelectorAll('.tema-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentTema = chip.dataset.tema || 'todos';
    applyFilters();
  });

  // Keyboard shortcut already handled in main.js for focus

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // Init
  loadData();
})();
