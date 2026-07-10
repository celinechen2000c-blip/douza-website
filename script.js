(function () {
  'use strict';

  // ==================== Canvas 粒子动画 ====================
  var width, height, largeHeader, canvas, ctx, points, target, animateHeader = true;

  function initHeader() {
    width = window.innerWidth;
    height = window.innerHeight;
    target = { x: width / 2, y: height / 2 };

    largeHeader = document.getElementById('large-header');
    largeHeader.style.height = height + 'px';

    canvas = document.getElementById('demo-canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');

    // 创建点阵
    points = [];
    for (var x = 0; x < width; x = x + width / 40) {
      for (var y = 0; y < height; y = y + height / 40) {
        var px = x + Math.random() * width / 40;
        var py = y + Math.random() * height / 40;
        var p = { x: px, originX: px, y: py, originY: py };
        points.push(p);
      }
    }

    // 为每个点找最近的 2 个点
    for (var i = 0; i < points.length; i++) {
      var closest = [];
      var p1 = points[i];
      for (var j = 0; j < points.length; j++) {
        var p2 = points[j];
        if (p1 === p2) continue;

        var placed = false;
        for (var k = 0; k < 2; k++) {
          if (!placed) {
            if (closest[k] === undefined) {
              closest[k] = p2;
              placed = true;
            }
          }
        }

        for (var kk = 0; kk < 2; kk++) {
          if (!placed) {
            if (getDistance(p1, p2) < getDistance(p1, closest[kk])) {
              closest[kk] = p2;
              placed = true;
            }
          }
        }
      }
      p1.closest = closest;
    }

    // 为每个点分配一个圆
    for (var ii = 0; ii < points.length; ii++) {
      var c = new Circle(points[ii], 2 + Math.random() * 2, 'rgba(255,255,255,0.3)');
      points[ii].circle = c;
    }
  }

  function addListeners() {
    if (!('ontouchstart' in window)) {
      window.addEventListener('mousemove', mouseMove);
    }
    window.addEventListener('scroll', scrollCheck);
    window.addEventListener('resize', resize);
  }

  function mouseMove(e) {
    var posx, posy;
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    target.x = posx;
    target.y = posy;
  }

  function scrollCheck() {
    if (document.body.scrollTop > height) animateHeader = false;
    else animateHeader = true;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    largeHeader.style.height = height + 'px';
    canvas.width = width;
    canvas.height = height;
  }

  function animate() {
    if (animateHeader) {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        if (Math.abs(getDistance(target, p)) < 200) {
          p.active = 0.2;
          p.circle.active = 0.4;
        } else if (Math.abs(getDistance(target, p)) < 800) {
          p.active = 0.06;
          p.circle.active = 0.15;
        } else if (Math.abs(getDistance(target, p)) < 1600) {
          p.active = 0.01;
          p.circle.active = 0.04;
        } else {
          p.active = 0;
          p.circle.active = 0;
        }

        drawLines(p);
        p.circle.draw();
      }
    }
    requestAnimationFrame(animate);
  }

  // 用原生 JS 替代 TweenLite 实现点位漂移
  function shiftPoint(p) {
    var duration = 5000 + 5000 * Math.random();
    var startX = p.x;
    var startY = p.y;
    var targetX = p.originX - 50 + Math.random() * 100;
    var targetY = p.originY - 50 + Math.random() * 100;
    var startTime = performance.now();

    function step(now) {
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      // easeInOut 缓动
      var t = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

      p.x = startX + (targetX - startX) * t;
      p.y = startY + (targetY - startY) * t;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        shiftPoint(p);
      }
    }

    requestAnimationFrame(step);
  }

  function drawLines(p) {
    if (!p.active) return;
    for (var i = 0; i < p.closest.length; i++) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.closest[i].x, p.closest[i].y);
      ctx.strokeStyle = 'rgba(156,217,249,' + p.active + ')';
      ctx.stroke();
    }
  }

  function Circle(pos, rad, color) {
    var _this = this;
    _this.pos = pos || null;
    _this.radius = rad || null;
    _this.color = color || null;

    this.draw = function () {
      if (!_this.active) return;
      ctx.beginPath();
      ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(156,217,249,' + _this.active + ')';
      ctx.fill();
    };
  }

  function getDistance(p1, p2) {
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  }

  // ==================== 时钟更新 ====================
  var timeElm = document.getElementById('time');

  function pad(val) {
    return val < 10 ? '0' + val : val;
  }

  function updateClock() {
    var time = new Date();
    var hours = time.getHours();
    var minutes = time.getMinutes();
    var seconds = time.getSeconds();

    timeElm.setAttribute('data-hours', pad(hours));
    timeElm.setAttribute('data-minutes', pad(minutes));
    timeElm.setAttribute('data-seconds', pad(seconds));
  }

  // 初始化时钟
  updateClock();
  setInterval(updateClock, 1000);

  // ==================== 鼠标追踪 → 3D 旋转 ====================
  var doc = document.documentElement;
  var clientWidth, clientHeight;
  var mouseX = 0;
  var mouseY = 0;
  var currentMX = 0;
  var currentMY = 0;

  function updateSize() {
    clientWidth = doc.clientWidth || window.innerWidth;
    clientHeight = doc.clientHeight || window.innerHeight;
  }
  updateSize();

  document.addEventListener('mousemove', function (e) {
    if (!clientWidth || !clientHeight) updateSize();
    mouseX = (clientWidth / 2 - e.clientX) / clientWidth;
    mouseY = (clientHeight / 2 - e.clientY) / clientHeight;
  });

  // 使用 requestAnimationFrame 做平滑插值
  function updateMouseTracking() {
    currentMX += (mouseX - currentMX) * 0.2;
    currentMY += (mouseY - currentMY) * 0.2;

    if (timeElm) {
      timeElm.style.setProperty('--mouse-x', currentMX);
      timeElm.style.setProperty('--mouse-y', currentMY);
    }

    requestAnimationFrame(updateMouseTracking);
  }

  requestAnimationFrame(updateMouseTracking);
  window.addEventListener('resize', updateSize);

  // ==================== 微信二维码弹窗 ====================
  var wechatButton = document.getElementById('wechat-button');
  var qrPopup = document.getElementById('wechat-qrcode-popup');

  function setQrVisible(visible) {
    qrPopup.classList.toggle('visible', visible);
    qrPopup.setAttribute('aria-hidden', String(!visible));
  }

  wechatButton.addEventListener('mouseenter', function () { setQrVisible(true); });
  wechatButton.addEventListener('mouseleave', function () { setQrVisible(false); });
  wechatButton.addEventListener('focus', function () { setQrVisible(true); });
  wechatButton.addEventListener('blur', function () { setQrVisible(false); });
  qrPopup.addEventListener('mouseleave', function () { setQrVisible(false); });

  // ==================== 启动 ====================
  function startApp() {
    if (window.innerWidth === 0 || window.innerHeight === 0) {
      // 等待布局完成
      requestAnimationFrame(startApp);
      return;
    }
    initHeader();
    initAnimation();
    addListeners();
  }

  startApp();

  function initAnimation() {
    animate();
    for (var i = 0; i < points.length; i++) {
      shiftPoint(points[i]);
    }
  }

  // ==================== 聊天面板交互 ====================
  var chatTrigger = document.getElementById('agent-chat-trigger');
  var chatPanel = document.getElementById('chat-panel');
  var chatOverlay = document.getElementById('chat-overlay');
  var chatCloseBtn = document.getElementById('chat-panel-close');
  var chatMessages = document.getElementById('chat-messages');
  var chatInput = document.getElementById('chat-input');
  var chatSend = document.getElementById('chat-send');
  var isChatOpen = false;
  var conversationId = '';
  var isStreaming = false;

  // Dify API 配置
  var API_URL = 'https://api.dify.ai/v1/chat-messages';
  var API_KEY = 'app-vjTvHKAgnDwU8kTf0d2yldqK';

  function openPanel() {
    if (isChatOpen) return;
    isChatOpen = true;
    chatPanel.classList.add('visible');
    chatOverlay.classList.add('visible');
    chatPanel.setAttribute('aria-hidden', 'false');
    chatOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { chatInput.focus(); }, 400);
  }

  function closePanel() {
    if (!isChatOpen) return;
    if (document.activeElement) document.activeElement.blur();
    isChatOpen = false;
    chatPanel.classList.remove('visible');
    chatOverlay.classList.remove('visible');
    chatPanel.setAttribute('aria-hidden', 'true');
    chatOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // 关闭时重置对话
    conversationId = '';
  }

  // ---- 消息渲染 ----

  function addMessage(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + role;

    // 只有 Agent 消息显示头像
    if (role !== 'user') {
      var avatar = document.createElement('img');
      avatar.className = 'chat-bubble-avatar';
      avatar.src = '人物形象.png';
      avatar.alt = '';
      bubble.appendChild(avatar);
    }

    var textEl = document.createElement('div');
    textEl.className = 'chat-bubble-text';
    textEl.textContent = text;

    bubble.appendChild(textEl);
    chatMessages.appendChild(bubble);
    scrollToBottom();
    return textEl;
  }

  function addTypingIndicator() {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble agent';
    bubble.id = 'typing-indicator';

    var avatar = document.createElement('img');
    avatar.className = 'chat-bubble-avatar';
    avatar.src = '人物形象.png';
    avatar.alt = '';

    var dots = document.createElement('div');
    dots.className = 'chat-bubble-text';
    dots.innerHTML = '<div class="chat-typing"><span></span><span></span><span></span></div>';

    bubble.appendChild(avatar);
    bubble.appendChild(dots);
    chatMessages.appendChild(bubble);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    var el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function scrollToBottom() {
    requestAnimationFrame(function () {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  // ---- 发送消息 ----

  function sendMessage() {
    if (isStreaming) return;
    var text = chatInput.value.trim();
    if (!text) return;

    // 显示用户气泡
    addMessage('user', text);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    setSendingState(true);

    // 显示打字动画
    addTypingIndicator();

    // 调用 API
    var body = {
      inputs: {},
      query: text,
      response_mode: 'streaming',
      user: 'website-visitor'
    };
    if (conversationId) {
      body.conversation_id = conversationId;
    }

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('API 错误: ' + response.status);
      }
      return handleStream(response);
    }).catch(function (err) {
      removeTypingIndicator();
      addMessage('agent', '抱歉，出错了：' + err.message);
      setSendingState(false);
    });
  }

  function handleStream(response) {
    isStreaming = true;
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var answerEl = null;

    function processChunk() {
      reader.read().then(function (result) {
        if (result.done) {
          isStreaming = false;
          setSendingState(false);
          return;
        }

        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        // 保留最后不完整的行
        buffer = lines.pop() || '';

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line || !line.startsWith('data: ')) continue;

          try {
            var json = JSON.parse(line.slice(6));
            var event = json.event;

            if (event === 'agent_message') {
              if (!answerEl) {
                removeTypingIndicator();
                answerEl = addMessage('agent', '');
              }
              if (json.answer) {
                answerEl.textContent += json.answer;
                scrollToBottom();
              }
            }

            if (event === 'message_end') {
              if (json.conversation_id) {
                conversationId = json.conversation_id;
              }
              isStreaming = false;
              setSendingState(false);
            }
          } catch (e) {
            // 忽略解析失败的行
          }
        }

        if (isStreaming) {
          processChunk();
        }
      });
    }

    processChunk();
  }

  function setSendingState(sending) {
    chatSend.disabled = sending;
    chatInput.disabled = sending;
    if (sending) {
      chatInput.placeholder = '等待回复…';
    } else {
      chatInput.placeholder = '输入消息…';
      chatInput.focus();
    }
  }

  // ---- 输入框自适应高度 ----

  function autoResize() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  }

  chatInput.addEventListener('input', autoResize);

  // ---- 事件绑定 ----

  chatTrigger.addEventListener('click', function (e) {
    e.preventDefault();
    openPanel();
  });

  chatCloseBtn.addEventListener('click', function () {
    closePanel();
  });

  chatOverlay.addEventListener('click', function () {
    closePanel();
  });

  chatSend.addEventListener('click', function () {
    sendMessage();
  });

  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isChatOpen) {
      closePanel();
    }
  });
})();
