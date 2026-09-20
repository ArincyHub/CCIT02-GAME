// Simple Web Audio sound effects. Everything is made with noise + oscillators,
// so there are no sound files to load.

export type SoundKind = "step" | "swing" | "hit" | "death" | "reveal" | "hide" | "hurt";

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  volume = 0.7;

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);

      const len = Math.floor(this.ctx.sampleRate * 0.5);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  close() {
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.master = null;
  }

  private chain(pan: number) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(panner);
    panner.connect(this.master!);
    return { ctx, gain };
  }

  private noise(gain: GainNode, rate = 1) {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = rate;
    src.connect(gain);
    return src;
  }

  play(kind: SoundKind, vol: number, pan: number) {
    if (vol <= 0.01) return;
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (kind) {
      case "step":
        this.step(vol, pan, t);
        break;
      case "swing":
        this.swing(vol, pan, t);
        break;
      case "hit":
        this.hit(vol, pan, t);
        break;
      case "death":
        this.death(vol, pan, t);
        break;
      case "hurt":
        this.hurt(vol, pan, t);
        break;
      case "reveal":
        this.beep(vol, [740, 988], t);
        break;
      case "hide":
        this.beep(vol, [392, 262], t);
        break;
    }
  }

  private step(vol: number, pan: number, t: number) {
    const { ctx, gain } = this.chain(pan);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 430 + Math.random() * 120;
    const src = this.noise(lp, 0.8 + Math.random() * 0.4);
    lp.connect(gain);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    src.start(t);
    src.stop(t + 0.12);
  }

  private swing(vol: number, pan: number, t: number) {
    const { ctx, gain } = this.chain(pan);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.6;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.16);
    const src = this.noise(bp, 1);
    bp.connect(gain);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    src.start(t);
    src.stop(t + 0.25);
  }

  private hit(vol: number, pan: number, t: number) {
    const { ctx, gain } = this.chain(pan);
    // metal clang
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.18);
    const og = ctx.createGain();
    og.gain.setValueAtTime(vol * 0.22, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(og);
    og.connect(gain);
    gain.gain.value = 1;
    osc.start(t);
    osc.stop(t + 0.26);
    // impact
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200;
    const src = this.noise(hp, 1.2);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.4, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    hp.connect(ng);
    ng.connect(gain);
    src.start(t);
    src.stop(t + 0.14);
  }

  private hurt(vol: number, pan: number, t: number) {
    const { ctx, gain } = this.chain(pan);
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.3);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    osc.connect(lp);
    lp.connect(gain);
    gain.gain.setValueAtTime(vol * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  private death(vol: number, pan: number, t: number) {
    const { ctx, gain } = this.chain(pan);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.55);
    osc.connect(gain);
    gain.gain.setValueAtTime(vol * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    osc.start(t);
    osc.stop(t + 0.62);
  }

  private beep(vol: number, notes: number[], t: number) {
    const { ctx, gain } = this.chain(0);
    gain.gain.value = 1;
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = f;
      const g = ctx.createGain();
      const start = t + i * 0.12;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(vol * 0.18, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      osc.connect(g);
      g.connect(gain);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  }
}
