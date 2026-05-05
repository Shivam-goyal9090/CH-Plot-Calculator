const form = document.querySelector("#calculator-form");
const areaInput = document.querySelector("#plot-area");
const lengthInput = document.querySelector("#plot-length");
const breadthInput = document.querySelector("#plot-breadth");
const rateInput = document.querySelector("#base-rate");
const maintenanceInput = document.querySelector("#maintenance");
const roadInput = document.querySelector("#road-facing");
const cornerInput = document.querySelector("#corner-plot");
const gardenInput = document.querySelector("#garden-facing");
const resultPanel = document.querySelector("#result-panel");
const adjustedRateOutput = document.querySelector("#adjusted-rate");
const calculatedAreaOutput = document.querySelector("#calculated-area");
const totalPriceOutput = document.querySelector("#total-price");
const stepsList = document.querySelector("#calculation-steps");

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

function parsePositiveNumber(input) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : NaN;
}

function setFieldError(input, message) {
  const group = input.closest(".field-group");
  const error = group.querySelector(".error-text");
  group.classList.toggle("has-error", Boolean(message));
  error.textContent = message;
}

function setAreaChoiceError(message) {
  const group = document.querySelector(".area-choice");
  const error = document.querySelector("#dimension-error");
  group.classList.toggle("has-error", Boolean(message));
  error.textContent = message;
}

function validateInputs(showMessages = true) {
  const directArea = parsePositiveNumber(areaInput);
  const length = parsePositiveNumber(lengthInput);
  const breadth = parsePositiveNumber(breadthInput);
  const rate = parsePositiveNumber(rateInput);
  const maintenance = maintenanceInput.value.trim() ? parsePositiveNumber(maintenanceInput) : 0;
  const hasDirectArea = Boolean(areaInput.value.trim());
  const hasLength = Boolean(lengthInput.value.trim());
  const hasBreadth = Boolean(breadthInput.value.trim());
  const hasAnyDimension = hasLength || hasBreadth;
  const hasBothDimensions = hasLength && hasBreadth;
  const area = hasDirectArea ? directArea : length * breadth;
  let valid = true;

  if (!hasDirectArea && !hasAnyDimension) {
    valid = false;
    if (showMessages) setAreaChoiceError("Enter length and breadth, or enter plot area.");
  } else if (hasDirectArea && hasAnyDimension) {
    valid = false;
    if (showMessages) setAreaChoiceError("Use either length and breadth or plot area, not both.");
  } else if (hasAnyDimension && !hasBothDimensions) {
    valid = false;
    if (showMessages) setAreaChoiceError("Enter both length and breadth.");
  } else if (
    (hasDirectArea && (!Number.isFinite(directArea) || directArea <= 0)) ||
    (hasBothDimensions &&
      (!Number.isFinite(length) || !Number.isFinite(breadth) || length <= 0 || breadth <= 0))
  ) {
    valid = false;
    if (showMessages) setAreaChoiceError("Plot measurements must be greater than zero.");
  } else if (showMessages) {
    setAreaChoiceError("");
  }

  if (!rateInput.value.trim()) {
    valid = false;
    if (showMessages) setFieldError(rateInput, "Enter the base rate.");
  } else if (!Number.isFinite(rate) || rate <= 0) {
    valid = false;
    if (showMessages) setFieldError(rateInput, "Base rate must be greater than zero.");
  } else if (showMessages) {
    setFieldError(rateInput, "");
  }

  if (maintenanceInput.value.trim() && (!Number.isFinite(maintenance) || maintenance < 0)) {
    valid = false;
    if (showMessages) setFieldError(maintenanceInput, "Maintenance cannot be negative.");
  } else if (showMessages) {
    setFieldError(maintenanceInput, "");
  }

  return { valid, area, rate, maintenance };
}

function buildSteps(area, startRate, adjustedRate, maintenance, plotPrice, totalPrice) {
  const steps = [`Area: ${formatAmount(area)} sq ft`, `Base rate: ${formatAmount(startRate)} per sq ft`];
  let currentRate = startRate;

  if (roadInput.checked) {
    currentRate += 100;
    steps.push(`Road facing: add 100 = ${formatAmount(currentRate)}`);
  }

  if (cornerInput.checked) {
    currentRate *= 1.1;
    steps.push(`Corner plot: add 10% = ${formatAmount(currentRate)}`);
  }

  if (gardenInput.checked) {
    currentRate *= 1.05;
    steps.push(`Garden facing: add 5% = ${formatAmount(currentRate)}`);
  }

  steps.push(`Final adjusted rate: ${formatAmount(adjustedRate)}`);
  steps.push(`Plot price: ${formatAmount(area)} x ${formatAmount(adjustedRate)} = ${formatAmount(plotPrice)}`);

  if (maintenance > 0) {
    steps.push(`Maintenance: add ${formatAmount(maintenance)} = ${formatAmount(totalPrice)}`);
  }

  return steps;
}

function calculateAdjustedRate(rate) {
  let adjustedRate = rate;

  if (roadInput.checked) adjustedRate += 100;
  if (cornerInput.checked) adjustedRate *= 1.1;
  if (gardenInput.checked) adjustedRate *= 1.05;

  return adjustedRate;
}

function formatAmount(value) {
  return currencyFormatter.format(value);
}

function renderResult(area, rate, maintenance) {
  const adjustedRate = calculateAdjustedRate(rate);
  const plotPrice = area * adjustedRate;
  const totalPrice = plotPrice + maintenance;
  const steps = buildSteps(area, rate, adjustedRate, maintenance, plotPrice, totalPrice);

  adjustedRateOutput.textContent = `${formatAmount(adjustedRate)} / sq ft`;
  calculatedAreaOutput.textContent = `${formatAmount(area)} sq ft`;
  totalPriceOutput.textContent = formatAmount(totalPrice);
  stepsList.innerHTML = steps.map((step) => `<li>${step}</li>`).join("");
  resultPanel.classList.remove("is-empty");
}

function clearResult() {
  adjustedRateOutput.textContent = "--";
  calculatedAreaOutput.textContent = "--";
  totalPriceOutput.textContent = "--";
  stepsList.innerHTML = "";
  resultPanel.classList.add("is-empty");
}

function clampNegativeValue(event) {
  if (event.target.value && Number(event.target.value) < 0) {
    event.target.value = "";
  }
}

function handleLiveUpdate() {
  const { valid, area, rate, maintenance } = validateInputs(false);

  if (valid) {
    setAreaChoiceError("");
    setFieldError(rateInput, "");
    setFieldError(maintenanceInput, "");
    renderResult(area, rate, maintenance);
  } else {
    clearResult();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const { valid, area, rate, maintenance } = validateInputs(true);

  if (!valid) {
    clearResult();
    return;
  }

  renderResult(area, rate, maintenance);
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    setAreaChoiceError("");
    setFieldError(rateInput, "");
    setFieldError(maintenanceInput, "");
    clearResult();
    lengthInput.focus();
  }, 0);
});

[lengthInput, breadthInput, areaInput, rateInput, maintenanceInput].forEach((input) => {
  input.addEventListener("input", clampNegativeValue);
  input.addEventListener("input", handleLiveUpdate);
  input.addEventListener("blur", () => validateInputs(Boolean(input.value.trim())));
});

[roadInput, cornerInput, gardenInput].forEach((input) => {
  input.addEventListener("change", handleLiveUpdate);
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
