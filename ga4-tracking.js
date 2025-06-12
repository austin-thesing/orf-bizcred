/**
 * GA4 Form Tracking Script for Credit Report Form
 * Tracks form views, step completions, drop-offs, and conversions
 */

// GA4 tracking configuration
const GA4_FORM_TRACKER = {
  // Form configuration
  formName: "credit_report_form",

  // Step names for better tracking
  stepNames: {
    1: "personal_info",
    2: "company_info",
    3: "online_sales",
    4: "selling_platform",
    5: "monthly_revenue",
    6: "success",
  },

  // Track form timing
  formStartTime: null,
  stepStartTimes: {},

  // Track user interactions
  userInteractions: {
    clicks: 0,
    keystrokes: 0,
    scrolls: 0,
  },

  // Current state
  currentStep: 1,
  totalSteps: 6,

  // Tracking flags
  hasTrackedFormStart: false,
  hasTrackedSubmission: false,
  hasTrackedConversion: false,
};

/**
 * Main GA4 event tracking function
 */
function trackGA4Event(eventName, parameters = {}) {
  // Add BizCred prefix to all event names
  const prefixedEventName = `BizCred - ${eventName}`;

  // Check if gtag is available
  if (typeof gtag !== "undefined") {
    gtag("event", prefixedEventName, {
      event_category: "Form Interaction",
      form_name: GA4_FORM_TRACKER.formName,
      ...parameters,
    });

    // Also send to console in debug mode
    if (window.location.hostname === "localhost" || window.location.hostname.includes("webflow.io")) {
      console.log("🔥 GA4 Event:", prefixedEventName, parameters);
    }
  } else {
    // Fallback: log to console for debugging
    console.log("⚠️  GA4 not loaded. Event:", prefixedEventName, parameters);
  }
}

/**
 * Initialize GA4 form tracking
 */
function initGA4FormTracking() {
  if (GA4_FORM_TRACKER.hasTrackedFormStart) return;

  // Track initial form view
  trackGA4Event("form_start", {
    step_number: 1,
    step_name: GA4_FORM_TRACKER.stepNames[1],
    timestamp: new Date().toISOString(),
  });

  GA4_FORM_TRACKER.formStartTime = Date.now();
  GA4_FORM_TRACKER.stepStartTimes[1] = Date.now();
  GA4_FORM_TRACKER.hasTrackedFormStart = true;

  // Setup interaction tracking
  setupInteractionTracking();

  // Setup abandonment tracking
  setupAbandonmentTracking();
}

/**
 * Track form step view
 */
function trackFormStepView(step) {
  const stepName = GA4_FORM_TRACKER.stepNames[step];
  GA4_FORM_TRACKER.stepStartTimes[step] = Date.now();
  GA4_FORM_TRACKER.currentStep = step;

  trackGA4Event("form_step_view", {
    step_number: step,
    step_name: stepName,
    total_steps: GA4_FORM_TRACKER.totalSteps,
    progress_percentage: ((step / GA4_FORM_TRACKER.totalSteps) * 100).toFixed(1),
  });
}

/**
 * Track form step completion
 */
function trackFormStepComplete(step) {
  const stepName = GA4_FORM_TRACKER.stepNames[step];
  const stepDuration = Date.now() - (GA4_FORM_TRACKER.stepStartTimes[step] || Date.now());

  trackGA4Event("form_step_complete", {
    step_number: step,
    step_name: stepName,
    step_duration_ms: stepDuration,
    step_duration_seconds: Math.round(stepDuration / 1000),
    completion_rate: ((step / GA4_FORM_TRACKER.totalSteps) * 100).toFixed(1),
  });
}

/**
 * Track validation errors
 */
function trackFormValidationError(step, errorMessage, fieldName = null) {
  const stepName = GA4_FORM_TRACKER.stepNames[step];

  trackGA4Event("form_validation_error", {
    step_number: step,
    step_name: stepName,
    error_message: errorMessage,
    field_name: fieldName,
    error_type: "validation",
  });
}

/**
 * Track form field interactions
 */
function trackFormFieldInteraction(fieldName, action, value = null) {
  trackGA4Event("form_field_interaction", {
    field_name: fieldName,
    action: action, // 'focus', 'blur', 'input', 'select'
    step_number: GA4_FORM_TRACKER.currentStep,
    step_name: GA4_FORM_TRACKER.stepNames[GA4_FORM_TRACKER.currentStep],
    has_value: !!value,
  });
}

/**
 * Track form submission
 */
function trackFormSubmission(formData) {
  if (GA4_FORM_TRACKER.hasTrackedSubmission) return;

  const totalDuration = Date.now() - GA4_FORM_TRACKER.formStartTime;

  trackGA4Event("form_submit", {
    total_duration_ms: totalDuration,
    total_duration_seconds: Math.round(totalDuration / 1000),
    completed_steps: GA4_FORM_TRACKER.currentStep,
    total_interactions: GA4_FORM_TRACKER.userInteractions.clicks + GA4_FORM_TRACKER.userInteractions.keystrokes,
    user_engagement_score: calculateEngagementScore(),
  });

  GA4_FORM_TRACKER.hasTrackedSubmission = true;
}

/**
 * Track successful form conversion
 */
