/*
 * Shared helpers for /signup and /login.
 *
 * - post():   calls an API route and reports what the server ACTUALLY said.
 *             A step only moves forward when the server answers ok.
 * - message(): turns a server error code into a sentence for the person.
 * - token():  gets a fresh Cloudflare Turnstile token (the backend requires one
 *             on every "email me a code" request in production).
 * - trapped(): true when the hidden honeypot field was filled in (bots fill
 *             every field; people never see this one).
 */
(function () {
  'use strict';

  var meta = document.querySelector('meta[name="turnstile-sitekey"]');
  var SITEKEY = meta ? meta.content : '';

  var MESSAGES = {
    network: "Can't reach Nexus right now. Check your connection and try again.",
    rate_limited: 'Too many attempts. Please wait a few minutes and try again.',
    bot_check_failed: "We couldn't confirm you're a person. Please try again.",
    invalid_code: "That code isn't right or has expired. Check your email and try again.",
    invalid_input: 'Please check what you entered and try again.',
    unauthenticated: 'Your session has expired. Please start again.',
    age_restricted: 'You must be at least 18 to create a creator account.'
  };

  function post(path, body) {
    return fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    })
      .then(function (res) {
        return res.json()
          .catch(function () { return {}; })
          .then(function (data) {
            var ok = res.ok && !!data && data.ok === true;
            var error = (data && data.error) || (res.status === 429 ? 'rate_limited' : (ok ? null : 'unknown'));
            return { ok: ok, status: res.status, error: error, data: data || {} };
          });
      })
      .catch(function () {
        return { ok: false, status: 0, error: 'network', data: {} };
      });
  }

  function message(result, fallback) {
    return MESSAGES[result.error] || fallback || 'Something went wrong. Please try again.';
  }

  // One invisible widget per container; executed on demand, reset after each use
  // because a Turnstile token can only be spent once.
  function token(container) {
    return new Promise(function (resolve) {
      if (!SITEKEY || !container || !window.turnstile) return resolve(undefined);

      var done = false;
      function finish(t) {
        if (done) return;
        done = true;
        container._tsResolve = null;
        resolve(t || undefined);
      }
      container._tsResolve = finish;

      try {
        if (container._tsId == null) {
          container._tsId = window.turnstile.render(container, {
            sitekey: SITEKEY,
            execution: 'execute',
            appearance: 'interaction-only',
            callback: function (t) { if (container._tsResolve) container._tsResolve(t); },
            'error-callback': function () { if (container._tsResolve) container._tsResolve(undefined); }
          });
        } else {
          window.turnstile.reset(container._tsId);
        }
        window.turnstile.execute(container);
      } catch (e) {
        finish(undefined);
      }

      // Never leave the person stuck: the server will answer bot_check_failed if needed.
      setTimeout(function () { finish(undefined); }, 10000);
    });
  }

  function trapped(form) {
    var hp = form && form.querySelector('input[name="company_website"]');
    return !!(hp && hp.value);
  }

  window.NexusAuth = { post: post, message: message, token: token, trapped: trapped };
})();
