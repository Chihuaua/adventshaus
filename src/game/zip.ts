/* =======================================================================
   ZIP im Speicher erzeugen

   Fuer die UFO-Station: Patch-Dateien werden als ein Archiv angeboten.
   Bewusst ohne Kompression (Methode 0 = gespeichert) – dann braucht es
   keinen Deflate-Encoder, nur CRC32 und Kopffelder. Reine Arithmetik,
   kein Bibliotheks- und kein Browser-Aufruf.
   ======================================================================= */

export interface ZipEintrag {
  name: string;
  inhalt: string;
}

/** CRC32 (IEEE 802.3), tabellenbasiert. */
const CRC_TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABELLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** UTF-8-Kodierung ohne TextEncoder: laeuft ueberall, auch ausserhalb des Browsers. */
function utf8(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let cp = text.charCodeAt(i);
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < text.length) {
      const lo = text.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        cp = 0x10000 + ((cp - 0xd800) << 10) + (lo - 0xdc00);
        i++;
      } else cp = 0xfffd;
    }
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
  }
  return new Uint8Array(out);
}

/** DOS-Zeitstempel fuer die Archivkoepfe (Ortszeit, Sekunden auf 2 gerundet). */
function dosZeit(zeit: number): { zeit: number; datum: number } {
  const d = new Date(zeit);
  const z = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const t = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { zeit: z & 0xffff, datum: t & 0xffff };
}

/**
 * Archiv aus Klartext-Dateien. Aufbau: lokale Dateikoepfe, dann das
 * Zentralverzeichnis, dann das Endfeld – so wie es jedes Entpackprogramm liest.
 */
export function zipErzeugen(eintraege: readonly ZipEintrag[], zeit = Date.now()): Uint8Array {
  const dateien = eintraege.map((e) => {
    const name = utf8(e.name);
    const daten = utf8(e.inhalt);
    return { name, daten, crc: crc32(daten) };
  });
  const koepfe = dateien.reduce((n, f) => n + 30 + f.name.length, 0);
  const daten = dateien.reduce((n, f) => n + f.daten.length, 0);
  const zentral = dateien.reduce((n, f) => n + 46 + f.name.length, 0);
  const puffer = new Uint8Array(koepfe + daten + zentral + 22);
  const view = new DataView(puffer.buffer);
  const stempel = dosZeit(zeit);
  const offsets: number[] = [];
  let pos = 0;

  for (const f of dateien) {
    offsets.push(pos);
    view.setUint32(pos, 0x04034b50, true); pos += 4; // lokale Dateisignatur
    view.setUint16(pos, 20, true); pos += 2;         // noetige Version
    view.setUint16(pos, 0x0800, true); pos += 2;     // Namen als UTF-8
    view.setUint16(pos, 0, true); pos += 2;          // Methode 0 = gespeichert
    view.setUint16(pos, stempel.zeit, true); pos += 2;
    view.setUint16(pos, stempel.datum, true); pos += 2;
    view.setUint32(pos, f.crc, true); pos += 4;
    view.setUint32(pos, f.daten.length, true); pos += 4;
    view.setUint32(pos, f.daten.length, true); pos += 4;
    view.setUint16(pos, f.name.length, true); pos += 2;
    view.setUint16(pos, 0, true); pos += 2;          // kein Extrafeld
    puffer.set(f.name, pos); pos += f.name.length;
    puffer.set(f.daten, pos); pos += f.daten.length;
  }

  const zentralStart = pos;
  for (let i = 0; i < dateien.length; i++) {
    const f = dateien[i];
    view.setUint32(pos, 0x02014b50, true); pos += 4; // Zentralverzeichnis-Signatur
    view.setUint16(pos, 20, true); pos += 2;         // erzeugt mit
    view.setUint16(pos, 20, true); pos += 2;         // noetige Version
    view.setUint16(pos, 0x0800, true); pos += 2;
    view.setUint16(pos, 0, true); pos += 2;
    view.setUint16(pos, stempel.zeit, true); pos += 2;
    view.setUint16(pos, stempel.datum, true); pos += 2;
    view.setUint32(pos, f.crc, true); pos += 4;
    view.setUint32(pos, f.daten.length, true); pos += 4;
    view.setUint32(pos, f.daten.length, true); pos += 4;
    view.setUint16(pos, f.name.length, true); pos += 2;
    view.setUint16(pos, 0, true); pos += 2;          // Extra
    view.setUint16(pos, 0, true); pos += 2;          // Kommentar
    view.setUint16(pos, 0, true); pos += 2;          // Diskette
    view.setUint16(pos, 0, true); pos += 2;          // interne Attribute
    view.setUint32(pos, 0, true); pos += 4;          // externe Attribute
    view.setUint32(pos, offsets[i], true); pos += 4;
    puffer.set(f.name, pos); pos += f.name.length;
  }
  const zentralEnde = pos;

  view.setUint32(pos, 0x06054b50, true); pos += 4;   // Endfeld
  view.setUint16(pos, 0, true); pos += 2;
  view.setUint16(pos, 0, true); pos += 2;
  view.setUint16(pos, dateien.length, true); pos += 2;
  view.setUint16(pos, dateien.length, true); pos += 2;
  view.setUint32(pos, zentralEnde - zentralStart, true); pos += 4;
  view.setUint32(pos, zentralStart, true); pos += 4;
  view.setUint16(pos, 0, true); pos += 2;

  return puffer.subarray(0, pos);
}
