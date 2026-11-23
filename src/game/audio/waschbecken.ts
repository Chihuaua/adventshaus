/** Der laufende Hahn gehört zu genau einer Hausinstanz und endet mit ihr. */
export class WaschbeckenKlang {
  private quelle: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private pegel = 0;

  fluss(pegel: number, audio: { ctx: AudioContext; master: AudioNode } | null) {
    if (!audio || pegel <= 0) { this.stop(); return; }
    const { ctx, master } = audio;
    if (!this.quelle) {
      const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * .75), ctx.sampleRate);
      const a = buf.getChannelData(0);
      let saat = 17, tief = 0;
      for (let i = 0; i < a.length; i++) {
        saat = (Math.imul(saat, 1664525) + 1013904223) >>> 0;
        const weiss = saat / 2147483648 - 1;
        tief += .16 * (weiss - tief); a[i] = .55 * weiss + tief;
      }
      this.quelle = ctx.createBufferSource(); this.quelle.buffer = buf; this.quelle.loop = true;
      this.filter = ctx.createBiquadFilter(); this.filter.type = "bandpass";
      this.filter.frequency.value = 1950; this.filter.Q.value = .65;
      this.gain = ctx.createGain(); this.gain.gain.value = 0;
      this.quelle.connect(this.filter); this.filter.connect(this.gain); this.gain.connect(master); this.quelle.start();
    }
    if (pegel !== this.pegel) {
      this.gain!.gain.setTargetAtTime(.17 * pegel, ctx.currentTime, .035); this.pegel = pegel;
    }
  }

  stop() {
    if (!this.quelle) return;
    this.quelle.stop(); this.quelle.disconnect(); this.filter?.disconnect(); this.gain?.disconnect();
    this.quelle = null; this.filter = null; this.gain = null; this.pegel = 0;
  }
}