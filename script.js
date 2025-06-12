// Form data object to store all user inputs
let formData = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  company: "",
  federal_tax_id_available: "",
  ecommerce_seller: "",
  selling_channels__c: [], // Array for multiple selections
  other_online_sales_channels: "",
  user_reported_monthly_revenue: "",
};

// Formatting utility functions

function cleanCurrency(value) {
  // Remove all non-numeric characters except decimal point
  return value.replace(/[^\d]/g, "");
}

function formatCurrency(value) {
  // Remove any non-numeric characters
  const cleaned = value.replace(/[^\d]/g, "");

  if (cleaned === "") return "";

  // Add commas for thousands
  return parseInt(cleaned).toLocaleString("en-US");
}

function isValidEmail(email) {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// HubSpot configuration - Replace these with your actual values
const HUBSPOT_CONFIG = {
  portalId: "19654160", // HubSpot Portal ID from reference form
  formId: "93c4b42b-df7d-4590-8b03-b813655465ab", // HubSpot Form ID from reference form
  get endpoint() {
    return `https://api.hsforms.com/submissions/v3/integration/submit/${this.portalId}/${this.formId}`;
  },
};

// Current step tracking
let currentStep = 1;
const totalSteps = 6;

// GA4 tracking configuration
const GA4_CONFIG = {
  // Step names for better tracking
  stepNames: {
    1: "personal_info",
    2: "company_info",
    3: "online_sales",
    4: "selling_platform",
    5: "monthly_revenue",
    6: "success",
  },

  // Track form start time for completion duration
  formStartTime: null,
  stepStartTimes: {},
};

// Initialize form
document.addEventListener("DOMContentLoaded", function () {
  showStep(1);
  setupEventListeners();
  setupGATracking();
});

function setupEventListeners() {
  // Add input event listeners for real-time data collection
  const firstNameEl = document.getElementById("first-name");
  if (firstNameEl) {
    firstNameEl.addEventListener("input", function (e) {
      formData.firstname = e.target.value;
    });
  }

  const lastNameEl = document.getElementById("last-name");
  if (lastNameEl) {
    lastNameEl.addEventListener("input", function (e) {
      formData.lastname = e.target.value;
    });
  }

  const emailEl = document.getElementById("email");
  if (emailEl) {
    emailEl.addEventListener("input", function (e) {
      formData.email = e.target.value;

      // Clear any existing error styling
      e.target.classList.remove("bizcred-error");

      // Add real-time validation feedback
      if (e.target.value && !isValidEmail(e.target.value)) {
        e.target.classList.add("bizcred-error");
      }
    });
  }

  const phoneEl = document.getElementById("phone");
  if (phoneEl) {
    phoneEl.addEventListener("input", function (e) {
      formData.phone = e.target.value;
    });
  }

  const companyEl = document.getElementById("company-name");
  if (companyEl) {
    companyEl.addEventListener("input", function (e) {
      formData.company = e.target.value;
    });
  }

  const federalTaxIdEl = document.getElementById("federal-tax-id");
  if (federalTaxIdEl) {
    federalTaxIdEl.addEventListener("change", function (e) {
      formData.federal_tax_id_available = e.target.value;
    });
  }

  // Monthly revenue with comma formatting
  const monthlyRevenueEl = document.getElementById("monthly-revenue");
  if (monthlyRevenueEl) {
    monthlyRevenueEl.addEventListener("input", function (e) {
      const cleanValue = cleanCurrency(e.target.value);
      const formattedValue = formatCurrency(cleanValue);

      // Update display value
      e.target.value = formattedValue;
      // Store clean value for HubSpot
      formData.user_reported_monthly_revenue = cleanValue;
    });
  }

  const otherPlatformEl = document.getElementById("other-platform");
  if (otherPlatformEl) {
    otherPlatformEl.addEventListener("input", function (e) {
      formData.other_online_sales_channels = e.target.value;
      // Keep existing platform selections when "other" is used
    });
  }
}

// GA4 Event Tracking Functions
function setupGATracking() {
  // Track initial form view
  trackGA4Event("form_start", {
    form_name: "credit_report_form",
    step_number: 1,
    step_name: GA4_CONFIG.stepNames[1],
  });

  GA4_CONFIG.formStartTime = Date.now();
  GA4_CONFIG.stepStartTimes[1] = Date.now();

  // Track page visibility changes for abandonment
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && currentStep < totalSteps) {
      trackGA4Event("form_abandonment", {
        form_name: "credit_report_form",
        step_number: currentStep,
        step_name: GA4_CONFIG.stepNames[currentStep],
        abandonment_reason: "page_hidden",
      });
    }
  });

  // Track beforeunload for abandonment
  window.addEventListener("beforeunload", function () {
    if (currentStep < totalSteps) {
      trackGA4Event("form_abandonment", {
        form_name: "credit_report_form",
        step_number: currentStep,
        step_name: GA4_CONFIG.stepNames[currentStep],
        abandonment_reason: "page_unload",
      });
    }
  });
}

