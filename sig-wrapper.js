/*
 * SIG PROERD - casca (wrapper) do GitHub Pages.
 * Carrega o Google Apps Script dentro de um iframe, para o app instalado
 * abrir sem a barra de endereço do Google.
 *
 * O perfil (administrativo ou instrutor) vem do atributo data-modo da tag
 * <script> que inclui este arquivo - NUNCA da URL. Assim, cada app instalado
 * abre sempre o perfil certo, mesmo que o endereço perca parâmetros.
 */
(function () {
  "use strict";

  // Endereço da implantação do Apps Script (não é segredo: aparece para
  // qualquer usuário; a segurança fica no backend - sessão, 2FA, níveis).
  var URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycby2AOGYh4vfByC8X7lWrRD_Mp1-O1yMkqQB9Zk5YXAze0Z8VJ9VNcAOEoqxNs3DbUgJ/exec";

  var tag = document.currentScript;
  var modo = (tag && tag.getAttribute("data-modo")) || "";
  modo = String(modo).replace(/[^a-z]/g, "");          // só "instrutor" ou vazio
  if (modo !== "instrutor") modo = "";

  // Link antigo do instrutor (index.html?modo=instrutor) aberto na página do
  // administrativo: leva para a página própria do instrutor, que tem o
  // manifest correto. Sem isso, a instalação continuaria virando o app ADM.
  if (!modo) {
    try {
      var q = new URLSearchParams(window.location.search);
      if (String(q.get("modo") || "").toLowerCase() === "instrutor") {
        window.location.replace(new URL("instrutor/", window.location.href).href);
        return;
      }
    } catch (e) {}
  }

  function iniciar() {
    var iframe = document.getElementById("iframe_SIG");
    var loader = document.getElementById("loader_SIG");
    var statusTexto = document.getElementById("statusTexto");
    var spinner = document.getElementById("spinner_SIG");
    var btnRecarregar = document.getElementById("btnRecarregar_SIG");
    var carregou = false, timerLento = null, timerFalha = null;

    // Sem onclick inline: a política de segurança (CSP) da página bloqueia.
    btnRecarregar.addEventListener("click", function () { window.location.reload(); });

    iframe.onload = function () {
      carregou = true;
      if (timerLento) clearTimeout(timerLento);
      if (timerFalha) clearTimeout(timerFalha);
      loader.style.display = "none";
      iframe.style.display = "block";
    };
    iframe.src = URL_APPS_SCRIPT + (modo ? "?modo=" + modo : "");

    timerLento = setTimeout(function () {
      if (!carregou) statusTexto.textContent = "O sistema está demorando mais que o normal para carregar...";
    }, 15000);
    timerFalha = setTimeout(function () {
      if (!carregou) {
        if (spinner) spinner.style.display = "none";
        statusTexto.textContent = "Não foi possível carregar o sistema. Verifique sua conexão e tente novamente.";
        btnRecarregar.style.display = "inline-block";
      }
    }, 35000);
  }

  // ---- Memória do dispositivo ("lembrar este dispositivo") --------------
  // O app roda em iframes do Google, onde o iPhone/Safari apaga ou bloqueia o
  // armazenamento. A casca guarda o token aqui (armazenamento próprio do
  // github.io) e só conversa com o app do Google Apps Script.
  var CHAVES_MEM = ["usuarioSIG", "dispositivoTokenSIG", "usuarioSIG_Policial", "dispositivoTokenSIG_Policial"];
  var ORIGEM_APP = /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/;
  window.addEventListener("message", function (ev) {
    if (!ORIGEM_APP.test(String(ev.origin || ""))) return;
    var d = ev.data;
    if (!d || typeof d !== "object" || !d.sigMem) return;
    try {
      if (d.sigMem === "set" && CHAVES_MEM.indexOf(d.k) > -1 && typeof d.v === "string" && d.v.length < 300) {
        localStorage.setItem("sigMem:" + d.k, d.v);
      } else if (d.sigMem === "del" && CHAVES_MEM.indexOf(d.k) > -1) {
        localStorage.removeItem("sigMem:" + d.k);
      } else if (d.sigMem === "get" && ev.source && Array.isArray(d.chaves)) {
        var valores = {};
        d.chaves.forEach(function (k) { if (CHAVES_MEM.indexOf(k) > -1) valores[k] = localStorage.getItem("sigMem:" + k) || ""; });
        ev.source.postMessage({ sigMem: "resp", id: String(d.id || ""), valores: valores }, ev.origin);
      }
    } catch (e) {}
  });

  // O script fica no fim do <body>: o DOM pode já estar pronto.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
