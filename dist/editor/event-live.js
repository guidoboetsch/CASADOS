/* This same factory runs in the editor and is embedded in exported invitations. */
(function expose(factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else window.KazaEventLive = factory;
})(function createEventLive() {
  "use strict";
  const MINUTE = 60000;
  function eventTimes(date, time, offset) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time || "00:00")) return null;
    if (!/^[+-]\d\d:(?:00|15|30|45)$/.test(offset)) return null;
    const delta = (offset[0] === "-" ? -1 : 1) * (Number(offset.slice(1,3)) * 60 + Number(offset.slice(4)));
    if (delta < -720 || delta > 840) return null;
    const midnight = Date.parse(date + "T00:00:00Z");
    if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0,10) !== date) return null;
    const [h,m] = (time || "00:00").split(":").map(Number);
    return {start:midnight + (h*60 + m - delta)*MINUTE, end:midnight + (1440 - delta)*MINUTE};
  }
  function remaining(start, now) {
    const s = Math.max(0, Math.ceil((start-now)/1000));
    return [Math.floor(s/86400), Math.floor(s/3600)%24, Math.floor(s/60)%60, s%60];
  }
  // Only the URL of a public total belongs on the invitation, never a roster, form, or secret.
  function source(value) {
    try {
      const u = new URL(value);
      if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash ||
          /(^|\.)(docs|drive|forms)\.google\.com$/.test(u.hostname) || u.hostname === "forms.gle") return "";
      if (u.hostname === "script.google.com" && !/^\/macros\/s\/[\w-]+\/exec$/.test(u.pathname)) return "";
      return u.href;
    } catch { return ""; }
  }
  function totalFrom(data) {
    if (!data || Object.keys(data).length !== 1 || !Object.hasOwn(data,"confirmados") ||
        !Number.isSafeInteger(data.confirmados) || data.confirmados < 0) throw Error("Total no disponible");
    return data.confirmados;
  }
  function mount(root, editor = false, checked = () => {}) {
    const clock = root.querySelector("[data-event-start]"), tally = root.querySelector("[data-count-source]");
    if (!clock && !tally) return () => {};
    const start = Number(clock?.dataset.eventStart), end = Number(clock?.dataset.eventEnd);
    const endpoint = source(tally?.dataset.countSource), button = tally?.querySelector("button");
    const value = tally?.querySelector(".tally-number"), unit = tally?.querySelector(".tally-unit"), status = tally?.querySelector(".tally-status");
    let stopped = false, clockTimer, pollTimer, request, lastRead = 0;
    function tick() {
      clearTimeout(clockTimer);
      if (!clock || stopped || document.hidden) return;
      const now = Date.now(), future = start > now, strip = clock.querySelector(".clock-values"), msg = clock.querySelector(".clock-message");
      strip.hidden = !future;
      if (future) {
        const parts = remaining(start, now);
        strip.querySelectorAll("strong").forEach((n,i) => { const v=String(parts[i]).padStart(2,"0"); if(n.textContent!==v)n.textContent=v; });
        msg.textContent = "";
        clockTimer = setTimeout(tick, (start-now)%1000 || 1000);
      } else {
        msg.textContent = now < end ? "¡Llegó el gran día!" : "El casamiento ya pasó.";
        if (now < end) clockTimer = setTimeout(tick, end-now);
      }
    }
    async function refresh() {
      if (!endpoint || request || stopped || document.hidden) return;
      clearTimeout(pollTimer);
      const local = new AbortController(); request = local;
      const limit = setTimeout(() => local.abort(), 8000);
      if (button) button.disabled = true;
      if (!lastRead) status.textContent = "Consultando el total…";
      try {
        const res = await fetch(endpoint,{signal:local.signal, credentials:"omit", referrerPolicy:"no-referrer", cache:"no-store"});
        if (!res.ok || !/^application\/json\b/i.test(res.headers.get("Content-Type")||"") ||
            Number(res.headers.get("Content-Length"))>1024) throw Error();
        // An accidental roster URL must not be read to completion.
        const reader=res.body.getReader(), decoder=new TextDecoder(); let bytes=0, raw="";
        try { for (;;) { const part=await reader.read(); if(part.done)break;
          bytes+=part.value.byteLength; if(bytes>1024){await reader.cancel();throw Error();}
          raw+=decoder.decode(part.value,{stream:true});
        } raw+=decoder.decode(); } finally { reader.releaseLock(); }
        const n = totalFrom(JSON.parse(raw));
        if (stopped || request!==local || local.signal.aborted) return;
        value.textContent = n.toLocaleString("es-AR");
        unit.textContent = n === 1 ? "persona confirmada" : "personas confirmadas";
        lastRead = Date.now();
        checked(endpoint,n,lastRead);
        const hm = new Date(lastRead).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
        status.textContent = (editor ? "Conexión comprobada" : "Actualizado") + " a las " + hm + ".";
      } catch {
        if (!stopped && request===local) {
          value.textContent = "—"; unit.textContent = "personas confirmadas"; lastRead=0;
          checked(endpoint,null,0);
          status.textContent = editor ? "No se pudo leer el total. Revisá el enlace y su acceso público." : "Total no disponible. Volvemos a intentar en un minuto.";
        }
      } finally {
        clearTimeout(limit);
        if (request===local) {
          request=null; if(button) button.disabled=false;
          if (!editor && !stopped && !document.hidden) pollTimer=setTimeout(refresh, MINUTE);
        }
      }
    }
    function pause() {
      clearTimeout(clockTimer); clearTimeout(pollTimer);
      if(request){ const pending=request; request=null; pending.abort();
        if(editor&&!stopped)status.textContent="Comprobación pausada. Podés probar la conexión otra vez."; }
      if(button)button.disabled=!endpoint;
    }
    function resume() {
      if(stopped || document.hidden)return;
      tick();
      if(!editor && endpoint){
        clearTimeout(pollTimer);
        const wait=lastRead + MINUTE - Date.now();
        if(wait>0)pollTimer=setTimeout(refresh,wait);else refresh();
      }
    }
    function visibility(){if(document.hidden)pause();else resume();}
    button?.addEventListener("click",refresh);
    document.addEventListener("visibilitychange",visibility);
    window.addEventListener("pagehide",pause);window.addEventListener("pageshow",resume);
    resume();
    return () => {stopped=true;pause();button?.removeEventListener("click",refresh);
      document.removeEventListener("visibilitychange",visibility);
      window.removeEventListener("pagehide",pause);window.removeEventListener("pageshow",resume);};
  }
  return {eventTimes,remaining,source,totalFrom,mount};
});