function trackGA4Event(eventName, parameters = {}) {
  // Check if gtag is available
  if (typeof gtag !== "undefined") {
    gtag("event", eventName, {
      event_category: "Form Interaction",
      ...parameters,
    });
  } else {
    // Fallback: log to console for debugging
    console.log("GA4 Event:", eventName, parameters);
  }
}

function trackStepView(step) {
  const stepName = GA4_CONFIG.stepNames[step];
  GA4_CONFIG.stepStartTimes[step] = Date.now();

  trackGA4Event("form_step_view", {
    form_name: "credit_report_form",
    step_number: step,
    step_name: stepName,
    total_steps: totalSteps,
  });
}

function trackStepCompletion(step) {
  const stepName = GA4_CONFIG.stepNames[step];
  const stepDuration = Date.now() - (GA4_CONFIG.stepStartTimes[step] || Date.now());

  trackGA4Event("form_step_complete", {
    form_name: "credit_report_form",
    step_number: step,
    step_name: stepName,
    step_duration_ms: stepDuration,
    completion_rate: ((step / totalSteps) * 100).toFixed(1),
  });
}

function trackValidationError(step, errorMessage) {
  const stepName = GA4_CONFIG.stepNames[step];

  trackGA4Event("form_validation_error", {
    form_name: "credit_report_form",
    step_number: step,
    step_name: stepName,
    error_message: errorMessage,
  });
}

function trackFormSubmission() {
  const totalDuration = Date.now() - GA4_CONFIG.formStartTime;

  trackGA4Event("form_submit", {
    form_name: "credit_report_form",
    total_duration_ms: totalDuration,
    completed_steps: currentStep,
  });
}

function trackFormConversion() {
  const totalDuration = Date.now() - GA4_CONFIG.formStartTime;

  // Standard GA4 conversion event
  trackGA4Event("conversion", {
    currency: "USD",
    value: 1, // You can assign a value to this conversion
    form_name: "credit_report_form",
  });

  // Custom conversion event with more details
  trackGA4Event("credit_report_conversion", {
    form_name: "credit_report_form",
    total_duration_ms: totalDuration,
    user_type: formData.ecommerce_seller === "yes" ? "online_seller" : "offline_business",
    platform: formData.selling_channels__c.join(", ") || formData.other_online_sales_channels || "not_specified",
    has_federal_tax_id: formData.federal_tax_id_available,
    revenue_provided: !!formData.user_reported_monthly_revenue,
  });
}

function showStep(step) {
  // Hide all steps
  document.querySelectorAll(".bizcred-form-step").forEach((stepEl) => {
    stepEl.classList.remove("bizcred-active");
  });

  // Show current step
  document.getElementById(`step-${step}`).classList.add("bizcred-active");
  currentStep = step;

  // Track step view
  trackStepView(step);
}

function nextStep(step) {
  if (!validateStep(step)) {
    return;
  }

  // Track step completion
  trackStepCompletion(step);

  // Animate to next step
  const currentStepEl = document.getElementById(`step-${step}`);
  currentStepEl.style.transform = "translateX(-100%)";

  setTimeout(() => {
    showStep(step + 1);
    const nextStepEl = document.getElementById(`step-${step + 1}`);
    nextStepEl.style.transform = "translateX(100%)";
    setTimeout(() => {
      nextStepEl.style.transform = "translateX(0)";
    }, 50);
  }, 300);
}

