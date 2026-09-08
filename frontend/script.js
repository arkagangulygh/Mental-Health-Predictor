(() => {
  "use strict";

  const API_BASE = "https://mental-health-predictor-tzdo.onrender.com";

  const form = document.getElementById("predict-form");
  const submitBtn = document.getElementById("submit-btn");
  const resetBtn = document.getElementById("reset-btn");
  const errorRetryBtn = document.getElementById("error-retry-btn");

  const stateIdle = document.getElementById("state-idle");
  const stateLoading = document.getElementById("state-loading");
  const stateResult = document.getElementById("state-result");
  const stateError = document.getElementById("state-error");

  const scoreNumberEl = document.getElementById("score-number");
  const scoreBandEl = document.getElementById("score-band");
  const scoreContextEl = document.getElementById("score-context");
  const gaugeFill = document.getElementById("gauge-fill");
  const errorCopyEl = document.getElementById("error-copy");

  const segGroup = document.getElementById("stress_level_group");
  const stressHiddenInput = document.getElementById("stress_level");

  const GAUGE_ARC_LENGTH = 314;


  // Draw gauge ticks
  function drawTicks() {
    document.querySelectorAll(".gauge-ticks").forEach((g) => {
      g.innerHTML = "";

      const cx = 120;
      const cy = 140;
      const rOuter = 100;
      const rInner = 90;

      for (let i = 0; i <= 10; i += 2) {
        const angle = Math.PI - (i / 10) * Math.PI;

        const x1 = cx + rOuter * Math.cos(angle);
        const y1 = cy - rOuter * Math.sin(angle);

        const x2 = cx + rInner * Math.cos(angle);
        const y2 = cy - rInner * Math.sin(angle);

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );

        line.setAttribute("x1", x1.toFixed(1));
        line.setAttribute("y1", y1.toFixed(1));
        line.setAttribute("x2", x2.toFixed(1));
        line.setAttribute("y2", y2.toFixed(1));

        g.appendChild(line);
      }
    });
  }

  drawTicks();


  // Stress level buttons
  segGroup.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      segGroup.querySelectorAll(".seg-btn").forEach((b) => {
        b.classList.remove("active");
      });

      btn.classList.add("active");
      stressHiddenInput.value = btn.dataset.value;

      clearFieldError(stressHiddenInput);
    });
  });


  function fieldWrapper(input) {
    return input.closest(".field");
  }


  function setFieldError(input, message) {
    const wrap = fieldWrapper(input);

    if (!wrap) return;

    wrap.classList.add("field-error");

    const msgEl = wrap.querySelector(".error-msg");

    if (msgEl) {
      msgEl.textContent = message;
    }
  }


  function clearFieldError(input) {
    const wrap = fieldWrapper(input);

    if (!wrap) return;

    wrap.classList.remove("field-error");

    const msgEl = wrap.querySelector(".error-msg");

    if (msgEl) {
      msgEl.textContent = "";
    }
  }


  function clearAllErrors() {
    form.querySelectorAll(".field").forEach((field) => {
      field.classList.remove("field-error");
    });

    form.querySelectorAll(".error-msg").forEach((msg) => {
      msg.textContent = "";
    });
  }


  // Collect and convert form values
  function collectPayload() {
    const fd = new FormData(form);

    return {
      Age:
        fd.get("age") === ""
          ? NaN
          : parseInt(fd.get("age"), 10),

      Gender:
        fd.get("gender") || "",

      Country:
        (fd.get("country") || "").trim(),

      Academic_Level:
        fd.get("academic_level") || "",

      Most_Used_Platform:
        fd.get("most_used_platform") || "",

      Purpose_Of_Use:
        fd.get("purpose_of_use") || "",

      Avg_Daily_Usage_Hours:
        fd.get("avg_daily_usage_hours") === ""
          ? NaN
          : parseFloat(fd.get("avg_daily_usage_hours")),

      Daily_Unlocks:
        fd.get("daily_unlocks") === ""
          ? NaN
          : parseInt(fd.get("daily_unlocks"), 10),

      Study_Hours:
        fd.get("study_hours") === ""
          ? NaN
          : parseFloat(fd.get("study_hours")),

      Physical_Activity_Hours:
        fd.get("physical_activity_hours") === ""
          ? NaN
          : parseFloat(fd.get("physical_activity_hours")),

      Sleep_Hours_Per_Night:
        fd.get("sleep_hours_per_night") === ""
          ? NaN
          : parseFloat(fd.get("sleep_hours_per_night")),

      Stress_Level:
        fd.get("stress_level") || ""
    };
  }


  // Validate input
  function validate(payload) {
    const errors = [];

    const numericChecks = [
      ["age", payload.Age, 10, 100],
      ["avg_daily_usage_hours", payload.Avg_Daily_Usage_Hours, 0, 24],
      ["daily_unlocks", payload.Daily_Unlocks, 0, Infinity],
      ["study_hours", payload.Study_Hours, 0, 24],
      ["physical_activity_hours", payload.Physical_Activity_Hours, 0, 24],
      ["sleep_hours_per_night", payload.Sleep_Hours_Per_Night, 0, 24]
    ];

    numericChecks.forEach(([field, value, min, max]) => {
      const input = document.getElementById(field);

      if (Number.isNaN(value)) {
        errors.push([input, "This field is required."]);
      } else if (value < min || value > max) {
        errors.push([
          input,
          `Must be between ${min} and ${max === Infinity ? "0+" : max}.`
        ]);
      }
    });


    const textFields = [
      ["gender", payload.Gender],
      ["country", payload.Country],
      ["academic_level", payload.Academic_Level],
      ["most_used_platform", payload.Most_Used_Platform],
      ["purpose_of_use", payload.Purpose_Of_Use]
    ];

    textFields.forEach(([field, value]) => {
      const input = document.getElementById(field);

      if (!value || String(value).trim() === "") {
        errors.push([input, "This field is required."]);
      }
    });


    if (!payload.Stress_Level) {
      errors.push([
        stressHiddenInput,
        "Pick a stress level."
      ]);
    }

    return errors;
  }


  // Change state
  function showState(name) {
    stateIdle.hidden = true;
    stateLoading.hidden = true;
    stateResult.hidden = true;
    stateError.hidden = true;

    if (name === "idle") {
      stateIdle.hidden = false;
    }

    if (name === "loading") {
      stateLoading.hidden = false;
    }

    if (name === "result") {
      stateResult.hidden = false;
    }

    if (name === "error") {
      stateError.hidden = false;
    }
  }


  function setSubmitting(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    submitBtn.classList.toggle("loading", isSubmitting);
  }


  // Score category
  function bandFor(score) {
    if (score < 4) {
      return {
        label: "Signal: strained",
        context:
          "Your responses suggest elevated strain right now. Small shifts in sleep or screen time can go a long way."
      };
    }

    if (score < 7) {
      return {
        label: "Signal: balanced",
        context:
          "Your rhythm looks fairly steady, with some room to recover and reset."
      };
    }

    return {
      label: "Signal: strong",
      context:
        "Your habits point to a well-supported, resilient baseline. Keep it up."
    };
  }


  // Display result
  function renderResult(score) {
    const clamped = Math.max(0, Math.min(10, score));

    const result = bandFor(clamped);

    scoreNumberEl.textContent = score.toFixed(2);
    scoreBandEl.textContent = result.label;
    scoreContextEl.textContent = result.context;

    gaugeFill.style.transition = "none";

    gaugeFill.style.strokeDashoffset =
      String(GAUGE_ARC_LENGTH);

    requestAnimationFrame(() => {
      gaugeFill.style.transition = "";

      const offset =
        GAUGE_ARC_LENGTH * (1 - clamped / 10);

      gaugeFill.style.strokeDashoffset =
        String(offset);
    });

    showState("result");
  }


  // Display error
  function renderError(label, message) {
    errorCopyEl.textContent =
      label + ": " + message;

    showState("error");
  }


  // Handle FastAPI validation errors
  function applyServerValidationErrors(detail) {
    if (!Array.isArray(detail)) {
      return false;
    }

    let matched = false;

    detail.forEach((err) => {
      if (!Array.isArray(err.loc)) {
        return;
      }

      const backendField =
        err.loc[err.loc.length - 1];

      const frontendFieldMap = {
        Age: "age",
        Gender: "gender",
        Country: "country",
        Academic_Level: "academic_level",
        Most_Used_Platform: "most_used_platform",
        Purpose_Of_Use: "purpose_of_use",
        Avg_Daily_Usage_Hours: "avg_daily_usage_hours",
        Daily_Unlocks: "daily_unlocks",
        Study_Hours: "study_hours",
        Physical_Activity_Hours: "physical_activity_hours",
        Sleep_Hours_Per_Night: "sleep_hours_per_night",
        Stress_Level: "stress_level"
      };

      const frontendField =
        frontendFieldMap[backendField];

      if (!frontendField) {
        return;
      }

      const input =
        frontendField === "stress_level"
          ? stressHiddenInput
          : document.getElementById(frontendField);

      if (input) {
        setFieldError(
          input,
          err.msg || "Invalid value."
        );

        matched = true;
      }
    });

    return matched;
  }


  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearAllErrors();

    const payload = collectPayload();

    const clientErrors = validate(payload);

    if (clientErrors.length > 0) {
      clientErrors.forEach(([input, message]) => {
        if (input) {
          setFieldError(input, message);
        }
      });

      if (clientErrors[0][0]) {
        clientErrors[0][0].focus();
      }

      return;
    }


    setSubmitting(true);
    showState("loading");


    try {
      const response = await fetch(
        API_BASE + "/predict",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload)
        }
      );


      if (response.status === 422) {
        const body =
          await response.json().catch(() => null);

        const matched =
          body &&
          applyServerValidationErrors(body.detail);

        renderError(
          "Check your inputs",
          matched
            ? "The API rejected a few fields — details are marked on the form."
            : "The API rejected this submission. Please review your inputs and try again."
        );

        return;
      }


      if (!response.ok) {
        let detailMessage =
          "The API responded with status " +
          response.status +
          ".";

        const body =
          await response.json().catch(() => null);

        if (
          body &&
          typeof body.detail === "string"
        ) {
          detailMessage = body.detail;
        }

        renderError(
          "Prediction failed",
          detailMessage
        );

        return;
      }


      const data = await response.json();


      if (
        typeof data.predicted_mental_health_score !==
        "number"
      ) {
        renderError(
          "Unexpected response",
          "The API responded, but the score was missing or malformed."
        );

        return;
      }


      renderResult(
        data.predicted_mental_health_score
      );


    } catch (error) {
      console.error(error);

      renderError(
        "Can't reach the server",
        "Couldn't connect to the deployed backend. Please try again."
      );

    } finally {
      setSubmitting(false);
    }
  });


  // Clear errors when editing
  form
    .querySelectorAll("input, select")
    .forEach((element) => {

      element.addEventListener("input", () => {
        clearFieldError(element);
      });

      element.addEventListener("change", () => {
        clearFieldError(element);
      });

    });


  // Reset
  function resetForm() {
    form.reset();

    clearAllErrors();

    stressHiddenInput.value = "";

    segGroup
      .querySelectorAll(".seg-btn")
      .forEach((btn) => {
        btn.classList.remove("active");
      });

    gaugeFill.style.transition = "none";

    gaugeFill.style.strokeDashoffset =
      String(GAUGE_ARC_LENGTH);

    showState("idle");
  }


  resetBtn.addEventListener("click", resetForm);


  errorRetryBtn.addEventListener("click", () => {
    clearAllErrors();
    showState("idle");
  });

})();