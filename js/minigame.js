class PromptMiniGame {
  constructor(canvas, onEnd) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onEnd = onEnd;
    this.active = false;
    this.prompt = "";
    this.typed = "";
    this.timeLeft = 0;
    this.score = 0;
    this.particles = [];
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  start() {
    this.active = true;
    this.prompt = pickRandom(PROMPTS);
    this.typed = "";
    this.timeLeft = 12;
    this.score = 0;
    this.particles = [];
    this._last = performance.now();
    this._boundKey = (e) => this.onKey(e);
    window.addEventListener("keydown", this._boundKey);
    this.loop();
  }

  stop() {
    this.active = false;
    window.removeEventListener("keydown", this._boundKey);
    cancelAnimationFrame(this._raf);
  }

  onKey(e) {
    if (!this.active) return;
    if (e.key === "Escape") {
      this.end(0);
      return;
    }
    if (e.key === "Backspace") {
      this.typed = this.typed.slice(0, -1);
      return;
    }
    if (e.key.length === 1) {
      this.typed += e.key;
      if (this.prompt.startsWith(this.typed)) {
        this.score += 2;
        this.spawnParticle();
        if (this.typed === this.prompt) {
          this.score += 20;
          this.prompt = pickRandom(PROMPTS);
          this.typed = "";
        }
      } else {
        this.score = Math.max(0, this.score - 3);
        this.typed = "";
      }
    }
  }

  spawnParticle() {
    this.particles.push({
      x: Math.random() * this.canvas.width,
      y: this.canvas.height * 0.6,
      vy: -1 - Math.random() * 2,
      life: 1,
      char: pickRandom(["✨", "⚡", "🔥", "💜", "</>"]),
    });
  }

  loop() {
    if (!this.active) return;
    const now = performance.now();
    const dt = (now - this._last) / 1000;
    this._last = now;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.end(this.score);
      return;
    }
    this.draw();
    this._raf = requestAnimationFrame(() => this.loop());
  }

  draw() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#161b22";
    ctx.fillRect(12, 12, w - 24, 36);
    ctx.fillStyle = "#ff5f57";
    ctx.beginPath();
    ctx.arc(28, 30, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#febc2e";
    ctx.beginPath();
    ctx.arc(44, 30, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#28c840";
    ctx.beginPath();
    ctx.arc(60, 30, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8b949e";
    ctx.font = "12px monospace";
    ctx.fillText("vibe-terminal — prompt.exe", 80, 34);

    ctx.fillStyle = "#21262d";
    ctx.fillRect(12, 56, w - 24, h - 120);

    ctx.fillStyle = "#58a6ff";
    ctx.font = "bold 14px monospace";
    ctx.fillText("> AI ждёт промпт:", 24, 84);

    ctx.fillStyle = "#c9d1d9";
    ctx.font = "18px monospace";
    const promptY = 120;
    ctx.fillText(this.prompt, 24, promptY);

    const typedColor = this.prompt.startsWith(this.typed) ? "#3fb950" : "#f85149";
    ctx.fillStyle = typedColor;
    ctx.fillText(this.typed + "▌", 24, promptY + 32);

    ctx.fillStyle = "#8b949e";
    ctx.font = "13px monospace";
    ctx.fillText("Печатай промпт. Enter не нужен — автоматом.", 24, h - 72);
    ctx.fillText(`Score: ${this.score}  |  Time: ${Math.ceil(this.timeLeft)}s  |  Esc — выход`, 24, h - 48);

    this.particles = this.particles.filter((p) => {
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) return false;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = "#a371f7";
      ctx.font = "16px sans-serif";
      ctx.fillText(p.char, p.x, p.y);
      ctx.globalAlpha = 1;
      return true;
    });
  }

  end(score) {
    this.stop();
    this.onEnd(score);
  }
}