function validateStep(step) {
  switch (step) {
    case 1:
      const firstName = document.getElementById("first-name").value.trim();
      const lastName = document.getElementById("last-name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();

      if (!firstName) {
        showError("Please enter your first name");
        return false;
      }
      if (!lastName) {
        showError("Please enter your last name");
        return false;
      }
      if (!email) {
        showError("Please enter your email");
        return false;
      }
      if (!isValidEmail(email)) {
        showError("Please enter a valid email address");
        return false;
      }
      if (!phone) {
        showError("Please enter your phone number");
        return false;
      }
      return true;

    case 2:
      const companyName = document.getElementById("company-name").value.trim();
      const federalTaxId = document.getElementById("federal-tax-id").value;

      if (!companyName) {
        showError("Please enter your company name");
        return false;
      }
      if (!federalTaxId) {
        showError("Please select if you have a Federal Tax ID");
        return false;
      }
      return true;

    case 3:
      if (!formData.ecommerce_seller) {
        showError("Please select if you sell online");
        return false;
      }
      return true;

    case 4:
      if (formData.selling_channels__c.length === 0 && !formData.other_online_sales_channels) {
        showError("Please select where you primarily sell");
        return false;
      }
      return true;

    case 5:
      const monthlyRevenue = document.getElementById("monthly-revenue").value;
      if (!monthlyRevenue || monthlyRevenue <= 0) {
        showError("Please enter your monthly revenue");
        return false;
      }
      return true;

    default:
      return true;
  }
}

function selectOption(button, field) {
  // Remove selected class from all buttons in the group
  button.parentElement.querySelectorAll(".bizcred-option-btn").forEach((btn) => {
    btn.classList.remove("bizcred-selected");
  });

  // Add selected class to clicked button
  button.classList.add("bizcred-selected");

  // Store the value
  formData[field] = button.dataset.value;

  // Update hidden input for HubSpot
  const hiddenInput = document.getElementById("ecommerce-seller-hidden");
  if (hiddenInput) {
    hiddenInput.value = button.dataset.value;
  }
}

function togglePlatform(button) {
  const value = button.dataset.value;

  // Toggle selected state
  if (button.classList.contains("bizcred-selected")) {
    // Remove from selection
    button.classList.remove("bizcred-selected");
    formData.selling_channels__c = formData.selling_channels__c.filter((p) => p !== value);

    // Uncheck corresponding hidden checkbox
    const checkbox = document.getElementById(`${value.toLowerCase()}-checkbox`);
    if (checkbox) {
      checkbox.checked = false;
    }
  } else {
    // Add to selection
    button.classList.add("bizcred-selected");
    if (!formData.selling_channels__c.includes(value)) {
      formData.selling_channels__c.push(value);
    }

    // Check corresponding hidden checkbox
    const checkbox = document.getElementById(`${value.toLowerCase()}-checkbox`);
    if (checkbox) {
      checkbox.checked = true;
    }
  }

  // Keep "other" input - both can be used together
}

function showError(message) {
  // Find the active step
  const activeStep = document.querySelector(".bizcred-form-step.bizcred-active .bizcred-form-content");
  if (!activeStep) {
    console.warn("Could not find active form step to show error");
    return;
  }

  let errorEl = document.querySelector(".bizcred-error-message");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "bizcred-error-message";
    errorEl.style.cssText = `
            color: #e53e3e;
            background: #fed7d7;
            padding: 12px;
            border-radius: 8px;
            margin: 10px 0;
            font-size: 14px;
            text-align: center;
        `;
    activeStep.prepend(errorEl);
  }

  errorEl.textContent = message;

  // Remove error after 3 seconds
  setTimeout(() => {
    if (errorEl && errorEl.parentNode) {
      errorEl.remove();
    }
  }, 3000);
}

