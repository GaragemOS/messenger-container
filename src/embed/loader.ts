// Loader do embed (servido como /v1/loader.js). Codigo de navegador, zero deps.
// Descobre divs #flows/#templates/#metrics/#multitenant (ou [data-garagem-embed]),
// injeta um iframe isolado apontando para a central e faz auto-resize por postMessage.
// __EMBED_ORIGIN__ e substituido pela origem do embed no momento de servir.
export const LOADER_JS = `(function () {
  var SELF = document.currentScript;
  var ORIGIN = "__EMBED_ORIGIN__";
  var SCREENS = ["templates", "flows", "metrics", "multitenant"];

  function scriptToken() {
    return (SELF && SELF.getAttribute("data-embed-token")) ||
      (window.GaragemEmbed && window.GaragemEmbed.token) || "";
  }
  function classOf(el) {
    return el.getAttribute("data-garagem-embed") || el.id;
  }
  function mount(el) {
    var cls = classOf(el);
    if (SCREENS.indexOf(cls) < 0) return;
    if (el.getAttribute("data-garagem-mounted")) return;
    var token = el.getAttribute("data-embed-token") || scriptToken();
    if (!token) return;
    el.setAttribute("data-garagem-mounted", "1");
    var qs = "?t=" + encodeURIComponent(token);
    var sess = el.getAttribute("data-session");
    if (sess) qs += "&session=" + encodeURIComponent(sess);
    var id = el.getAttribute("data-id");
    if (id) qs += "&id=" + encodeURIComponent(id);
    var iframe = document.createElement("iframe");
    iframe.src = ORIGIN + "/v1/screen/" + cls + qs;
    iframe.title = "Garagem " + cls;
    iframe.setAttribute("loading", "lazy");
    iframe.style.cssText = "width:100%;border:0;display:block;min-height:220px";
    el.appendChild(iframe);
  }
  function scan(root) {
    var sel = "[data-garagem-embed],#templates,#flows,#metrics,#multitenant";
    var nodes = (root || document).querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return;
    var d = e.data || {};
    if (d.type === "garagem:resize" && d.height) {
      var frames = document.getElementsByTagName("iframe");
      for (var i = 0; i < frames.length; i++) {
        if (frames[i].contentWindow === e.source) {
          frames[i].style.height = d.height + "px";
        }
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { scan(); });
  } else {
    scan();
  }
  window.GaragemEmbed = window.GaragemEmbed || {};
  window.GaragemEmbed.scan = scan;
})();`;
