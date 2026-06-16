(function () {
  var _paymentInProgress = false;
  var config = {
    merchantId: "{{merchantId}}",
    providers: JSON.parse("{{providers}}"),
    publicKey: "{{publicKey}}",
    papiEndpoint: "{{papiEndpoint}}",
  };

  function loadPaystack(callback) {
    if (window.PaystackPop) {
      callback();
      return;
    }
    var existingScript = document.querySelector(
      'script[src="https://js.paystack.co/v1/inline.js"]',
    );
    if (existingScript) {
      var oldOnload = existingScript.onload;
      existingScript.onload = function () {
        if (oldOnload) oldOnload();
        callback();
      };
      return;
    }
    var s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = function () {
      callback();
    };
    s.onerror = function () {
      console.error("Paye SDK Error: Failed to load Paystack inline script");
    };
    document.head.appendChild(s);
  }

  // Pre-load Paystack script if Paystack is an active provider
  if (config.providers && config.providers.indexOf("paystack") !== -1) {
    loadPaystack(function () {});
  }

  function loadFlutterwave(callback) {
    if (window.FlutterwaveCheckout) {
      callback();
      return;
    }
    var existingScript = document.querySelector(
      'script[src="https://checkout.flutterwave.com/v3.js"]',
    );
    if (existingScript) {
      var oldOnload = existingScript.onload;
      existingScript.onload = function () {
        if (oldOnload) oldOnload();
        callback();
      };
      return;
    }
    var s = document.createElement("script");
    s.src = "https://checkout.flutterwave.com/v3.js";
    s.onload = function () {
      callback();
    };
    s.onerror = function () {
      console.error("Paye SDK Error: Failed to load Flutterwave script");
    };
    document.head.appendChild(s);
  }

  if (config.providers && config.providers.indexOf("flutterwave") !== -1) {
    loadFlutterwave(function () {});
  }

  function verifyTransaction(reference, options, attempt) {
    attempt = attempt || 1;
    var maxAttempts = 3;

    function runVerify() {
      var verifyUrl =
        config.papiEndpoint + "/sdk/transactions/verify/" + reference;
      fetch(verifyUrl)
        .then(function (res) {
          if (!res.ok) {
            throw new Error("Transaction verification request failed");
          }
          return res.json();
        })
        .then(function (data) {
          if (
            data &&
            data.status === true &&
            data.data &&
            data.data.status === "success"
          ) {
            _paymentInProgress = false;
            if (options.onSuccess) {
              options.onSuccess(reference, {
                status: "success",
                reference: reference,
                amount: data.data.amount,
                currency: data.data.currency,
                provider: data.data.provider,
                message: data.message,
              });
            }
          } else {
            _paymentInProgress = false;
            var msg =
              (data && data.message) || "Transaction verification failed";
            if (options.onFailure) {
              options.onFailure(msg, {
                status: "failed",
                reference: reference,
                message: msg,
              });
            }
          }
        })
        .catch(function (err) {
          console.error(
            "Paye SDK Verification Error (Attempt " + attempt + "):",
            err,
          );
          if (attempt < maxAttempts) {
            verifyTransaction(reference, options, attempt + 1);
          } else {
            _paymentInProgress = false;
            var errMsg =
              err.message || err || "Transaction verification failed";
            if (options.onFailure) {
              options.onFailure(errMsg, {
                status: "failed",
                reference: reference,
                message: errMsg,
              });
            }
          }
        });
    }

    if (attempt === 1) {
      runVerify();
    } else {
      setTimeout(runVerify, (attempt - 1) * 1500);
    }
  }

  window.Paye = {
    config: config,
    pay: function (options) {
      if (_paymentInProgress) {
        console.warn("Paye SDK: Payment already in progress");
        return;
      }
      _paymentInProgress = true;
      var paymentCompleted = false;

      if (!options || !options.email || !options.amount) {
        console.error("Paye SDK Error: email and amount are required fields");
        _paymentInProgress = false;
        if (options.onFailure)
          options.onFailure("Missing required fields", {
            status: "failed",
            message: "Missing required fields",
          });
        return;
      }

      var type = options.type || "payment";
      if (type === "subscription" && !options.planId) {
        console.error(
          "Paye SDK Error: planId is required for subscription checkouts",
        );
        _paymentInProgress = false;
        if (options.onFailure)
          options.onFailure("planId is required for subscription checkouts", {
            status: "failed",
            message: "planId is required for subscription checkouts",
          });
        return;
      }

      var rawAmount = options.amount;
      var provider =
        options.provider ||
        (config.providers && config.providers[0]) ||
        "paystack";

      var payload = {
        publicId: config.merchantId,
        amount: rawAmount,
        email: options.email,
        currency: options.currency || "NGN",
        provider: provider,
        reference: options.reference,
      };

      // Call Paye public transactions initialize endpoint
      fetch(config.papiEndpoint + "/sdk/transactions/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error("HTTP error " + res.status);
          }
          return res.json();
        })
        .then(function (data) {
          if (!data || !data.status || !data.data) {
            throw new Error(data.message || "Failed to initialize transaction");
          }

          var txData = data.data;

          if (provider === "paystack") {
            loadPaystack(function () {
              if (typeof PaystackPop === "undefined") {
                throw new Error(
                  "Paystack SDK not loaded yet. Please retry in a moment.",
                );
              }

              var handler = PaystackPop.setup({
                key: config.publicKey,
                email: options.email,
                amount: Math.round(options.amount * 100),
                ref: txData.reference,
                currency: options.currency || "NGN",
                callback: function (transaction) {
                  console.log(
                    "Paye SDK: Paystack onSuccess fired",
                    transaction,
                  );
                  paymentCompleted = true;

                  if (type === "subscription") {
                    // Subscription Flow: call POST /sdk/subscriptions/create
                    var subPayload = {
                      publicId: config.merchantId,
                      customerEmail: options.email,
                      planId: options.planId,
                      reference: txData.reference,
                    };

                    fetch(config.papiEndpoint + "/sdk/subscriptions/create", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(subPayload),
                    })
                      .then(function (subRes) {
                        if (!subRes.ok) {
                          return subRes.json().then(function (errJson) {
                            throw new Error(
                              errJson.message ||
                                "Failed to create subscription",
                            );
                          });
                        }
                        return subRes.json();
                      })
                      .then(function (subData) {
                        verifyTransaction(txData.reference, options);
                      })
                      .catch(function (subErr) {
                        console.error("Paye SDK Subscription Error:", subErr);
                        var subErrMsg =
                          subErr.message ||
                          subErr ||
                          "Failed to create subscription";
                        if (options.onFailure) {
                          options.onFailure(subErrMsg, {
                            status: "failed",
                            reference: txData.reference,
                            message: subErrMsg,
                          });
                        }
                      });
                  } else {
                    verifyTransaction(txData.reference, options);
                  }
                },
                onClose: function () {
                  _paymentInProgress = false;
                  if (!paymentCompleted && options.onCancel) options.onCancel();
                },
              });
              handler.openIframe();
            });
          } else if (provider === "flutterwave") {
            loadFlutterwave(function () {
              if (typeof FlutterwaveCheckout === "undefined") {
                throw new Error(
                  "Flutterwave SDK not loaded yet. Please retry in a moment.",
                );
              }

              FlutterwaveCheckout({
                public_key: config.publicKey,
                tx_ref:
                  txData.metadata && txData.metadata.tx_ref
                    ? txData.metadata.tx_ref
                    : txData.reference,
                amount: options.amount,
                currency: options.currency || "NGN",
                customer: { email: options.email },
                callback: function (response) {
                  console.log(
                    "Paye SDK: Flutterwave onSuccess fired",
                    response,
                  );
                  paymentCompleted = true;

                  if (type === "subscription") {
                    // Subscription Flow: call POST /sdk/subscriptions/create
                    var subPayload = {
                      publicId: config.merchantId,
                      customerEmail: options.email,
                      planId: options.planId,
                      reference: txData.reference,
                    };

                    fetch(config.papiEndpoint + "/sdk/subscriptions/create", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(subPayload),
                    })
                      .then(function (subRes) {
                        if (!subRes.ok) {
                          return subRes.json().then(function (errJson) {
                            throw new Error(
                              errJson.message ||
                                "Failed to create subscription",
                            );
                          });
                        }
                        return subRes.json();
                      })
                      .then(function (subData) {
                        verifyTransaction(txData.reference, options);
                      })
                      .catch(function (subErr) {
                        console.error("Paye SDK Subscription Error:", subErr);
                        var subErrMsg =
                          subErr.message ||
                          subErr ||
                          "Failed to create subscription";
                        if (options.onFailure) {
                          options.onFailure(subErrMsg, {
                            status: "failed",
                            reference: txData.reference,
                            message: subErrMsg,
                          });
                        }
                      });
                  } else {
                    verifyTransaction(txData.reference, options);
                  }
                },
                onclose: function () {
                  _paymentInProgress = false;
                  if (!paymentCompleted && options.onCancel) options.onCancel();
                },
              });
            });
          } else if (provider === "nomba") {
            // Nomba is redirect-based — no inline SDK
            // Store reference before leaving the page
            try {
              sessionStorage.setItem("paye_nomba_ref", txData.reference);
            } catch (e) {}

            // Redirect customer to Nomba hosted checkout
            window.location.href = txData.auth_url;
          } else {
            throw new Error(
              "Unsupported payment gateway provider: " + provider,
            );
          }
        })
        .catch(function (err) {
          console.error("Paye SDK Checkout Error:", err);
          _paymentInProgress = false;
          var errMsg = err.message || err || "Checkout initialization failed";
          if (options.onFailure)
            options.onFailure(errMsg, { status: "failed", message: errMsg });
        });
    },
  };

  // Auto-verify when Nomba redirects customer back to callbackUrl
  (function checkNombaReturn() {
    var urlParams = new URLSearchParams(window.location.search);
    var orderReference = urlParams.get("orderReference");
    var storedRef = "";
    try {
      storedRef = sessionStorage.getItem("paye_nomba_ref") || "";
    } catch (e) {}

    if (orderReference && storedRef && orderReference === storedRef) {
      try {
        sessionStorage.removeItem("paye_nomba_ref");
      } catch (e) {}

      verifyTransaction(orderReference, {
        onSuccess: function (ref, details) {
          window.dispatchEvent(
            new CustomEvent("paye:success", { detail: details }),
          );
        },
        onFailure: function (err, details) {
          window.dispatchEvent(
            new CustomEvent("paye:failure", { detail: details }),
          );
        },
      });
    }
  })();

  function injectButtons() {
    var targets = document.querySelectorAll("[data-paye-checkout]");
    targets.forEach(function (el) {
      if (el.getAttribute("data-paye-initialized") === "true") return;
      el.setAttribute("data-paye-initialized", "true");

      var amount = el.getAttribute("data-amount");
      var email = el.getAttribute("data-email");
      var amountSource = el.getAttribute("data-amount-source");
      var emailSource = el.getAttribute("data-email-source");
      var currency = el.getAttribute("data-currency") || "NGN";
      var buttonText = el.getAttribute("data-button-text") || "Pay Now";
      var successRedirect = el.getAttribute("data-success-redirect");
      var type = el.getAttribute("data-type") || "payment";
      var planId = el.getAttribute("data-plan-id");
      var reference = el.getAttribute("data-reference");
      var onSuccessCallbackName = el.getAttribute("data-on-success");
      var onFailureCallbackName = el.getAttribute("data-on-failure");
      var onCancelCallbackName = el.getAttribute("data-on-cancel");

      if ((amount || amountSource) && (email || emailSource)) {
        // Avoid injecting multiple buttons in the same container
        if (el.querySelector(".paye-checkout-button")) return;

        var btn = document.createElement("button");
        btn.innerText = buttonText;
        btn.className = "paye-checkout-button";
        btn.style.backgroundColor = "#0ea5e9";
        btn.style.color = "#000000";
        btn.style.border = "none";
        btn.style.padding = "10px 20px";
        btn.style.fontSize = "14px";
        btn.style.fontWeight = "bold";
        btn.style.borderRadius = "6px";
        btn.style.cursor = "pointer";
        btn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        btn.style.transition = "background-color 0.2s";
        btn.onmouseover = function () {
          btn.style.backgroundColor = "#38bdf8";
        };
        btn.onmouseout = function () {
          btn.style.backgroundColor = "#0ea5e9";
        };

        btn.onclick = function () {
          if (_paymentInProgress) {
            console.warn("Paye SDK: Payment already in progress");
            return;
          }

          var finalEmail = email;
          if (!finalEmail && emailSource) {
            var emailInput = document.querySelector(emailSource);
            if (emailInput) {
              finalEmail =
                emailInput.value ||
                emailInput.innerText ||
                emailInput.textContent ||
                "";
            }
          }

          var finalAmount = amount;
          if (!finalAmount && amountSource) {
            var amountInput = document.querySelector(amountSource);
            if (amountInput) {
              var rawVal =
                amountInput.value ||
                amountInput.innerText ||
                amountInput.textContent ||
                "";
              finalAmount = rawVal.replace(/[^\d.]/g, "");
            }
          }

          if (
            !finalEmail ||
            !finalAmount ||
            isNaN(parseFloat(finalAmount)) ||
            parseFloat(finalAmount) <= 0
          ) {
            alert("Please enter a valid email address and payment amount.");
            return;
          }

          if (type === "subscription" && !planId) {
            alert("Subscription checkout requires a plan ID.");
            return;
          }

          btn.disabled = true;
          var origText = btn.innerText;
          btn.innerText = "Processing...";

          window.Paye.pay({
            type: type,
            planId: planId,
            amount: parseFloat(finalAmount),
            email: finalEmail,
            currency: currency,
            reference: reference,
            onSuccess: function (ref, details) {
              btn.disabled = false;
              btn.innerText = origText;
              if (
                onSuccessCallbackName &&
                typeof window[onSuccessCallbackName] === "function"
              ) {
                try {
                  window[onSuccessCallbackName](ref, details);
                } catch (e) {
                  console.error(
                    "Paye SDK Error in data-on-success callback:",
                    e,
                  );
                }
              }
              if (successRedirect) {
                window.location.href =
                  successRedirect +
                  (successRedirect.indexOf("?") === -1 ? "?" : "&") +
                  "reference=" +
                  ref;
              } else if (!onSuccessCallbackName) {
                alert("Payment successful! Reference: " + ref);
              }
            },
            onFailure: function (err, details) {
              btn.disabled = false;
              btn.innerText = origText;
              if (
                onFailureCallbackName &&
                typeof window[onFailureCallbackName] === "function"
              ) {
                try {
                  window[onFailureCallbackName](err, details);
                } catch (e) {
                  console.error(
                    "Paye SDK Error in data-on-failure callback:",
                    e,
                  );
                }
              } else {
                alert("Payment failed: " + err);
              }
            },
            onCancel: function () {
              btn.disabled = false;
              btn.innerText = origText;
              if (
                onCancelCallbackName &&
                typeof window[onCancelCallbackName] === "function"
              ) {
                try {
                  window[onCancelCallbackName]();
                } catch (e) {
                  console.error(
                    "Paye SDK Error in data-on-cancel callback:",
                    e,
                  );
                }
              }
            },
          });
        };
        el.appendChild(btn);
      }
    });
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    injectButtons();
  } else {
    window.addEventListener("DOMContentLoaded", injectButtons);
    window.addEventListener("load", injectButtons);
  }

  // Watch for dynamically rendered data-paye-checkout elements (e.g. React, Vue, SPAs)
  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function (mutations) {
      var shouldScan = false;
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.hasAttribute && node.hasAttribute("data-paye-checkout")) {
            shouldScan = true;
          }
          if (
            node.querySelector &&
            node.querySelector("[data-paye-checkout]")
          ) {
            shouldScan = true;
          }
        });
      });

      if (shouldScan) injectButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