async function submitForm() {
  if (!validateStep(5)) return;

  const submitBtn = document.querySelector(".bizcred-submit-btn");
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = "Submitting...";
  submitBtn.disabled = true;
  submitBtn.classList.add("bizcred-loading");
  trackFormSubmission();

  if (process.env.NODE_ENV === "development") {
    console.log("--- HubSpot Submission Debug ---");
    console.log("Current Step:", currentStep);
    console.log("Form Data:", JSON.stringify(formData, null, 2));
    console.log("HubSpot Config:", {
      portalId: HUBSPOT_CONFIG.portalId,
      formId: HUBSPOT_CONFIG.formId,
      endpoint: HUBSPOT_CONFIG.endpoint,
    });
  }

  try {
    const hubspotPayload = {
      fields: [
        { name: "firstname", value: formData.firstname },
        { name: "lastname", value: formData.lastname },
        { name: "email", value: formData.email },
        { name: "phone", value: formData.phone },
        { name: "company", value: formData.company },
        { name: "federal_tax_id_available", value: formData.federal_tax_id_available },
        { name: "ecommerce_seller", value: formData.ecommerce_seller },
        { name: "selling_channels__c", value: formData.selling_channels__c.join(";") },
        { name: "other_online_sales_channels", value: formData.other_online_sales_channels },
        { name: "user_reported_monthly_revenue", value: formData.user_reported_monthly_revenue },
      ],
      context: {
        hutk: getHubSpotCookie(),
        pageUri: window.location.href,
        pageName: document.title,
      },
    };

    // Always log the payload in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("Submitting to HubSpot with payload:", JSON.stringify(hubspotPayload, null, 2));
    }

    const response = await fetch(HUBSPOT_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hubspotPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error ${response.status} with no JSON body.`,
        errors: [],
      }));
      console.error("HubSpot API Error Response:", errorData);

      const validationErrors = errorData.errors?.map((err) => err.message).join(" ");
      const errorMessage = validationErrors || errorData.message || "An unknown error occurred.";

      throw new Error(`HubSpot submission failed: ${errorMessage}`);
    }

    trackFormConversion();
    showStep(6);

    window.dispatchEvent(
      new CustomEvent("formSubmitted", {
        detail: formData,
      })
    );
  } catch (error) {
    console.error("HubSpot Submission Error:", error);
    showError("Could not submit the form. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    submitBtn.classList.remove("bizcred-loading");
  }
}

/**
 * Reads the HubSpot user token cookie (hubspotutk).
 * @returns {string} The user token or an empty string if not found.
 */
function getHubSpotCookie() {
  try {
    if (!document.cookie) return "";
    const match = document.cookie.match(/hubspotutk=([^;]+)/);
    return match && match[1] ? match[1] : "";
  } catch (error) {
    console.warn("Error reading HubSpot cookie:", error);
    return "";
  }
}

// Alternative submission method for testing without HubSpot
async function submitFormFallback() {
  if (process.env.NODE_ENV === "development") {
    console.log("Fallback submission triggered for testing.");
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
  showStep(6);
}

// --- GLOBAL API & INITIALIZATION ---

/**
 * The primary initialization function.
 * Can be called automatically or manually with a config.
 */
function initializeCreditForm(config = {}) {
  // Prevent re-initialization
  if (window.creditFormInitialized) return;

  // Override HubSpot config if provided via manual call
  if (config.portalId) HUBSPOT_CONFIG.portalId = config.portalId;
  if (config.formId) HUBSPOT_CONFIG.formId = config.formId;
  // The endpoint getter in HUBSPOT_CONFIG will handle the update automatically.

  // Setup main functionality
  setupEventListeners();
  setupGATracking();
  showStep(1);

  window.creditFormInitialized = true;
}

// Expose methods for external control (e.g., in Webflow)
window.CreditReportForm = {
  /**
   * Initializes the form with an optional configuration object.
   * @param {object} config - { portalId: string, formId: string }
   */
  init: initializeCreditForm,

  /**
   * Returns the current state of the form data.
   * @returns {object}
   */
  getData: () => formData,

  /**
   * Applies a specific class to the body for Webflow styling overrides.
   * This is best called from Webflow's custom code editor.
   */
  setWebflowMode: () => {
    document.body.classList.add("bizcred-webflow-embed");
    document.querySelector(".bizcred-form-container").classList.add("bizcred-webflow-embed");
  },
};

// Expose step navigation and submission functions for easy access
window.bizCredForm = {
  nextStep,
  selectOption,
  togglePlatform,
  submitForm,
};

/**
 * Auto-initialization logic.
 * This robustly calls the initialization function as soon as the DOM is ready,
 * which works for both regular and async/deferred script loading.
 */
function autoInit() {
  initializeCreditForm();
}

// Check if the DOM is ready.
if (document.readyState === "loading") {
  // Loading hasn't finished yet, wait for the event.
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  // `DOMContentLoaded` has already fired, run now.
  autoInit();
}