function trackFormConversion(formData) {
  if (GA4_FORM_TRACKER.hasTrackedConversion) return;

  const totalDuration = Date.now() - GA4_FORM_TRACKER.formStartTime;

  // Standard GA4 conversion event
  trackGA4Event("conversion", {
    currency: "USD",
    value: 1, // Assign monetary value to conversion
    transaction_id: generateTransactionId(),
  });

  // Enhanced conversion tracking with form details
  trackGA4Event("credit_report_conversion", {
    total_duration_ms: totalDuration,
    total_duration_seconds: Math.round(totalDuration / 1000),
    user_type: formData.sells_online === "yes" ? "online_seller" : "offline_business",
    selling_platform: formData.primary_platform || formData.other_platform || "not_specified",
    has_federal_tax_id: formData.federal_tax_id,
    revenue_provided: !!formData.monthly_revenue,
    revenue_range: getRevenueRange(formData.monthly_revenue),
    completion_funnel: `${GA4_FORM_TRACKER.totalSteps}/${GA4_FORM_TRACKER.totalSteps}`,
    user_engagement_score: calculateEngagementScore(),
  });

  GA4_FORM_TRACKER.hasTrackedConversion = true;
}

/**
 * Track form abandonment
 */
function trackFormAbandonment(reason, step = null) {
  const currentStep = step || GA4_FORM_TRACKER.currentStep;
  const stepName = GA4_FORM_TRACKER.stepNames[currentStep];
  const timeSpent = Date.now() - GA4_FORM_TRACKER.formStartTime;

  trackGA4Event("form_abandonment", {
    step_number: currentStep,
    step_name: stepName,
    abandonment_reason: reason,
    time_spent_ms: timeSpent,
    time_spent_seconds: Math.round(timeSpent / 1000),
    progress_percentage: ((currentStep / GA4_FORM_TRACKER.totalSteps) * 100).toFixed(1),
    user_engagement_score: calculateEngagementScore(),
  });
}

/**
 * Setup user interaction tracking
 */
function setupInteractionTracking() {
  // Track clicks
  document.addEventListener("click", function () {
    GA4_FORM_TRACKER.userInteractions.clicks++;
  });

  // Track keystrokes
  document.addEventListener("keydown", function () {
    GA4_FORM_TRACKER.userInteractions.keystrokes++;
  });

  // Track scrolls
  let scrollTimeout;
  document.addEventListener("scroll", function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      GA4_FORM_TRACKER.userInteractions.scrolls++;
    }, 150);
  });
}

/**
 * Setup form abandonment tracking
 */
function setupAbandonmentTracking() {
  // Track page visibility changes
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && GA4_FORM_TRACKER.currentStep < GA4_FORM_TRACKER.totalSteps) {
      trackFormAbandonment("page_hidden");
    }
  });

  // Track page unload
  window.addEventListener("beforeunload", function () {
    if (GA4_FORM_TRACKER.currentStep < GA4_FORM_TRACKER.totalSteps) {
      trackFormAbandonment("page_unload");
    }
  });

  // Track form timeout (if user is inactive for 5 minutes)
  let inactivityTimer;
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (GA4_FORM_TRACKER.currentStep < GA4_FORM_TRACKER.totalSteps) {
        trackFormAbandonment("inactivity_timeout");
      }
    }, 300000); // 5 minutes
  };

  ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach((event) => {
    document.addEventListener(event, resetInactivityTimer, true);
  });

  resetInactivityTimer();
}

/**
 * Calculate user engagement score
 */
function calculateEngagementScore() {
  const timeSpent = Date.now() - GA4_FORM_TRACKER.formStartTime;
  const timeScore = Math.min(timeSpent / 60000, 5); // Max 5 points for 5+ minutes
  const interactionScore = Math.min((GA4_FORM_TRACKER.userInteractions.clicks + GA4_FORM_TRACKER.userInteractions.keystrokes) / 20, 5); // Max 5 points for 20+ interactions
  const progressScore = (GA4_FORM_TRACKER.currentStep / GA4_FORM_TRACKER.totalSteps) * 10; // Max 10 points for completion

  return Math.round(timeScore + interactionScore + progressScore);
}

/**
 * Get revenue range for better segmentation
 */
function getRevenueRange(revenue) {
  if (!revenue) return "not_provided";

  const num = parseInt(revenue);
  if (num < 1000) return "under_1k";
  if (num < 5000) return "1k_5k";
  if (num < 10000) return "5k_10k";
  if (num < 25000) return "10k_25k";
  if (num < 50000) return "25k_50k";
  if (num < 100000) return "50k_100k";
  return "over_100k";
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId() {
  return "cr_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

/**
 * Enhanced ecommerce tracking for conversion funnel
 */
function trackEcommerceFunnel() {
  // Track as enhanced ecommerce funnel
  if (typeof gtag !== "undefined") {
    gtag("event", "begin_checkout", {
      currency: "USD",
      value: 1,
      items: [
        {
          item_id: "credit_report",
          item_name: "Business Credit Report",
          category: "Lead Generation",
          quantity: 1,
          price: 1,
        },
      ],
    });
  }
}

// Export functions for global use
window.GA4FormTracker = {
  init: initGA4FormTracking,
  trackStepView: trackFormStepView,
  trackStepComplete: trackFormStepComplete,
  trackValidationError: trackFormValidationError,
  trackFieldInteraction: trackFormFieldInteraction,
  trackSubmission: trackFormSubmission,
  trackConversion: trackFormConversion,
  trackAbandonment: trackFormAbandonment,
  trackEcommerceFunnel: trackEcommerceFunnel,
};

// Auto-initialize if DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGA4FormTracking);
} else {
  initGA4FormTracking();
}
