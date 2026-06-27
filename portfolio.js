// ============================================
// JETRO PORTFOLIO — Interaction & Analytics
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // 1. TABS LOGIC
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      // Add active to clicked
      btn.classList.add('active');
      const targetId = 'tab-' + btn.dataset.tab;
      document.getElementById(targetId).classList.add('active');
    });
  });

  // 2. EBITDA SIMULATOR LOGIC
  const sliders = {
    aov: document.getElementById('aov'),
    delivery: document.getElementById('delivery'),
    commission: document.getElementById('commission'),
    cogs: document.getElementById('cogs')
  };

  const fmt = (num) => '₹' + Math.round(num).toLocaleString('en-IN');

  function updateEbitda() {
    if (!sliders.aov) return;

    const aov = +sliders.aov.value;
    const delivery = +sliders.delivery.value;
    const commPct = +sliders.commission.value / 100;
    const cogsPct = +sliders.cogs.value / 100;

    const cogsVal = aov * cogsPct;
    const grossMgn = aov - cogsVal;
    const commVal = aov * commPct;
    const totalCost = cogsVal + delivery + commVal;
    const contrib = aov - totalCost;
    const contribPct = (contrib / aov) * 100;

    // Update Labels
    document.getElementById('aov-label').textContent = fmt(aov);
    document.getElementById('delivery-label').textContent = fmt(delivery);
    document.getElementById('commission-label').textContent = sliders.commission.value + '%';
    document.getElementById('cogs-label').textContent = sliders.cogs.value + '%';

    // Update Result Panel
    document.getElementById('res-aov').textContent = fmt(aov);
    document.getElementById('res-cogs').textContent = '− ' + fmt(cogsVal);
    document.getElementById('res-gm').textContent = fmt(grossMgn);
    document.getElementById('res-del').textContent = '− ' + fmt(delivery);
    document.getElementById('res-comm').textContent = '− ' + fmt(commVal);

    const contribEl = document.getElementById('res-contribution');
    const pctEl = document.getElementById('res-pct');
    contribEl.textContent = fmt(contrib);
    pctEl.textContent = contribPct.toFixed(1) + '%';

    if (contrib >= 0) {
      contribEl.className = 'rl-val positive';
      pctEl.className = 'rl-val positive';
    } else {
      contribEl.className = 'rl-val negative';
      pctEl.className = 'rl-val negative';
    }

    // Verdict Logic
    let verdict = '';
    if (contrib < 0) {
      const breakevenAov = totalCost / (1 - cogsPct) * (1 / (1 - commPct));
      verdict = `<strong>Loss-making order.</strong> At ₹${Math.round(aov)} AOV and ₹${Math.round(delivery)} delivery, every order destroys ₹${Math.abs(Math.round(contrib))} of value. Breakeven AOV required: ~₹${Math.round(breakevenAov).toLocaleString('en-IN')}.`;
    } else if (contribPct < 8) {
      verdict = `<strong>Marginal contribution.</strong> ${contribPct.toFixed(1)}% margin is insufficient to cover overheads (warehousing/tech). Optimise AOV or commission.`;
    } else if (contribPct < 15) {
      verdict = `<strong>Viable but fragile.</strong> ${contribPct.toFixed(1)}% margin is achievable but sensitive to delivery cost volatility.`;
    } else {
      verdict = `<strong>Healthy unit economics.</strong> ${contribPct.toFixed(1)}% margin supports overhead absorption and reinvestment.`;
    }
    document.getElementById('verdict-text').innerHTML = verdict;

    // Bar Chart Update
    const maxRef = Math.max(aov, totalCost) * 1.1;
    document.getElementById('bar-aov').style.width = Math.min((aov / maxRef) * 100, 100) + '%';
    document.getElementById('bar-cost').style.width = Math.min((totalCost / maxRef) * 100, 100) + '%';
    
    const profitBar = document.getElementById('bar-profit');
    if (contrib >= 0) {
      profitBar.style.width = Math.min((contrib / maxRef) * 100, 100) + '%';
      profitBar.style.backgroundColor = '#10b981';
    } else {
      profitBar.style.width = '2%';
      profitBar.style.backgroundColor = '#ef4444';
    }

    document.getElementById('barnum-aov').textContent = fmt(aov);
    document.getElementById('barnum-cost').textContent = fmt(totalCost);
    document.getElementById('barnum-profit').textContent = fmt(contrib);
  }

  if (sliders.aov) {
    Object.values(sliders).forEach(s => s.addEventListener('input', updateEbitda));
    updateEbitda();
  }

  // 3. ANIMATE KPI NUMBERS
  const animateValue = (id, start, end, duration, prefix = '', suffix = '') => {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const val = Math.floor(progress * (end - start) + start);
      obj.innerHTML = prefix + val + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // Run animations when scrolled into view
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateValue('kpi-projects', 0, 12, 1500);
      animateValue('kpi-value', 0, 180, 2000, '₹', ' Cr');
      animateValue('kpi-frameworks', 0, 15, 1500);
      animateValue('kpi-tools', 0, 8, 1000);
      observer.disconnect();
      initCharts(); // Initialize charts when visible
    }
  });
  
  const kpiSection = document.getElementById('performance');
  if (kpiSection) observer.observe(kpiSection);

  // 4. CHART.JS INITIALIZATION
  function initCharts() {
    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    const colors = {
      saffron: '#e8a020',
      saffronLt: 'rgba(232, 160, 32, 0.4)',
      green: '#10b981',
      ink: '#0a0f1e',
      slate: '#475569'
    };

    // Chart 1: Skill Radar
    const ctxRadar = document.getElementById('chart-radar');
    if (ctxRadar) {
      new Chart(ctxRadar, {
        type: 'radar',
        data: {
          labels: ['Financial Modeling', 'Frameworks (MECE/SCQA)', 'Python/AI', 'Data Vis (PowerBI)', 'Data pipelines', 'Executive Comms'],
          datasets: [{
            label: 'Skill Proficiency',
            data: [90, 85, 80, 95, 75, 85],
            backgroundColor: colors.saffronLt,
            borderColor: colors.saffron,
            pointBackgroundColor: colors.saffron,
            borderWidth: 2
          }]
        },
        options: {
          scales: {
            r: {
              angleLines: { color: 'rgba(255,255,255,0.1)' },
              grid: { color: 'rgba(255,255,255,0.1)' },
              pointLabels: { color: '#cbd5e1', font: { size: 11 } },
              ticks: { display: false }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // Chart 2: Timeline
    const ctxTime = document.getElementById('chart-timeline');
    if (ctxTime) {
      new Chart(ctxTime, {
        type: 'line',
        data: {
          labels: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'],
          datasets: [{
            label: 'Cumulative Modeled Value (₹ Cr)',
            data: [10, 25, 45, 90, 140, 180],
            borderColor: colors.saffron,
            backgroundColor: 'rgba(232, 160, 32, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#fff'
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Chart 3: Domain Cover
    const ctxDomain = document.getElementById('chart-domain');
    if (ctxDomain) {
      new Chart(ctxDomain, {
        type: 'doughnut',
        data: {
          labels: ['Supply Chain / Q-Commerce', 'SME AI Automation', 'EdTech BI', 'Corporate Strategy'],
          datasets: [{
            data: [40, 25, 20, 15],
            backgroundColor: [
              colors.saffron,
              '#3b82f6',
              colors.green,
              colors.slate
            ],
            borderWidth: 0
          }]
        },
        options: {
          cutout: '70%',
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, padding: 20 } }
          }
        }
      });
    }

    // Chart 4: Improvement Metrics (Before/After)
    const ctxImp = document.getElementById('chart-improvement');
    if (ctxImp) {
      new Chart(ctxImp, {
        type: 'bar',
        data: {
          labels: ['SME Query Time', 'Supply Safety Stock', 'BI Report Latency', 'Q-Comm Margins'],
          datasets: [
            {
              label: 'Before Intervention (Index)',
              data: [100, 100, 100, -20],
              backgroundColor: colors.slate
            },
            {
              label: 'After JETRO Frameworks (Index)',
              data: [15, 45, 10, 15],
              backgroundColor: colors.saffron
            }
          ]
        },
        options: {
          plugins: { legend: { position: 'top' } },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

});
