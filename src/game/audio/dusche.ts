/* =======================================================================
   Duschgeräusch: rauschendes Wasser mit prasselnden Tropfen, synthetisch.

   Ein vorab gerechneter Klangpuffer läuft in Schleife, solange die Dusche
   an ist; beim Abstellen klingt er kurz aus. Gehört zu genau einer
   Hausinstanz und endet mit ihr. Keine Audiodatei.
   ======================================================================= */

export class DuschKlang {
  private quelle: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private tief: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private pegel = 0;

  fluss(pegel: number, audio: { ctx: AudioContext; master: AudioNode } | null) {
    if (!audio || pegel <= 0) { this.stop(); return; }
    const { ctx, master } = audio;
    if (!this.quelle) {
      const rate = ctx.sampleRate, n = Math.round(rate * 2.4);
      const buf = ctx.createBuffer(1, n, rate);
      const a = buf.getChannelData(0);
      let saat = 91, glatt = 0, tropfen = 0, tropfenHuelle = 0;
      for (let i = 0; i < n; i++) {
        saat = (Math.imul(saat, 1664525) + 1013904223) >>> 0;
        const weiss = saat / 2147483648 - 1;
        glatt += .35 * (weiss - glatt);
        // Etwa 55 Tropfen je Sekunde: kurze, helle Klicks auf dem Wannenboden
        if ((saat & 0xffff) < 0xffff * 55 / rate) { tropfenHuelle = .5 + (saat >>> 24) / 512; tropfen = 0; }
        tropfen += 1; tropfenHuelle *= .9965;
        a[i] = .42 * glatt + .18 * weiss + tropfenHuelle * Math.sin(tropfen * .9) * .55;
      }
      // Weicher Übergang am Pufferende, damit die Schleife nicht knackt
      const rand = Math.round(rate * .03);
      for (let i = 0; i < rand; i++) { const k = i / rand; a[n - rand + i] = a[n - rand + i] * (1 - k) + a[i] * k; }
      this.quelle = ctx.createBufferSource(); this.quelle.buffer = buf; this.quelle.loop = true;
      this.filter = ctx.createBiquadFilter(); this.filter.type = "highpass"; this.filter.frequency.value = 320;
      this.tief = ctx.createBiquadFilter(); this.tief.type = "lowpass"; this.tief.frequency.value = 5200;
      this.gain = ctx.createGain(); this.gain.gain.value = 0;
      this.quelle.connect(this.filter); this.filter.connect(this.tief); this.tief.connect(this.gain); this.gain.connect(master);
      this.quelle.start();
    }
    if (pegel !== this.pegel) {
      this.gain!.gain.setTargetAtTime(.13 * pegel, ctx.currentTime, .12); this.pegel = pegel;
    }
  }

  stop() {
    if (!this.quelle) return;
    this.quelle.stop(); this.quelle.disconnect(); this.filter?.disconnect(); this.tief?.disconnect(); this.gain?.disconnect();
    this.quelle = null; this.filter = null; this.tief = null; this.gain = null; this.pegel = 0;
  }
}
