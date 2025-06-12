# GA4 Form Tracking Integration Guide

## Overview

This integration provides comprehensive tracking for your credit report form, including:

- Form views and starts
- Step-by-step progression tracking
- Drop-off/abandonment analysis
- Conversion tracking
- User engagement metrics
- Validation error tracking

## Setup Instructions

### 1. GA4 Property Setup

First, ensure you have GA4 set up on your site:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "GA_MEASUREMENT_ID");
</script>
```

### 2. Include Tracking Script

Add the GA4 tracking script to your HTML:

```html
<script src="ga4-tracking.js"></script>
```

### 3. Integration with Existing Form

To integrate with your existing form script, add these calls to your `script.js`:

```javascript
// In showStep function:
function showStep(step) {
  // ... existing code ...

  // Add GA4 tracking
  if (window.GA4FormTracker) {
    window.GA4FormTracker.trackStepView(step);
  }
}

// In nextStep function:
function nextStep(step) {
  if (!validateStep(step)) {
    return;
  }

  // Add GA4 tracking for step completion
  if (window.GA4FormTracker) {
    window.GA4FormTracker.trackStepComplete(step);
  }

  // ... rest of existing code ...
}

// In showError function:
function showError(message) {
  // Add GA4 tracking for validation errors
  if (window.GA4FormTracker) {
    window.GA4FormTracker.trackValidationError(currentStep, message);
  }

  // ... existing code ...
}

// In submitForm function:
async function submitForm() {
  // ... existing validation ...

  // Track form submission
  if (window.GA4FormTracker) {
    window.GA4FormTracker.trackSubmission(formData);
  }

  try {
    // ... existing submission logic ...

    if (response.ok) {
      // Track successful conversion
      if (window.GA4FormTracker) {
        window.GA4FormTracker.trackConversion(formData);
      }

      showStep(6);
    }
  } catch (error) {
    // ... error handling ...
  }
}
```

## Events Tracked

### 1. Form Start

- **Event:** `BizCred - form_start`
- **Triggers:** When form first loads
- **Parameters:** step_number, step_name, timestamp

### 2. Step Views

- **Event:** `BizCred - form_step_view`
- **Triggers:** When user enters a new step
- **Parameters:** step_number, step_name, progress_percentage

### 3. Step Completions

- **Event:** `BizCred - form_step_complete`
- **Triggers:** When user successfully completes a step
- **Parameters:** step_number, step_name, step_duration_ms, completion_rate

### 4. Validation Errors

- **Event:** `BizCred - form_validation_error`
- **Triggers:** When form validation fails
- **Parameters:** step_number, step_name, error_message, field_name

### 5. Form Submission

- **Event:** `BizCred - form_submit`
- **Triggers:** When form is submitted (regardless of success)
- **Parameters:** total_duration_ms, completed_steps, user_engagement_score

### 6. Conversion

- **Event:** `BizCred - conversion` & `BizCred - credit_report_conversion`
- **Triggers:** When form successfully converts
- **Parameters:** value, transaction_id, user_type, selling_platform, revenue_range

### 7. Form Abandonment

- **Event:** `BizCred - form_abandonment`
- **Triggers:** When user leaves form incomplete
- **Parameters:** step_number, abandonment_reason, time_spent_ms, progress_percentage

### 8. Field Interactions (Optional)

- **Event:** `BizCred - form_field_interaction`
- **Triggers:** When user interacts with form fields
- **Parameters:** field_name, action, step_number, has_value

## GA4 Reports to Create

### 1. Form Funnel Analysis

Create a funnel report to track step-by-step conversion:

```
Step 1: BizCred - form_start
Step 2: BizCred - form_step_complete (step_number = 1)
Step 3: BizCred - form_step_complete (step_number = 2)
Step 4: BizCred - form_step_complete (step_number = 3)
Step 5: BizCred - form_step_complete (step_number = 4)
Step 6: BizCred - form_step_complete (step_number = 5)
Step 7: BizCred - conversion
```

### 2. Drop-off Analysis

Monitor where users abandon the form:

- Events: `BizCred - form_abandonment`
- Dimensions: `step_name`, `abandonment_reason`
- Metrics: Count of events, average time spent

### 3. Validation Error Tracking

Track common form errors:

- Events: `BizCred - form_validation_error`
- Dimensions: `step_name`, `error_message`
- Metrics: Error count, error rate by step

### 4. User Engagement Metrics

Analyze user behavior:

- Custom metric: `user_engagement_score`
- Dimensions: `user_type`, `selling_platform`
- Analyze correlation with conversion rates

## Conversion Goals Setup

### 1. Standard Conversion

- **Goal Type:** Event
- **Event Name:** `BizCred - conversion`
- **Value:** $1 (or your assigned value)

### 2. Enhanced Conversion

- **Goal Type:** Event
- **Event Name:** `BizCred - credit_report_conversion`
- **Additional tracking:** User segments, revenue ranges

## Custom Dimensions (Recommended)

Set up these custom dimensions in GA4:

1. `form_name` - Text
2. `step_name` - Text
3. `user_type` - Text
4. `selling_platform` - Text
5. `revenue_range` - Text
6. `user_engagement_score` - Number

## Webflow Integration

For Webflow sites, add this to your site's custom code:

```html
<!-- In <head> tag -->
<script src="https://your-domain.com/ga4-tracking.js"></script>

<!-- Or inline the script -->
<script>
  // Paste the entire ga4-tracking.js content here
</script>
```

## Bun.js Bundler Setup

When you set up your bundler, you can import the tracking:

```javascript
// main.js
import "./ga4-tracking.js";
import "./script.js";

// Or as ES modules if you convert the script
import { GA4FormTracker } from "./ga4-tracking.js";
```

## Testing & Debugging

1. **Console Logs:** The script logs all events to console when on localhost or webflow.io domains
2. **GA4 DebugView:** Use GA4's DebugView to verify events in real-time
3. **GTM Preview:** If using Google Tag Manager, use preview mode

## Data Retention

- Event data: 14 months (GA4 standard)
- Conversion data: 14 months
- Custom parameters: 14 months

## Privacy Considerations

The tracking script:

- ✅ Does not collect PII directly
- ✅ Respects GA4's data retention settings
- ✅ Works with consent management platforms
- ✅ Can be disabled if gtag is not loaded

## Optimization Recommendations

Based on the tracking data, optimize:

1. **High drop-off steps** - Simplify or provide better guidance
2. **Common validation errors** - Improve field instructions
3. **Low engagement scores** - Enhance UX for specific user types
4. **Platform-specific patterns** - Tailor experience by selling platform
