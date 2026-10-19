// Página temática única (tema.html?t=<chave>) — filtra recursos do JSON conforme o tema

(function () {
  const TEMAS = {
    "dados-regulacao": {
      "titulo": "Dados & Regulação",
      "descricao": "Dados abertos, estatísticas de produção, regulação, ANP, BSEE, BOEM e bases técnicas para análise e conformidade."
    },
    "hse-seguranca": {
      "titulo": "HSE & Segurança",
      "descricao": "Segurança do Trabalho, HSE, SMS, SESMT, normas de segurança e recursos para profissionais de saúde e segurança no setor."
    },
    "manutencao-pcm": {
      "titulo": "Manutenção & PCM",
      "descricao": "Recursos de Planejamento e Controle de Manutenção, confiabilidade, gestão de ativos e engenharia de manutenção industrial e offshore."
    },
    "normas-certificacao": {
      "titulo": "Normas & Certificação",
      "descricao": "Normas técnicas, regras de classificação, certificação, acreditação e padrões da indústria de óleo e gás."
    },
    "petroquimica": {
      "titulo": "Petroquímica",
      "descricao": "Polos petroquímicos, empresas do setor químico e recursos relacionados à cadeia petroquímica brasileira."
    },
    "portos-logistica": {
      "titulo": "Portos & Logística",
      "descricao": "Complexos portuários, terminais, logística offshore, cabotagem e operações aquaviárias."
    },
    "subsea-integridade": {
      "titulo": "Subsea & Integridade",
      "descricao": "Sistemas submarinos, integridade de ativos, inspeção, poços, risers, umbilicais e operações offshore."
    },
    "vagas-comunidades": {
      "titulo": "Vagas & Comunidades",
      "descricao": "Grupos, canais e páginas de divulgação de vagas e networking profissional em óleo e gás, offshore e indústrias relacionadas."
    }
  };

  const grid = document.getElementById('recursosGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');
  const searchInput = document.getElementById('temaSearch');
  const clearBtn = document.getElementById('clearFilters');
  const resetEmpty = document.getElementById('resetEmpty');

  const params = new URLSearchParams(location.search);
  const tema = params.get('t') || document.body.dataset.tema || 'todos';
  const info = TEMAS[tema];

  function applyPageInfo() {
    const titulo = info ? info.titulo : 'Tema não encontrado';
    const el = (id) => document.getElementById(id);
    document.title = titulo + ' — Projeto Industrial';
    if (el('temaTitulo')) el('temaTitulo').textContent = titulo;
    if (el('temaCrumb')) el('temaCrumb').textContent = titulo;
    if (el('temaSubtitulo')) el('temaSubtitulo').textContent = info ? info.descricao : 'Escolha um tema no menu ou veja o catálogo completo.';
    const md = document.querySelector('meta[name="description"]');
    if (md && info) md.setAttribute('content', info.descricao);
    document.querySelectorAll('.sidebar-nav a.nav-item').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === 'tema.html?t=' + tema);
    });
  }
  applyPageInfo();
  let allRecursos = [];
  let filtered = [];
  let paginasTematicas = {};

  async function loadData() {
    try {
      const res = await fetch('data/recursos-og-offshore.json');
      if (!res.ok) throw new Error('Falha ao carregar JSON');
      const data = await res.json();
      allRecursos = data.recursos || [];
      paginasTematicas = data.paginas_tematicas || {};
      applyFilters();
    } catch (err) {
      console.error(err);
      if (grid) {
        grid.innerHTML = `<div class="empty-state"><h3>Erro ao carregar recursos</h3><p>Verifique o arquivo data/recursos-og-offshore.json</p></div>`;
      }
    }
  }

  function matchesTema(recurso, temaKey) {
    if (temaKey === 'todos') return true;
    if (!TEMAS[temaKey]) return false;

    // Match por plataforma em temas de comunidade
    if (temaKey === 'vagas-comunidades') {
      const plat = (recurso.plataforma || '').toLowerCase();
      const communityPlatforms = ['whatsapp', 'telegram', 'facebook', 'instagram', 'discord'];
      if (communityPlatforms.some(p => plat.includes(p))) return true;
    }

    const config = paginasTematicas[temaKey];
    if (config && config.filtros_sugeridos) {
      const f = config.filtros_sugeridos;
      if (f.plataformas && f.plataformas.length) {
        if (f.plataformas.includes(recurso.plataforma)) return true;
      }
      if (f.tags_contem && f.tags_contem.length) {
        const tags = (recurso.tags || []).map(t => t.toLowerCase());
        if (f.tags_contem.some(t => tags.some(rt => rt.includes(t.toLowerCase())))) return true;
      }
      if (f.categorias && f.categorias.length) {
        if (f.categorias.includes(recurso.categoria)) return true;
      }
    }

    return matchesKeywords(recurso, temaKey);
  }

  function matchesKeywords(recurso, temaKey) {
    const tagsStr = (
      (recurso.tags || []).join(' ') + ' ' +
      (recurso.categoria || '') + ' ' +
      (recurso.area || '') + ' ' +
      (recurso.tipo || '') + ' ' +
      (recurso.observacoes || '') + ' ' +
      (recurso.plataforma || '')
    ).toLowerCase();

    const keywords = {
      'vagas-comunidades': ['whatsapp', 'telegram', 'discord', 'grupo whatsapp', 'canal', 'vagas offshore', 'vagas de emprego', 'boarding vacancy', 'grupo de vagas', 'grupo de empregos', 'página de vagas', 'pagina de vagas'],
      'manutencao-pcm': ['manutenção', 'manutencao', 'pcm', 'confiabilidade', 'gestão de ativos', 'gestao de ativos'],
      'hse-seguranca': ['hse', 'segurança', 'seguranca', 'sms', 'sesmt', 'segurança do trabalho'],
      'dados-regulacao': ['anp', 'bsee', 'boem', 'dados', 'regulação', 'regulacao', 'estatíst', 'bdep', 'produção', 'producao'],
      'empresas-carreiras': ['carreira', 'carreiras', 'vaga', 'emprego', 'portal de carreira', 'recrut', 'trainee', 'estágio'],
      'normas-certificacao': ['norma', 'normas', 'certificação', 'certificacao', 'acredit', 'iso', 'api', 'classificação'],
      'subsea-integridade': ['subsea', 'integridade', 'inspeção', 'inspecao', 'poço', 'poco', 'umbilical', 'riser'],
      'portos-logistica': ['porto', 'portos', 'logística', 'logistica', 'terminal', 'aquaviário', 'cabotagem'],
      'petroquimica': ['petroquím', 'petroquim', 'química', 'quimica', 'polo petro', 'braskem', 'camaçari']
    };

    const keys = keywords[temaKey] || [];
    return keys.some(k => tagsStr.includes(k));
  }

  function applyFilters() {
    const q = (searchInput?.value || '').trim().toLowerCase();

    filtered = allRecursos.filter(r => {
      if (!matchesTema(r, tema)) return false;
      if (q) {
        const hay = [
          r.categoria, r.area, r.tipo, r.plataforma,
          r.observacoes, r.link, ...(r.tags || [])
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    render();
  }

  function render() {
    if (!grid) return;
    if (resultsCount) {
      resultsCount.textContent = `${filtered.length} recurso${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (emptyState) emptyState.hidden = true;

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

  function clearAll() {
    if (searchInput) searchInput.value = '';
    applyFilters();
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  searchInput?.addEventListener('input', debounce(applyFilters, 220));
  clearBtn?.addEventListener('click', clearAll);
  resetEmpty?.addEventListener('click', clearAll);

  loadData();
})();
