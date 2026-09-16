// V5.5.2 · lliurament robust de Tasca 1
(() => {
  const TASK_ID = 'a1';
  const CLIENT_VERSION = '5.5.2';
  let busy = false;
  let deliveredGrade = null;

  const dlgNow = () => document.getElementById('task1ActivityDialog');

  function ensureStatus(dlg) {
    let status = dlg && dlg.querySelector('#task1SubmitStatus');
    if (status) return status;
    const resultSection = dlg && dlg.querySelector('.task1-result-section');
    if (!resultSection) return null;
    status = document.createElement('div');
    status.id = 'task1SubmitStatus';
    status.className = 'task1-submit-status';
    resultSection.appendChild(status);
    return status;
  }

  function collectAnswers(dlg) {
    return {
      scienceTechnology: [...dlg.querySelectorAll('#t1a1 select[data-answer]')].map(s => s.value),
      scientificMethod: [...(dlg.querySelector('#t1a2 .task1-order-list')?.children || [])].map(li => li.dataset.value),
      trueFalse: [...dlg.querySelectorAll('#t1a3 .task1-qrow[data-answer]')].map(r => r.querySelector('input[type="radio"]:checked')?.value || ''),
      technologicalProcess: [...(dlg.querySelector('#t1a4 .task1-order-list')?.children || [])].map(li => li.dataset.value),
      phaseFunctions: [...dlg.querySelectorAll('#t1a5 select[data-answer]')].map(s => s.value),
      projectApplication: [...dlg.querySelectorAll('#t1a6 select[data-answer]')].map(s => s.value)
    };
  }

  function unansweredCount(a) {
    return [...a.scienceTechnology, ...a.trueFalse, ...a.phaseFunctions, ...a.projectApplication].filter(v => !v).length;
  }

  function fmtGrade(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('ca-ES', {minimumFractionDigits:1, maximumFractionDigits:1}) : String(value ?? '');
  }

  function cloudReady() {
    try {
      return typeof serverCall === 'function' &&
             typeof accessToken !== 'undefined' && !!accessToken &&
             typeof saveRuntime !== 'undefined' && !!saveRuntime?.cloudEnabled;
    } catch (_) {
      return false;
    }
  }

  function schemaVersion() {
    try { return typeof SCHEMA_VERSION !== 'undefined' ? SCHEMA_VERSION : 5; }
    catch (_) { return 5; }
  }

  function lockDeliveredTask(dlg, grade) {
    if (!dlg) return;
    deliveredGrade = Number(grade);
    dlg.dataset.delivered = 'true';
    dlg.querySelectorAll('select,input[type="radio"],.task1-order-list button').forEach(el => el.disabled = true);
    const check = dlg.querySelector('#task1Check');
    const retry = dlg.querySelector('#task1Retry');
    const submit = dlg.querySelector('#task1Submit');
    if (check) check.disabled = true;
    if (retry) retry.disabled = true;
    if (submit) {
      submit.disabled = true;
      submit.textContent = '✓ Tasca lliurada';
      submit.setAttribute('aria-disabled', 'true');
    }
    const status = ensureStatus(dlg);
    if (status) {
      status.className = 'task1-submit-status ok';
      status.textContent = `✓ Tasca lliurada correctament. Nota registrada al Drive: ${fmtGrade(grade)}/10.`;
    }
  }

  async function syncDeliveredState(dlg) {
    if (!dlg || dlg.dataset.v552Checking === 'true' || dlg.dataset.delivered === 'true') return;
    if (!cloudReady()) return;
    dlg.dataset.v552Checking = 'true';
    try {
      const r = await serverCall('getActivityControl', {
        accessToken,
        clientVersion: CLIENT_VERSION,
        schemaVersion: schemaVersion()
      });
      const grade = r?.grades?.[TASK_ID];
      if (r?.ok && grade !== undefined && grade !== null && grade !== '') lockDeliveredTask(dlg, grade);
    } catch (err) {
      console.warn('No s\'ha pogut comprovar si la Tasca 1 ja estava lliurada', err);
    } finally {
      delete dlg.dataset.v552Checking;
    }
  }

  async function robustSubmit(dlg, btn) {
    if (!dlg || busy) return;
    const status = ensureStatus(dlg);
    if (!status) {
      console.error('No s\'ha trobat l\'àrea d\'estat del lliurament');
      return;
    }
    if (dlg.dataset.delivered === 'true' || deliveredGrade !== null) {
      lockDeliveredTask(dlg, deliveredGrade);
      return;
    }

    const answers = collectAnswers(dlg);
    const missing = unansweredCount(answers);
    if (missing && !confirm(`Encara tens ${missing} respostes sense contestar. Comptaran com a incorrectes.\n\nVols entregar igualment la tasca?`)) return;
    if (!confirm('Vols entregar definitivament la Tasca 1?\n\nUn cop lliurada, no es podrà tornar a entregar.')) return;

    busy = true;
    btn.disabled = true;
    btn.textContent = 'Entregant…';
    status.className = 'task1-submit-status pending';
    status.textContent = 'Calculant i guardant la nota al Drive…';

    try {
      if (!cloudReady()) throw new Error('SERVER_NOT_AVAILABLE');
      const r = await serverCall('submitActivityGrade', {
        accessToken,
        activityId: TASK_ID,
        answers,
        clientVersion: CLIENT_VERSION,
        schemaVersion: schemaVersion()
      });

      if (!r?.ok) {
        if (r?.status === 'ALREADY_SUBMITTED' && r?.grade10 !== undefined && r?.grade10 !== null) {
          lockDeliveredTask(dlg, r.grade10);
          return;
        }
        throw new Error(r?.message || r?.status || 'SUBMIT_FAILED');
      }

      const grade = Number(r.grade10);
      try {
        if (typeof state !== 'undefined' && state) {
          state.activitySubmissions = state.activitySubmissions || {};
          state.activitySubmissions[TASK_ID] = {
            grade10: grade,
            points: r.points,
            total: r.total,
            percent: r.percent,
            submittedAt: r.submittedAt || new Date().toISOString(),
            attempt: r.attempt || 1
          };
        }
      } catch (_) {}
      try { if (typeof activityState === 'function') activityState(TASK_ID).done = true; } catch (_) {}
      try { if (typeof persist === 'function') await persist(true, {forceSnapshot:true, forceCloud:true}); } catch (err) { console.warn('La nota s\'ha guardat, però el dossier no ha pogut fer snapshot', err); }

      lockDeliveredTask(dlg, grade);
      try { if (typeof toast === 'function') toast('✓ Tasca lliurada i nota registrada'); } catch (_) {}
    } catch (err) {
      console.error('No s\'ha pogut entregar la Tasca 1', err);
      status.className = 'task1-submit-status bad';
      status.textContent = 'No s\'ha pogut confirmar el registre de la nota al Drive. La tasca NO consta com lliurada. Torna-ho a provar.';
      btn.disabled = false;
      btn.textContent = '✓ Entregar la tasca';
    } finally {
      busy = false;
    }
  }

  const stale = dlgNow();
  if (stale) stale.remove();

  document.addEventListener('click', (event) => {
    const submit = event.target.closest?.('#task1Submit');
    if (submit) {
      event.preventDefault();
      event.stopImmediatePropagation();
      robustSubmit(submit.closest('dialog') || dlgNow(), submit);
      return;
    }
    if (event.target.closest?.('[data-open-task1]')) {
      setTimeout(() => syncDeliveredState(dlgNow()), 350);
    }
  }, true);

  const observer = new MutationObserver(() => {
    const dlg = dlgNow();
    if (!dlg) return;
    ensureStatus(dlg);
    if (dlg.open && dlg.dataset.delivered !== 'true') syncDeliveredState(dlg);
  });
  observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['open']});

  const style = document.createElement('style');
  style.textContent = `
    #task1ActivityDialog[data-delivered="true"] .task1-submit { opacity:.78; cursor:not-allowed; }
    #task1ActivityDialog[data-delivered="true"] select:disabled,
    #task1ActivityDialog[data-delivered="true"] input:disabled,
    #task1ActivityDialog[data-delivered="true"] .task1-order-list button:disabled { cursor:not-allowed; opacity:.65; }
    .task1-submit-status.ok { margin-top:14px; padding:13px 15px; border-radius:12px; background:#e8f7ee; color:#146c3a; font-weight:800; }
    .task1-submit-status.bad { margin-top:14px; padding:13px 15px; border-radius:12px; background:#fff0f0; color:#9f2222; font-weight:750; }
    .task1-submit-status.pending { margin-top:14px; padding:13px 15px; border-radius:12px; background:#eef5ff; color:#225c9f; font-weight:750; }
  `;
  document.head.appendChild(style);

  console.info('Hotfix Tasca 1 V5.5.2 carregat');
})();
