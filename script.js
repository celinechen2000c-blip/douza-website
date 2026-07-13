document.documentElement.classList.add('js-ready');

document.addEventListener('DOMContentLoaded', () => {
  const launcher = document.getElementById('assistantLauncher');
  const panel = document.getElementById('assistantPanel');
  const closeBtn = document.getElementById('assistantClose');
  const messages = document.getElementById('assistantMessages');
  const form = document.getElementById('assistantForm');
  const input = document.getElementById('assistantInput');
  const quickQuestions = document.getElementById('quickQuestions');

  const answers = {
    'Bean 是一名什么样的产品经理？': 'Bean 是一名偏“产品思考 + 快速构建”的 AI 产品经理。她擅长从真实用户问题出发，判断是否应该使用 AI，并把模型能力、产品规则、交互反馈和评测指标组合成完整体验。',
    '带我看看她最有代表性的 Demo': 'Bean 目前重点展示两个 Demo：\n\n1. AI 声音陪练师：面向老年人的诗词朗诵与语音陪伴产品，注重适老化设计与情感关怀。\n2. AI 产品方案诊断器：通过结构化对话帮助用户补齐 AI 产品方案，覆盖用户问题、AI 价值、风险评测与 MVP 定义四个模块。\n\n我已经带你跳转到 Demos 区域。',
    '她如何设计 AI 产品？': '她通常按这条路径推进：\n\n场景判断 → 用户任务拆解 → AI 与规则分工 → 交互与人工确认 → 失败路径 → 评测指标 → 最小 Demo 验证。\n\n重点不是“接入一个模型”，而是让 AI 真正完成用户任务。',
    '她有哪些项目经历？': '她目前展示的核心项目包括 AI 声音陪练师和 AI 产品方案诊断器，分别覆盖语音交互、适老化 AI 陪伴、Agent 工作流、风险设计和产品评测。更多内容可以在 About 和 Demos 中查看。',
    '如何联系 Bean？': '你可以通过邮箱 celinechen2000c@gmail.com 联系 Bean，也可以访问她的 GitHub：github.com/celinechen2000c-blip。'
  };

  const openAssistant = () => {
    // 使用 Dify 聊天机器人
    if (window.difyChatbot && typeof window.difyChatbot.open === 'function') {
      window.difyChatbot.open();
      return;
    }
    // 兜底：如果 Dify 未加载，回退到原有面板
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.style.display = 'none';
  };

  const closeAssistant = () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.style.display = 'flex';
  };

  const addMessage = (text, type) => {
    const el = document.createElement('div');
    el.className = `message ${type}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  };

  const getAnswer = (question) => {
    if (answers[question]) return answers[question];
    const q = question.toLowerCase();
    if (q.includes('demo') || q.includes('项目')) return answers['带我看看她最有代表性的 Demo'];
    if (q.includes('联系') || q.includes('邮箱') || q.includes('微信')) return answers['如何联系 Bean？'];
    if (q.includes('设计') || q.includes('方法') || q.includes('流程')) return answers['她如何设计 AI 产品？'];
    if (q.includes('产品经理') || q.includes('bean')) return answers['Bean 是一名什么样的产品经理？'];
    return '这个问题目前还没有预设答案。你可以点击上面的推荐问题，或通过邮箱直接联系 Bean。';
  };

  const reply = (question) => {
    addMessage(question, 'user');
    window.setTimeout(() => {
      addMessage(getAnswer(question), 'bot');
      if (question.toLowerCase().includes('demo')) {
        document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  launcher?.addEventListener('click', openAssistant);
  closeBtn?.addEventListener('click', closeAssistant);
  quickQuestions?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) reply(button.textContent.trim());
  });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    input.value = '';
    reply(question);
  });

  document.querySelectorAll('[data-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById(button.dataset.modal)?.showModal();
    });
  });

  document.querySelectorAll('.case-modal, .article-modal').forEach((modal) => {
    modal.querySelector('.modal-close')?.addEventListener('click', () => modal.close());
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.close();
    });
  });

  /* ====== 语音朗诵 ====== */
  const poemBtn = document.getElementById('poemPlayBtn');
  const poemWave = document.getElementById('poemWave');
  if (poemBtn) {
    let isPlaying = false;
    let activeAudio = null;
    const poemLines = [
      '从明天起，做一个幸福的人。',
      '喂马、劈柴，周游世界。',
      '从明天起，关心粮食和蔬菜。',
      '我有一所房子，',
      '面朝大海，春暖花开。',
    ];

    /* 方案 A：同域 Vercel API 生成“云健”浑厚神经男声 */
    const neuralTTS = async (text) => {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error(`TTS request failed: ${response.status}`);
      const audioUrl = URL.createObjectURL(await response.blob());
      return new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        activeAudio = audio;
        const cleanup = () => {
          URL.revokeObjectURL(audioUrl);
          if (activeAudio === audio) activeAudio = null;
        };
        audio.onended = () => { cleanup(); resolve(); };
        audio.onerror = () => { cleanup(); reject(new Error('Audio playback failed')); };
        audio.play().catch((error) => { cleanup(); reject(error); });
      });
    };

    const speakAll = async () => {
      const text = poemLines.join('\n');
      try {
        await neuralTTS(text);
      } catch (_) {
        if (!isPlaying) return;
        await new Promise(resolve => setTimeout(resolve, 800));
        await neuralTTS(text);
      }
    };

    const speakPoem = async () => {
      if (isPlaying) {
        activeAudio?.pause(); activeAudio = null;
        speechSynthesis.cancel(); isPlaying = false;
        poemBtn.textContent = '🔊 点击收听朗诵'; poemWave?.classList.remove('active');
        return;
      }
      isPlaying = true;
      poemBtn.textContent = '⏳ 正在生成朗诵'; poemWave?.classList.add('active');
      try {
        await speakAll();
      } catch (_) {
        isPlaying = false;
        poemBtn.textContent = '朗诵加载失败，请重试';
        poemWave?.classList.remove('active');
        return;
      }
      isPlaying = false;
      poemBtn.textContent = '🔊 点击收听朗诵'; poemWave?.classList.remove('active');
    };

    poemBtn.addEventListener('click', speakPoem);
  }

  /* ====== 诊断器侧边栏切换 ====== */
  const diagSidebar = document.querySelector('.diag-sidebar');
  if (diagSidebar) {
    const diagButtons = diagSidebar.querySelectorAll('button[data-step]');
    const diagPanels = document.querySelectorAll('.diag-panel[data-step]');
    const diagProgress = document.querySelector('.diagnosis-grid .progress i');

    diagButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = btn.dataset.step;
        diagButtons.forEach((b) => b.classList.remove('active'));
        diagPanels.forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPanel = document.querySelector(`.diag-panel[data-step="${step}"]`);
        if (targetPanel) targetPanel.classList.add('active');
        if (diagProgress) diagProgress.style.width = `${(parseInt(step) / 4) * 100}%`;
      });
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
  }
});
