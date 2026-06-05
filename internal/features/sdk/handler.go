package sdk

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/transactions"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/models"
)

type SDKHandler struct {
	userRepo           user.IUserRepo
	projectRepo        projects.IProjectRepo
	providerRepo       *providers.ProviderRepo
	transactionService *transactions.TransactionService
	encryptionKey      string
}

func NewSDKHandler(
	userRepo user.IUserRepo,
	projectRepo projects.IProjectRepo,
	providerRepo *providers.ProviderRepo,
	transactionService *transactions.TransactionService,
	encryptionKey string,
) *SDKHandler {
	return &SDKHandler{
		userRepo:           userRepo,
		projectRepo:        projectRepo,
		providerRepo:       providerRepo,
		transactionService: transactionService,
		encryptionKey:      encryptionKey,
	}
}

type InitializeSDKTransactionRequest struct {
	PublicID string  `json:"publicId" binding:"required"`
	Amount   float64 `json:"amount" binding:"required"`
	Email    string  `json:"email" binding:"required,email"`
	Currency string  `json:"currency"`
	Provider string  `json:"provider"`
}

// ServeSDK serves the dynamic Javascript SDK script file for the merchant
func (h *SDKHandler) ServeSDK(c *gin.Context) {
	param := c.Param("publicId")
	publicID := strings.TrimSuffix(param, ".js")

	if publicID == "" {
		c.Header("Content-Type", "application/javascript")
		c.String(http.StatusBadRequest, "console.error('Paye SDK Error: Missing or invalid Public ID parameter');")
		return
	}

	// 1. Resolve project by PublicID
	project, err := h.resolveProjectByPublicID(c.Request.Context(), publicID)
	if err != nil || project == nil {
		c.Header("Content-Type", "application/javascript")
		c.String(http.StatusNotFound, fmt.Sprintf("console.error('Paye SDK Error: Project/Merchant not found for Public ID: %s');", publicID))
		return
	}

	// 2. Fetch project provider configurations
	configs := h.providerRepo.ListProviders(c.Request.Context(), project.Base.ID.String())

	var activeProviders []string
	var activePublicKey string

	for _, pc := range configs {
		if pc.IsActive {
			activeProviders = append(activeProviders, pc.ProviderName)

			// Decrypt public key using key derivation
			decryptedPublic, err := crypto.Decrypt(pc.PublicKey, h.encryptionKey)
			if err == nil && activePublicKey == "" {
				// Pick first active provider's public key (e.g. Paystack) to embed
				activePublicKey = decryptedPublic
			}
		}
	}

	providersJSON, _ := json.Marshal(activeProviders)

	// Determine dynamic host domain
	scheme := "http"
	if c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	papiEndpoint := fmt.Sprintf("%s://%s/api/v1", scheme, c.Request.Host)

	// Build dynamic JS SDK script string (Paystack pop inline checkout)
	jsCode := fmt.Sprintf(`(function() {
    var config = {
        merchantId: "%s",
        providers: %s,
        publicKey: "%s",
        papiEndpoint: "%s"
    };

    function loadPaystack(callback) {
        if (window.PaystackPop) {
            callback();
            return;
        }
        var existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
        if (existingScript) {
            var oldOnload = existingScript.onload;
            existingScript.onload = function() {
                if (oldOnload) oldOnload();
                callback();
            };
            return;
        }
        var s = document.createElement('script');
        s.src = "https://js.paystack.co/v1/inline.js";
        s.onload = function() {
            callback();
        };
        s.onerror = function() {
            console.error("Paye SDK Error: Failed to load Paystack inline script");
        };
        document.head.appendChild(s);
    }

    // Pre-load Paystack script if Paystack is an active provider
    if (config.providers && config.providers.indexOf('paystack') !== -1) {
        loadPaystack(function(){});
    }

    window.Paye = {
        config: config,
        pay: function(options) {
            if (!options || !options.email || !options.amount) {
                console.error("Paye SDK Error: email and amount are required fields");
                if (options.onFailure) options.onFailure("Missing required fields");
                return;
            }

            var rawAmount = options.amount;
            var provider = options.provider || (config.providers && config.providers[0]) || 'paystack';

            var payload = {
                publicId: config.merchantId,
                amount: rawAmount,
                email: options.email,
                currency: options.currency || 'NGN',
                provider: provider
            };

            // Call Paye public transactions initialize endpoint
            fetch(config.papiEndpoint + "/sdk/transactions/initialize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            })
            .then(function(res) {
                if (!res.ok) {
                    throw new Error("HTTP error " + res.status);
                }
                return res.json();
            })
            .then(function(data) {
                if (!data || !data.status || !data.data) {
                    throw new Error(data.message || "Failed to initialize transaction");
                }
                
                var txData = data.data;
                
                if (provider === 'paystack') {
                    loadPaystack(function() {
                        if (typeof PaystackPop === 'undefined') {
                            throw new Error("Paystack SDK not loaded yet. Please retry in a moment.");
                        }
                        
                        var handler = PaystackPop.setup({
                            key: config.publicKey,
                            access_code: txData.access_code,
                            email: options.email,
                            amount: Math.round(options.amount * 100),
                            ref: txData.reference,
                            onSuccess: function(transaction) {
                                if (options.onSuccess) options.onSuccess(txData.reference);
                            },
                            onCancel: function() {
                                if (options.onCancel) options.onCancel();
                            }
                        });
                        handler.openIframe();
                    });
                } else {
                    throw new Error("Unsupported payment gateway provider: " + provider);
                }
            })
            .catch(function(err) {
                console.error("Paye SDK Checkout Error:", err);
                if (options.onFailure) options.onFailure(err.message || err);
            });
        }
    };

    function injectButtons() {
        var targets = document.querySelectorAll('[data-paye-checkout]');
        targets.forEach(function(el) {
            var amount = el.getAttribute('data-amount');
            var email = el.getAttribute('data-email');
            var amountSource = el.getAttribute('data-amount-source');
            var emailSource = el.getAttribute('data-email-source');
            var currency = el.getAttribute('data-currency') || 'NGN';
            var buttonText = el.getAttribute('data-button-text') || 'Pay Now';
            var successRedirect = el.getAttribute('data-success-redirect');

            if ((amount || amountSource) && (email || emailSource)) {
                // Avoid injecting multiple buttons in the same container
                if (el.querySelector('.paye-checkout-button')) return;

                var btn = document.createElement('button');
                btn.innerText = buttonText;
                btn.className = 'paye-checkout-button';
                btn.style.backgroundColor = '#0ea5e9';
                btn.style.color = '#000000';
                btn.style.border = 'none';
                btn.style.padding = '10px 20px';
                btn.style.fontSize = '14px';
                btn.style.fontWeight = 'bold';
                btn.style.borderRadius = '6px';
                btn.style.cursor = 'pointer';
                btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                btn.style.transition = 'background-color 0.2s';
                btn.onmouseover = function() { btn.style.backgroundColor = '#38bdf8'; };
                btn.onmouseout = function() { btn.style.backgroundColor = '#0ea5e9'; };

                btn.onclick = function() {
                    var finalEmail = email;
                    if (!finalEmail && emailSource) {
                        var emailInput = document.querySelector(emailSource);
                        if (emailInput) {
                            finalEmail = emailInput.value || emailInput.innerText || emailInput.textContent || '';
                        }
                    }

                    var finalAmount = amount;
                    if (!finalAmount && amountSource) {
                        var amountInput = document.querySelector(amountSource);
                        if (amountInput) {
                            var rawVal = amountInput.value || amountInput.innerText || amountInput.textContent || '';
                            finalAmount = rawVal.replace(/[^\d.]/g, '');
                        }
                    }

                    if (!finalEmail || !finalAmount || isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) <= 0) {
                        alert('Please enter a valid email address and payment amount.');
                        return;
                    }

                    btn.disabled = true;
                    var origText = btn.innerText;
                    btn.innerText = 'Processing...';
                    
                    window.Paye.pay({
                        amount: parseFloat(finalAmount),
                        email: finalEmail,
                        currency: currency,
                        onSuccess: function(ref) {
                            btn.disabled = false;
                            btn.innerText = origText;
                            if (successRedirect) {
                                window.location.href = successRedirect + (successRedirect.indexOf('?') === -1 ? '?' : '&') + "reference=" + ref;
                            } else {
                                alert('Payment successful! Reference: ' + ref);
                            }
                        },
                        onFailure: function(err) {
                            btn.disabled = false;
                            btn.innerText = origText;
                            alert('Payment failed: ' + err);
                        },
                        onCancel: function() {
                            btn.disabled = false;
                            btn.innerText = origText;
                        }
                    });
                };
                el.appendChild(btn);
            }
        });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        injectButtons();
    } else {
        window.addEventListener('DOMContentLoaded', injectButtons);
        window.addEventListener('load', injectButtons);
    }
})();`, project.PublicID, providersJSON, activePublicKey, papiEndpoint)

	c.Header("Content-Type", "application/javascript")
	c.String(http.StatusOK, jsCode)
}

