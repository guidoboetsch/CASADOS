/* Shared by the public collection, the editor and its single-file exports. */
"use strict";
(() => {
  const styles = [
    {id:"cine", name:"Cine", swatches:["#171717","#b91429","#f6eadd"], note:"Un afiche de película: foto a sangre, negro profundo y un acento rojo. El estilo de Guido y María."},
    {id:"herbario", name:"Herbario", swatches:["#284738","#ebeedf","#c6af89"], note:"Una invitación de papel con ramas dibujadas en tinta, verdes suaves y un monograma. Para una fiesta al aire libre."},
    {id:"gaceta", name:"Gaceta", swatches:["#f6efda","#242323","#952925"], note:"Una edición especial: titulares grandes, filetes de imprenta y horarios de programa. Para quienes aman el diseño editorial."},
    {id:"verbena", name:"Verbena", swatches:["#e0cdff","#30204b","#ff975d"], note:"Un póster de fiesta: nombres en bloque, bandas diagonales y un sello de fecha. Para celebrar sin solemnidad."}
  ];
  const sprig = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 220" fill="none" stroke="#667c56" stroke-width="1.5"><path d="M23 216Q35 110 154 20 M43 149Q14 125 23 91Q54 109 43 149Z M58 122Q81 123 107 90Q76 87 58 122Z M77 94Q49 76 58 43Q83 58 77 94Z M95 72Q124 75 146 44Q117 42 95 72Z M121 47Q107 19 123 5Q139 25 121 47Z"/></svg>';
  const css = `
.invitation{background:#090909;color:#faf8f4;font:1rem/1.55 system-ui,sans-serif;overflow-wrap:anywhere;color-scheme:dark}
.invitation *{box-sizing:border-box}.invitation h1,.invitation h2,.invitation p{margin:0}
.invite-section{padding:clamp(1.4rem,5%,4rem);border-bottom:1px solid #353535}.invite-section>*{max-width:48rem;margin-inline:auto}
.invite-section .kicker,.cover .kicker{font:750 .78rem/1.4 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.18em}
.invite-section :is(h2,.sample-heading){font:italic clamp(2rem,5vw,3.8rem)/1.1 Georgia,serif;margin:.6rem 0 1rem}
.invite-section .copy{white-space:pre-line}.invite-section dl{margin:0}.invite-section dl>div,.schedule li{display:flex;flex-wrap:wrap;gap:.5rem 1.3rem;align-items:baseline;justify-content:space-between;padding:.7rem 0;border-bottom:1px solid #8886}
.invite-section dd{margin:0}.invite-section dt,.schedule strong{font-weight:750}.schedule{padding:0;list-style:none;margin:0}
.invite-section.day,.invite-section.confirm{background:#faf8f4;color:#171717}.invite-section.social{background:#290f14}
.invitation .invite-action{display:inline-block;background:#c31325;color:white;text-decoration:none;font:700 1rem system-ui,sans-serif;border:0;cursor:pointer;padding:.85rem 1.2rem;margin-top:1rem}
.invitation :focus-visible{outline:3px solid #f86673;outline-offset:3px}
.cover{position:relative;isolation:isolate;display:grid;place-content:center;text-align:center;min-height:26rem;color:white;
background:#260e14 var(--cinema-photo,none) center/cover no-repeat;overflow:hidden}
.cover::after{content:"";z-index:-1;position:absolute;inset:0;background:linear-gradient(0deg,#050505ce,#0803038f 55%,#0008)}
.cover .cover-image{position:absolute;z-index:-2;inset:0;width:100%;max-width:none;height:100%;object-fit:cover}
.cover .mark{font:italic 2rem Georgia,serif;letter-spacing:-.09em}.cover .image-mark{width:min(11rem,65%);max-height:6rem;object-fit:contain;margin:auto}
.cover :is(h1,.sample-names){font:normal clamp(2.6rem,7vw,5.5rem)/1.02 Georgia,serif;letter-spacing:-.045em;margin:.7rem 0}.cover time{font-weight:650;letter-spacing:.12em}
.table-search label{display:block;margin:1rem 0 .25rem}.table-search input{display:block;width:min(100%,24rem);border:1px solid #777;background:#171717;color:white;padding:.85rem;font:inherit}
.table-search [role=status]{margin-top:.8rem}.invitation .hint{font-size:.92rem;color:inherit;opacity:.8;margin-top:1rem}
.invitation:not([data-design="cine"]){color-scheme:light;background:var(--paper);color:var(--type)}
.invitation:not([data-design="cine"]) .invite-section{background:var(--paper);color:var(--type);border-color:var(--rule)}
.invitation:not([data-design="cine"]) .invite-section:not(.cover):nth-child(even){background:var(--tint)}
.invitation:not([data-design="cine"]) .invite-action{background:var(--accent);color:#fff}
.invitation:not([data-design="cine"]) .cover{background:var(--paper)}
.invitation:not([data-design="cine"]) .cover::after{background:none}
.invitation[data-design="herbario"]{--paper:#f6f4e9;--tint:#e6ebdc;--type:#243c30;--accent:#36573d;--rule:#aab19a}
.invitation[data-design="herbario"] .cover{background:var(--paper);outline:1px solid var(--rule);outline-offset:-.9rem}
.invitation[data-design="herbario"] .cover::before,.invitation[data-design="herbario"] .cover::after{content:"";position:absolute;inset:auto auto 1rem 1rem;width:30%;height:55%;background:var(--sprig) left bottom/contain no-repeat;z-index:-1}
.invitation[data-design="herbario"] .cover::after{inset:1rem 1rem auto auto;transform:rotate(180deg)}
.invitation[data-design="herbario"] .mark{display:inline-grid;place-items:center;min-width:3.5rem;min-height:3.5rem;border:1px solid;border-radius:50%;padding:.35em;font:italic 1.3rem Georgia,serif}
.invitation[data-design="herbario"] .cover :is(h1,.sample-names){font-style:italic}.invitation[data-design="herbario"] .invite-action{border-radius:3rem}
.invitation[data-design="gaceta"]{--paper:#faf4e6;--tint:#eee6d6;--type:#242121;--accent:#902c28;--rule:#544f49}
.invitation[data-design="gaceta"] .cover{place-content:end stretch;text-align:left;border-block:.5rem double var(--type)}
.invitation[data-design="gaceta"] .cover>div{width:100%}
.invitation[data-design="gaceta"] .mark,.invitation[data-design="gaceta"] .kicker{font:700 .82rem/1.4 monospace;text-transform:uppercase;letter-spacing:.16em;color:var(--accent)}
.invitation[data-design="gaceta"] .cover :is(h1,.sample-names){font-weight:bold;letter-spacing:-.065em;border-block:1px solid;padding:.14em 0}
.invitation[data-design="gaceta"] .cover time,.invitation[data-design="gaceta"] .schedule strong{font:700 1rem monospace}
.invitation[data-design="gaceta"] .invite-section :is(h2,.sample-heading){font-style:normal;font-weight:bold}
.invitation[data-design="verbena"]{--paper:#e6d9ff;--tint:#ffc39d;--type:#302044;--accent:#4d3078;--rule:#503963}
.invitation[data-design="verbena"] .cover{background:repeating-linear-gradient(135deg,#ff995d 0 1.3rem,#34224c 1.3rem 2.4rem) top/100% 2.4rem no-repeat,#decaff}
.invitation[data-design="verbena"] .mark{font:bold 1.1rem system-ui;letter-spacing:.18em}
.invitation[data-design="verbena"] .cover :is(h1,.sample-names),.invitation[data-design="verbena"] .invite-section :is(h2,.sample-heading){font:900 clamp(2.5rem,6vw,5rem)/.96 system-ui,sans-serif;text-transform:uppercase;letter-spacing:-.065em}
.invitation[data-design="verbena"] .cover time{display:inline-block;background:var(--type);color:white;padding:.4em .75em;transform:rotate(-3deg)}
.invitation[data-design="verbena"] .schedule li{border-bottom:2px solid var(--rule)}
.invitation[data-design]:not([data-design="cine"]) .cover:has(.cover-image)>div{padding:1.25rem;max-width:min(100%,48rem);background:var(--paper);box-shadow:0 .3rem 2rem #0002}
.invitation:not([data-design="cine"]) :focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.invitation .gift-list{padding:0;list-style:none;margin:1rem 0}.gift-list li{padding:.6rem 0;border-bottom:1px solid currentColor}.gift-list a{color:inherit;text-underline-offset:.22em}
`;
  const sheet = document.createElement("style");
  sheet.id="invitation-style";
  sheet.textContent=':root{--sprig:url("data:image/svg+xml,'+encodeURIComponent(sprig)+'")}\n'+css;
  document.head.append(sheet);
  window.KazaDesigns = Object.freeze(styles.map(Object.freeze));
})();
