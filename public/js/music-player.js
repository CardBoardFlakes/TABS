(() => {
  const JSON_PATH = new URL('/mfrontEndData.json', location.origin).href;
  const playlistEl = document.getElementById('playlist');
  const typeFilter = document.getElementById('type-filter');
  const searchInput = document.getElementById('search-input');

  const audio = document.getElementById('global-audio');
  const cpTitle = document.getElementById('cp-title');
  const cpPlayBtn = document.getElementById('cp-play');
  const cpPrevBtn = document.getElementById('cp-prev');
  const cpNextBtn = document.getElementById('cp-next');

  let tracks = [];     
  let filtered = [];    
  let currentExtID = null;

  async function loadTracks() {
    try {
      const res = await fetch(JSON_PATH, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to fetch ${JSON_PATH}: ${res.status}`);
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error(`${JSON_PATH} did not return an array.`);
      tracks = raw.map(t => ({
        extID: t.extID ?? t.id ?? null,
        name: String(t.name ?? 'placeholder'),
        musicfile: new URL(t.musicfile ?? t.musicFile ?? '', location.origin).href,
        type: String(t.type ?? ''),
        image: t.Image ?? t.image ?? ''
      }));
      applyFilters();
      restoreFromStorage();
    } catch (err) {
      console.error('Failed to load tracks from', JSON_PATH, err);
      if (playlistEl) playlistEl.innerHTML = '<p class="error">Failed to load playlist data.</p>';
    }
  }


  function applyFilters() {
    const type = (typeFilter && typeFilter.value) || '';
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();

    filtered = tracks.filter(t => {
      const matchType = !type || t.type === type;
      const hay = (t.name + ' ' + (t.type || '')).toLowerCase();
      const matchQuery = !q || hay.includes(q);
      return matchType && matchQuery;
    });

    renderPlaylist();
  }


  function renderPlaylist() {
    if (!playlistEl) return;
    if (!filtered.length) {
      playlistEl.innerHTML = '<p class="muted">No tracks found.</p>';
      return;
    }

    playlistEl.innerHTML = '';
    filtered.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.innerHTML = `
        <div class="pi-left">
          <div class="pi-title">${escapeHtml(t.name)}</div>
          <div class="pi-artist">${escapeHtml(t.type)}</div>
        </div>
        <div class="pi-right">
          <button class="pi-play" data-index="${i}">Play</button>
        </div>
      `;
      playlistEl.appendChild(item);
    });


    playlistEl.querySelectorAll('.pi-play').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.dataset.index);
        playFilteredIndex(idx);
        saveToStorage();
      });
    });
  }


  function playFilteredIndex(idx) {
    const track = filtered[idx];
    if (!track) return;
    currentExtID = track.extID;
    setAudioSource(track.musicfile, `${track.name} [${track.type}]`);
    audio.play().catch(()=>{}); 
    updateUI();
  }


  function setAudioSource(src, title) {
    if (!src) return;

    if (audio.src !== src) {
      audio.src = src;
    }
    cpTitle.textContent = title || 'Playing';
  }


  function saveToStorage() {
    const state = {
      src: audio.src || '',
      title: cpTitle.textContent || '',
      time: audio.currentTime || 0,
      extID: currentExtID,
      state: audio.paused ? 'paused' : 'playing'
    };
    try {
      localStorage.setItem('music_state', JSON.stringify(state));
    } catch (e) {

    }
  }


  function restoreFromStorage() {
    const raw = localStorage.getItem('music_state');
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      if (state.src) {
        if (audio.src !== state.src) audio.src = state.src;
        cpTitle.textContent = state.title || 'Playing';


        audio.addEventListener('loadedmetadata', () => {
          if (state.time) {

            const t = Math.min(state.time, audio.duration || state.time);
            audio.currentTime = t;
          }
          if (state.state === 'playing') {
            audio.play().catch(()=>{}); 
          } else {
            audio.pause();
          }
          updateUI();
        }, { once: true });
      } else {

      }
      currentExtID = state.extID ?? null;
    } catch (e) {
      console.warn('Failed to parse music state', e);
    }
  }


  function updateUI() {
    if (!cpPlayBtn) return;
    cpPlayBtn.textContent = audio.paused ? '▶️' : '⏸';
  }

 
  function prevNext(delta) {
    if (!filtered.length) return;
    let pos = -1;
    if (currentExtID != null) {
      pos = filtered.findIndex(t => t.extID === currentExtID);
    }
    if (pos === -1 && audio.src) {
      pos = filtered.findIndex(t => t.musicfile === audio.src);
    }
    if (pos === -1) pos = 0;
    pos = (pos + delta + filtered.length) % filtered.length;
    playFilteredIndex(pos);
    saveToStorage();
  }


  window.addEventListener('storage', (e) => {
    if (e.key !== 'music_state') return;

    restoreFromStorage();

    updateUI();
  });


  audio.addEventListener('timeupdate', throttle(saveToStorage, 1000));
  window.addEventListener('beforeunload', saveToStorage);


  if (cpPlayBtn) {
    cpPlayBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(()=>{});
      } else {
        audio.pause();
      }
      updateUI();
      saveToStorage();
    });
  }

  if (cpPrevBtn) cpPrevBtn.addEventListener('click', () => prevNext(-1));
  if (cpNextBtn) cpNextBtn.addEventListener('click', () => prevNext(1));


  audio.addEventListener('play', () => {
    updateUI();
    saveToStorage();
  });
  audio.addEventListener('pause', () => {
    updateUI();
    saveToStorage();
  });

  audio.addEventListener('ended', () => {
    prevNext(1);
  });


  if (typeFilter) typeFilter.addEventListener('change', applyFilters);
  if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 200));


  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (m) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function debounce(fn, ms) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }

  function throttle(fn, ms) {
    let last = 0;
    return (...a) => {
      const now = Date.now();
      if (now - last > ms) {
        last = now;
        fn(...a);
      }
    };
  }

  loadTracks();
})();