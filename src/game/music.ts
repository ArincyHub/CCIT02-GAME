// Menu music.
// Put your song here:  public/audio/menu.mp3
// If that file is missing, a tiny chiptune plays instead.

export class MenuMusic {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private timer = 0;
  private volume = 0.7;
  private want = false;
  private usingFile = false;

  setVolume(v: number) {
    this.volume = v;
    if (this.audio) this.audio.volume = Math.max(0, Math.min(1, v * 0.55));
  }

  start() {
    if (this.want) return;
    this.want = true;
    this.tryFile();
  }

  stop() {
    this.want = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    this.usingFile = false;
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }

  private tryFile() {
    const a = new Audio("/audio/menu.mp3");
    a.loop = true;
    a.volume = Math.max(0, Math.min(1, this.volume * 0.55));
    const onOk = () => {
      if (!this.want || this.usingFile) return;
      this.usingFile = true;
      this.audio = a;
      if (this.timer) window.clearInterval(this.timer);
      this.timer = 0;
      a.play().catch(() => {
        const kick = () => {
          if (this.want) void a.play();
        };
        window.addEventListener("pointerdown", kick, { once: true });
      });
    };
    a.addEventListener("canplaythrough", onOk, { once: true });
    a.addEventListener(
      "error",
      () => {
        if (!this.usingFile) this.fallback();
      },
      { once: true },
    );
    a.load();
    window.setTimeout(() => {
      if (this.want && !this.usingFile) this.fallback();
    }, 1200);
  }

  private fallback() {
    if (this.usingFile || !this.want || this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    const kick = () => {
      if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
    };
    window.addEventListener("pointerdown", kick, { once: true });
    kick();

    const notes = [196, 247, 294, 392, 330, 247, 220, 196];
    let i = 0;
    const tick = () => {
      if (!this.ctx || !this.want || this.usingFile) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = notes[i % notes.length];
      g.gain.setValueAtTime(this.volume * 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
      i++;
    };
    tick();
    this.timer = window.setInterval(tick, 320);
  }
}
