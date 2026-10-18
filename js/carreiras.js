// Carreiras & Bolsas — carrega portais e comunidades do JSON

(function () {
  const portaisGrid = document.getElementById('portaisGrid');
  const comunidadesGrid = document.getElementById('comunidadesGrid');
  const searchInput = document.getElementById('careerSearch');

  let allPortais = [];
  let allComunidades = [];

  async function loadData() {
    try {
      const res = await fetch('data/recursos-og-offshore.json');
      if (!res.ok) throw new Error('Falha ao carregar JSON');
      const data = await res.json();
      const recursos = data.recursos || [];

      // Portais de carreira e empresas de recrutamento
      allPortais = recursos.filter(r => {
        const text = (
          (r.categoria || '') + ' ' +
          (r.tipo || '') + ' ' +
          (r.area || '') + ' ' +
          (r.observacoes || '') + ' ' +
          (r.tags || []).join(' ')
        ).toLowerCase();

        return (
          r.tipo === 'Portal de carreiras' ||
          text.includes('portal de carreira') ||
          text.includes('carreiras') ||
          (r.categoria === 'Empresa' && text.includes('carreira')) ||
          text.includes('recrutamento')
        );
      });

      // Comunidades / grupos / canais de vagas
      allComunidades = recursos.filter(r => {
        const plat = (r.plataforma || '').toLowerCase();
        const text = (
          (r.categoria || '') + ' ' +
          (r.tipo || '') + ' ' +
          (r.observacoes || '') + ' ' +
          (r.tags || []).join(' ')
        ).toLowerCase();

        const isCommunityPlatform = ['whatsapp', 'telegram', 'facebook', 'instagram', 'linkedin', 'discord'].some(p => plat.includes(p));
        const isVagas = text.includes('vaga') || text.includes('emprego') || text.includes('recrut') || text.includes('grupo');

        return isCommunityPlatform && isVagas;
      });

      // Limit to avoid too many cards (keep most relevant)
      allPortais = allPortais.slice(0, 24);
      allComunidades = allComunidades.slice(0, 18);

      renderPortais(allPortais);
      renderComunidades(allComunidades);
    } catch (err) {
      console.error(err);
      if (portaisGrid) {
        portaisGrid.innerHTML = `<div class="empty-state"><p>Erro ao carregar dados. Verifique o arquivo JSON.</p></div>`;
      }
    }
  }

  function renderPortais(list) {
    if (!portaisGrid) return;
    if (list.length === 0) {
      portaisGrid.innerHTML = `<div class="empty-state"><p>Nenhum portal encontrado com os filtros atuais.</p></div>`;
      return;
    }

    portaisGrid.innerHTML = list.map(r => cardHtml(r)).join('');
  }

  function renderComunidades(list) {
    if (!comunidadesGrid) return;
    if (list.length === 0) {
      comunidadesGrid.innerHTML = `<div class="empty-state"><p>Nenhuma comunidade encontrada.</p></div>`;
      return;
    }

    comunidadesGrid.innerHTML = list.map(r => cardHtml(r)).join('');
  }

  function cardHtml(r) {
    const link = r.link && r.link.startsWith('http') ? r.link : '#';
    const hasLink = link !== '#';
    const tags = (r.tags || []).slice(0, 3).map(t =>
      `<span class="recurso-tag">${escapeHtml(t)}</span>`
    ).join('');

    return `
      <a class="recurso-card" href="${escapeHtml(link)}" target="${hasLink ? '_blank' : '_self'}" rel="noopener noreferrer">
        <div class="recurso-top">
          <span class="recurso-plataforma">${escapeHtml(r.plataforma || '—')}</span>
          <span class="recurso-tipo">${escapeHtml(r.tipo || '')}</span>
        </div>
        <h3>${escapeHtml(r.categoria || r.area || 'Recurso')}</h3>
        ${r.area ? `<div class="recurso-area">${escapeHtml(r.area)}</div>` : ''}
        ${r.observacoes ? `<p class="recurso-obs">${escapeHtml(r.observacoes)}</p>` : ''}
        ${tags ? `<div class="recurso-tags">${tags}</div>` : ''}
        ${hasLink ? `<span class="recurso-link">Acessar →</span>` : ''}
      </a>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Search
  function applySearch() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (!q) {
      renderPortais(allPortais);
      renderComunidades(allComunidades);
      return;
    }

    const match = (r) => {
      const hay = [
        r.categoria, r.area, r.tipo, r.plataforma,
        r.observacoes, ...(r.tags || [])
      ].join(' ').toLowerCase();
      return hay.includes(q);
    };

    renderPortais(allPortais.filter(match));
    renderComunidades(allComunidades.filter(match));
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  searchInput?.addEventListener('input', debounce(applySearch, 200));

  // Smooth scroll for tabs
  document.querySelectorAll('.career-tab[href^="#"]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const href = tab.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      document.querySelectorAll('.career-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  loadData();
})();
