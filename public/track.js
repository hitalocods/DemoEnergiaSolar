/**
 * EBS Energia Solar - Script de Rastreio de Origem (Fase 4A)
 * Vanilla JavaScript sem dependências externas.
 */
(function () {
  "use strict";

  var UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "gclid",
  ];

  // 1. Capturar parâmetros da URL e persistir no sessionStorage
  try {
    var searchParams = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(function (key) {
      var val = searchParams.get(key);
      if (val) {
        sessionStorage.setItem("ebs_track_" + key, val);
      }
    });
  } catch (err) {
    // Silencia eventuais restrições de storage
  }

  // Obter valor armazenado ou da URL atual
  function getTrackParam(key) {
    try {
      var searchParams = new URLSearchParams(window.location.search);
      var current = searchParams.get(key);
      if (current) return current;
      return sessionStorage.getItem("ebs_track_" + key) || null;
    } catch (e) {
      return null;
    }
  }

  // Detectar a base da API a partir da URL do próprio script
  function getApiEndpoint() {
    try {
      var scriptTag =
        document.currentScript ||
        document.querySelector('script[src*="track.js"]');
      if (scriptTag && scriptTag.src) {
        var url = new URL(scriptTag.src);
        return url.origin + "/api/track";
      }
    } catch (e) {
      // fallback para relativo
    }
    return "/api/track";
  }

  // Obter URL de fallback caso a API falhe
  function getFallbackWaUrl(element) {
    if (element && element.href && element.href.indexOf("wa.me") !== -1) {
      return element.href;
    }
    var msg =
      (element && element.getAttribute("data-message")) ||
      "Olá! Vim pelo site e gostaria de uma simulação de energia solar";
    var phone =
      (element && element.getAttribute("data-phone")) || "5586994127788";
    return (
      "https://wa.me/" +
      phone.replace(/\D/g, "") +
      "?text=" +
      encodeURIComponent(msg)
    );
  }

  // Interceptar cliques em elementos com data-whatsapp
  document.addEventListener("click", function (event) {
    var target = event.target;
    while (target && target !== document) {
      if (
        target.hasAttribute &&
        (target.hasAttribute("data-whatsapp") ||
          target.getAttribute("href") === "#whatsapp")
      ) {
        event.preventDefault();

        var fallback = getFallbackWaUrl(target);
        var canalId = target.getAttribute("data-canal-id") || null;

        var payload = {
          utm_source: getTrackParam("utm_source"),
          utm_medium: getTrackParam("utm_medium"),
          utm_campaign: getTrackParam("utm_campaign"),
          utm_term: getTrackParam("utm_term"),
          gclid: getTrackParam("gclid"),
          pagina_origem: window.location.href,
          canal_id: canalId,
        };

        var controller =
          typeof AbortController !== "undefined"
            ? new AbortController()
            : null;
        var timeoutId = null;

        if (controller) {
          timeoutId = setTimeout(function () {
            controller.abort();
          }, 3000);
        }

        fetch(getApiEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller ? controller.signal : undefined,
        })
          .then(function (res) {
            if (timeoutId) clearTimeout(timeoutId);
            if (!res.ok) throw new Error("Status " + res.status);
            return res.json();
          })
          .then(function (data) {
            if (data && data.wa_url) {
              window.location.href = data.wa_url;
            } else {
              window.location.href = fallback;
            }
          })
          .catch(function () {
            if (timeoutId) clearTimeout(timeoutId);
            window.location.href = fallback;
          });

        return;
      }
      target = target.parentNode;
    }
  });
})();