// InitializeSDKTransaction initializes transaction publicly using merchant's PublicID
func (h *SDKHandler) InitializeSDKTransaction(c *gin.Context) {
	var req InitializeSDKTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	// 1. Resolve project by PublicID
	project, err := h.resolveProjectByPublicID(c.Request.Context(), req.PublicID)
	if err != nil || project == nil {
		c.JSON(http.StatusNotFound, api.Error(fmt.Sprintf("Project/Merchant not found for Public ID: %s", req.PublicID)))
		return
	}

	provider := req.Provider
	if provider == "" {
		provider = "paystack"
	}

	// 2. Delegate transaction initialization to TransactionService
	initReq := &dto.InitializeTransactionRequest{
		Amount:   req.Amount,
		Email:    req.Email,
		Currency: req.Currency,
		Provider: provider,
	}
	if initReq.Currency == "" {
		initReq.Currency = "NGN"
	}

	resp, err := h.transactionService.InitializeTransaction(c.Request.Context(), project.Base.ID.String(), initReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transaction initialized successfully", resp))
}

func (h *SDKHandler) resolveProjectByPublicID(ctx context.Context, publicID string) (*models.Project, error) {
	// Try finding project by PublicID first
	project, err := h.projectRepo.FindByPublicID(ctx, publicID)
	if err == nil && project != nil {
		return project, nil
	}

	// Legacy fallback: look up user by PublicID
	merchant, err := h.userRepo.FindByPublicID(publicID)
	if err != nil || merchant == nil {
		return nil, fmt.Errorf("merchant or project not found for Public ID: %s", publicID)
	}

	// Find first project or create default project
	projs, err := h.projectRepo.ListProjects(ctx, merchant.Base.ID.String())
	if err == nil && len(projs) > 0 {
		return projs[0], nil
	}

	// Auto-create default project
	apiKey, err := crypto.GenerateAPIKey()
	if err != nil {
		return nil, err
	}
	defaultProject := &models.Project{
		Name:     "Default Project",
		ApiKey:   apiKey,
		PublicID: merchant.PublicID,
		UserID:   merchant.Base.ID,
	}
	if err := h.projectRepo.CreateProject(ctx, defaultProject); err != nil {
		return nil, err
	}
	return defaultProject, nil
}

