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
})();
