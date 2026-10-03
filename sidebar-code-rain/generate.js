#!/usr/bin/env node
// Generates the code-rain mask SVGs. Deterministic: same seed => same file.
// Usage: node generate.js            (writes sidebar-rain-near.svg + sidebar-rain-far.svg)
//        node generate.js --static   (also writes sidebar-rain-static.svg, no animation)
'use strict';
const fs = require('fs');

function rng(seed){ let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const KANA = 'ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
const W = 240, LH = 15, LINES = 48, H = LH * LINES;

// o: { seed,
//      speed   average seconds for a column to fall one tile (720 px),
//      spread  0..0.8, how much column speeds differ (0 = all the same),
//      twinkle roughly how many stream heads flash, out of ~60 streams,
//      mutate  0..1, share of streams whose glyphs change while falling,
//      animate false = a still image }
// Each column is a <g> drawn twice (at y and y-H) that translates by H: a seamless loop at its own
// speed. The fall, the mutation and the flashes are SMIL inside the SVG; the CSS animates none of it.
function rainSVG(o){
  const r = rng(o.seed), cols = 16, step = W / cols;
  let out = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#fff" stop-opacity=".55"/>' +
    '<stop offset="1" stop-color="#fff"/></linearGradient></defs>' +
    '<g font-family="MS Gothic,Yu Gothic,Hiragino Sans,Noto Sans CJK JP,monospace" font-size="12">';
  for (let c = 0; c < cols; c++){
    const x = Math.round(c * step + step / 2 - 3);
    let col = '', y = Math.floor(r() * 10);
    while (y < LINES){
      const n = 4 + Math.floor(r() * 11);
      let ys = [], s = '';
      for (let k = 0; k < n; k++){ ys.push((y + k) * LH + 12); s += KANA[Math.floor(r() * KANA.length)]; }
      const xs = Array(n).fill(x).join(' '), yl = ys.join(' ');
      if (o.animate && r() < o.mutate){
        // mutation: 3 variants of the same stream (about 1/3 of the glyphs differ each time),
        // shown in turn with a discrete opacity animation, so the text changes as it falls
        const md = (1 + r() * 4).toFixed(1), v = [s];
        for (let m = 1; m < 3; m++) v.push([...s].map(ch => r() < .35 ? KANA[Math.floor(r() * KANA.length)] : ch).join(''));
        v.forEach((t, m) => {
          const vals = [0, 1, 2].map(k => k === m ? 1 : 0).join(';');
          col += '<text fill="url(#g)" x="' + xs + '" y="' + yl + '" opacity="' + (m ? 0 : 1) + '">' + t +
                 '<animate attributeName="opacity" values="' + vals + '" calcMode="discrete" dur="' + md + 's" repeatCount="indefinite"/></text>';
        });
      } else {
        col += '<text fill="url(#g)" x="' + xs + '" y="' + yl + '">' + s + '</text>';
      }
      // twinkle: the stream head flashes pure white, inside the column (so it falls with it)
      if (o.animate && r() < o.twinkle / 60){
        const d = (1.5 + r() * 5).toFixed(1), b = (r() * 6).toFixed(1);
        col += '<text fill="#fff" x="' + x + '" y="' + ys[n - 1] + '" opacity="0">' + s[n - 1] +
               '<animate attributeName="opacity" values="0;1;0" keyTimes="0;.1;1" dur="' + d + 's" begin="' + b + 's" repeatCount="indefinite"/></text>';
      }
      y += n + 3 + Math.floor(r() * 12);
    }
    const dur = (o.speed * (1 + (r() * 2 - 1) * o.spread)).toFixed(1);
    const anim = o.animate
      ? '<animateTransform attributeName="transform" type="translate" from="0 0" to="0 ' + H + '" dur="' + dur + 's" repeatCount="indefinite"/>'
      : '';
    out += '<g>' + anim + col + '<g transform="translate(0 -' + H + ')">' + col + '</g></g>';
  }
  out += '</g>';
  return out + '</svg>';
}

// Settings tuned by eye on a test bench. Change them, re-run, copy the SVGs to /config/www/.
const NEAR = { seed: 7,  speed: 18,       spread: .45, twinkle: 12, mutate: .5,  animate: true };
const FAR  = { seed: 19, speed: 18 * 1.8, spread: .45, twinkle: 0,  mutate: .25, animate: true };
// Layer opacity is baked into each SVG (.35 front, .15 back): both layers share one pseudo-element.
const bake = (svg, op) => svg.replace('</defs>', '</defs><g opacity="' + op + '">').replace(/<\/svg>$/, '</g></svg>');
fs.writeFileSync('sidebar-rain-near.svg', bake(rainSVG(NEAR), .35));
fs.writeFileSync('sidebar-rain-far.svg',  bake(rainSVG(FAR), .15));
if (process.argv.includes('--static'))
  fs.writeFileSync('sidebar-rain-static.svg', rainSVG({ seed: 7, speed: 18, spread: 0, twinkle: 0, mutate: 0, animate: false }));
console.log('ok');
