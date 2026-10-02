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

  // O script fica no fim do <body>: o DOM pode já estar pronto.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
