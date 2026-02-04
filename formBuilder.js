import { formSchema } from "./schema.js";
import {
    REQUIRED_MESSAGE,
    getFields,
    getStageCount,
    getVisibleFields,
    isMultiStage,
    shouldDisplayField,
    validateStage
} from "./validation.js";

let currentStage = 0;
let formAbortController = null;
let stageIndicatorAbortController = null;
let furthestStageReached = 0;
const renderDebounceMs = 200;
const pendingRenderTimers = new Map();

function getControllerFields(schema) {
    const fields = getFields(schema);
    return new Set(
        fields
            .map(field => field?.showIf?.field)
            .filter(Boolean)
    );
}

function applyInputAttributes(element, field) {
    if (!element || !field) {
        return;
    }

    if (field.placeholder && element.tagName !== "SELECT") {
        element.placeholder = field.placeholder;
    }

    if (field.attributes && typeof field.attributes === "object") {
        Object.entries(field.attributes).forEach(([attr, value]) => {
            if (value === undefined || value === null || value === false) {
                return;
            }

            if (value === true) {
                element.setAttribute(attr, "");
                return;
            }

            element.setAttribute(attr, value);
        });
    }
}

function appendHelperText(wrapper, text, fieldName) {
    if (!text) {
        return null;
    }

    const helperId = `${fieldName}-helper`;
    const helper = document.createElement("div");
    helper.className = "form-text";
    helper.id = helperId;
    helper.textContent = text;
    wrapper.appendChild(helper);
    return helperId;
}

function pruneHiddenFields(schema, state) {
    if (!schema || !state) {
        return;
    }

    const allFields = getFields(schema);
    allFields.forEach(field => {
        if (field?.showIf && Object.prototype.hasOwnProperty.call(state, field.name)) {
            if (!shouldDisplayField(field, state)) {
                delete state[field.name];
            }
        }
    });
}

function buildSubmissionPayload(schema, state) {
    const payload = {};
    const visibleFields = getVisibleFields(schema, state);
    visibleFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(state, field.name)) {
            payload[field.name] = state[field.name];
        }
    });
    return payload;
}

function handleFieldChange(schema, state, stageIndex, fieldName, value) {
    clearPendingRender(fieldName);
    state[fieldName] = value;
    pruneHiddenFields(schema, state);
    saveDraft(state);
    if (isMultiStage(schema)) {
        const nextStageIndex = typeof stageIndex === "number" ? stageIndex : currentStage;
        renderStage(nextStageIndex);
        return;
    }
    renderStage();
}

function handleFieldInput(schema, state, stageIndex, fieldName, value) {
    state[fieldName] = value;
    pruneHiddenFields(schema, state);
    saveDraft(state);
    scheduleRender(stageIndex, fieldName);
}

function clearPendingRender(fieldName) {
    const timerId = pendingRenderTimers.get(fieldName);
    if (timerId) {
        clearTimeout(timerId);
        pendingRenderTimers.delete(fieldName);
    }
}

function scheduleRender(stageIndex, fieldName) {
    clearPendingRender(fieldName);
    const nextStageIndex = typeof stageIndex === "number" ? stageIndex : currentStage;
    const timerId = setTimeout(() => {
        pendingRenderTimers.delete(fieldName);
        if (isMultiStage(formSchema)) {
            renderStage(nextStageIndex);
            return;
        }
        renderStage();
    }, renderDebounceMs);
    pendingRenderTimers.set(fieldName, timerId);
}

function renderForm(schema, container, state, stageIndex = null) {
    // Abort previous event listeners before re-rendering
    if (formAbortController) {
        formAbortController.abort();
    }
    formAbortController = new AbortController();
    const { signal } = formAbortController;

    container.innerHTML = "";

    const fields = getFields(schema, stageIndex);
    const controllerFields = getControllerFields(schema);
    const inputEventTypes = new Set(["text", "textarea", "email", "tel", "number", "date", "search", "url", "password"]);

    fields.forEach(field => {
        if (!shouldDisplayField(field, state)) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "mb-3";
        wrapper.dataset.fieldWrapper = field.name;

        if (field.type === "checkbox") {
            const formCheck = document.createElement("div");
            formCheck.className = "form-check";

            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = field.name;
            input.id = field.name;
            input.className = "form-check-input";
            input.checked = Boolean(state[field.name]);
            input.setAttribute("aria-invalid", "false");
            applyInputAttributes(input, field);
            input.addEventListener("change", e => {
                handleFieldChange(schema, state, stageIndex, field.name, e.target.checked);
            }, { signal });

            const label = document.createElement("label");
            label.className = "form-check-label";
            label.htmlFor = field.name;
            label.textContent = field.label;

            formCheck.append(input, label);
            wrapper.append(formCheck);
            const helperId = appendHelperText(wrapper, field.helperText, field.name);
            if (helperId) {
                input.setAttribute("aria-describedby", helperId);
            }
            container.appendChild(wrapper);
            return;
        }

        const label = document.createElement("label");
        label.textContent = field.label;
        label.htmlFor = field.name;
        label.className = "form-label";

        if (field.type === "radio") {
            wrapper.append(label);

            const group = document.createElement("div");
            group.className = "d-flex flex-column gap-2";
            group.setAttribute("role", "radiogroup");
            group.setAttribute("aria-labelledby", `${field.name}-label`);
            label.id = `${field.name}-label`;

            (field.options ?? []).forEach(opt => {
                const optionValue = typeof opt === "string" ? opt : opt.value;
                const optionLabel = typeof opt === "string" ? opt : (opt.label ?? opt.value);
                const optionId = `${field.name}-${String(optionValue).replace(/\s+/g, "-")}`;

                const formCheck = document.createElement("div");
                formCheck.className = "form-check";

                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = field.name;
                radio.id = optionId;
                radio.value = optionValue;
                radio.className = "form-check-input";
                radio.checked = state[field.name] === optionValue;
                radio.setAttribute("aria-invalid", "false");
                radio.addEventListener("change", () => {
                    handleFieldChange(schema, state, stageIndex, field.name, optionValue);
                }, { signal });

                const radioLabel = document.createElement("label");
                radioLabel.className = "form-check-label";
                radioLabel.htmlFor = optionId;
                radioLabel.textContent = optionLabel;

                formCheck.append(radio, radioLabel);
                group.append(formCheck);
            });

            wrapper.append(group);
            const helperId = appendHelperText(wrapper, field.helperText, field.name);
            if (helperId) {
                group.setAttribute("aria-describedby", helperId);
            }
            container.appendChild(wrapper);
            return;
        }

        let input;
        if (field.type === "select") {
            input = document.createElement("select");
            input.className = "form-select";

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "-- בחר --";
            input.appendChild(placeholder);

            (field.options ?? []).forEach(opt => {
                const optionValue = typeof opt === "string" ? opt : opt.value;
                const optionLabel = typeof opt === "string" ? opt : (opt.label ?? opt.value);

                const option = document.createElement("option");
                option.value = optionValue;
                option.textContent = optionLabel;
                input.appendChild(option);
            });
        } else if (field.type === "textarea") {
            input = document.createElement("textarea");
            input.className = "form-control";
            input.rows = field.rows ?? 3;
        } else {
            input = document.createElement("input");
            input.type = field.type;
            input.className = "form-control";
        }

        input.name = field.name;
        input.id = field.name;
        input.value = state[field.name] ?? "";
        input.setAttribute("aria-invalid", "false");
        applyInputAttributes(input, field);

        if (controllerFields.has(field.name) && inputEventTypes.has(field.type)) {
            input.addEventListener("input", e => {
                handleFieldInput(schema, state, stageIndex, field.name, e.target.value);
            }, { signal });
        }

        input.addEventListener("change", e => {
            handleFieldChange(schema, state, stageIndex, field.name, e.target.value);
        }, { signal });

        wrapper.append(label, input);
        const helperId = appendHelperText(wrapper, field.helperText, field.name);
        if (helperId) {
            input.setAttribute("aria-describedby", helperId);
        }
        container.appendChild(wrapper);
    });
}

function findStageIndexForField(schema, fieldName) {
    if (!isMultiStage(schema)) {
        return 0;
    }

    return schema.stages.findIndex(stage =>
        stage.fields.some(field => field.name === fieldName)
    );
}

function findFirstErrorStage(schema, errors) {
    if (!isMultiStage(schema)) {
        return null;
    }

    return Object.keys(errors).reduce((closestIndex, fieldName) => {
        const stageIndex = findStageIndexForField(schema, fieldName);
        if (stageIndex === -1) {
            return closestIndex;
        }
        if (closestIndex === null || stageIndex < closestIndex) {
            return stageIndex;
        }
        return closestIndex;
    }, null);
}

function showErrors(errors) {
    document.querySelectorAll("[data-field-wrapper]").forEach(wrapper => {
        const fieldName = wrapper.dataset.fieldWrapper;
        wrapper.querySelectorAll(".error").forEach(e => e.remove());
        wrapper.querySelectorAll("input, select, textarea").forEach(control => {
            control.classList.remove("is-invalid");
            control.setAttribute("aria-invalid", "false");
            // Remove error from aria-describedby, keep helper if present
            const helperId = `${fieldName}-helper`;
            const helperExists = document.getElementById(helperId);
            if (helperExists) {
                control.setAttribute("aria-describedby", helperId);
            } else {
                control.removeAttribute("aria-describedby");
            }
        });
    });

    Object.entries(errors).forEach(([field, message]) => {
        const wrapper = document.querySelector(`[data-field-wrapper="${field}"]`);
        if (!wrapper){
            return;
        }

        const errorId = `${field}-error`;
        const helperId = `${field}-helper`;
        const helperExists = document.getElementById(helperId);

        wrapper.querySelectorAll("input, select, textarea").forEach(control => {
            control.classList.add("is-invalid");
            control.setAttribute("aria-invalid", "true");
            // Combine error and helper in aria-describedby
            const describedBy = helperExists ? `${errorId} ${helperId}` : errorId;
            control.setAttribute("aria-describedby", describedBy);
        });

        const error = document.createElement("div");
        error.id = errorId;
        error.className = "error invalid-feedback d-block mt-1";
        error.setAttribute("role", "alert");
        error.textContent = message || REQUIRED_MESSAGE;
        wrapper.appendChild(error);
    });
}

function saveDraft(state) {
    localStorage.setItem("formDraft", JSON.stringify(state));
}

function loadDraft() {
    return JSON.parse(localStorage.getItem("formDraft") || "{}");
}

function clearDraft() {
    localStorage.removeItem("formDraft");
}

function resetForm(stateRef) {
    // Clear all properties from state object
    Object.keys(stateRef).forEach(key => delete stateRef[key]);
    clearDraft();
    currentStage = 0;
    furthestStageReached = 0;
    renderStage(0);
    announceToScreenReader("הטופס אופס");
}

const container = document.getElementById("form");
const stageIndicator = document.getElementById("stage-indicator");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const submitButton = document.getElementById("submit");
const resetButton = document.getElementById("reset");
const state = loadDraft();

// Create live region for screen reader announcements
const liveRegion = document.createElement("div");
liveRegion.id = "form-live-region";
liveRegion.setAttribute("aria-live", "polite");
liveRegion.setAttribute("aria-atomic", "true");
liveRegion.className = "visually-hidden";
document.body.appendChild(liveRegion);

function announceToScreenReader(message) {
    liveRegion.textContent = "";
    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
        liveRegion.textContent = message;
    }, 100);
}

pruneHiddenFields(formSchema, state);
saveDraft(state);

renderStage(0);

if (container) {
    container.addEventListener("submit", event => {
        event.preventDefault();
        handleSubmit();
    });
}

if (prevButton) {
    prevButton.onclick = () => {
        if (!isMultiStage(formSchema)) {
            return;
        }
        renderStage(Math.max(currentStage - 1, 0));
    };
}

if (nextButton) {
    nextButton.onclick = () => {
        if (!isMultiStage(formSchema)) {
            return;
        }
        const errors = validateStage(formSchema, state, currentStage);
        if (Object.keys(errors).length) {
            showErrors(errors);
            return;
        }
        renderStage(currentStage + 1);
    };
}

if (submitButton) {
    submitButton.onclick = handleSubmit;
}

if (resetButton) {
    resetButton.onclick = () => {
        if (confirm("האם אתה בטוח שברצונך לאפס את הטופס?")) {
            resetForm(state);
        }
    };
}

function handleSubmit() {
    if (isMultiStage(formSchema)) {
        const stageErrors = validateStage(formSchema, state, currentStage);
        if (Object.keys(stageErrors).length) {
            showErrors(stageErrors);
            return;
        }
    }

    pruneHiddenFields(formSchema, state);
    const errors = validateStage(formSchema, state);
    if (Object.keys(errors).length) {
        const firstErrorStage = findFirstErrorStage(formSchema, errors);
        if (firstErrorStage !== null && firstErrorStage !== currentStage) {
            renderStage(firstErrorStage);
        }
        showErrors(errors);
        return;
    }

    const payload = buildSubmissionPayload(formSchema, state);
    console.log("submit payload:", payload);
    console.log("submit payload JSON:", JSON.stringify(payload));
}

function renderStage(stageIndex) {
    if (!container) {
        return;
    }

    // Require explicit stage index - fall back to 0 if not provided
    const targetIndex = typeof stageIndex === "number" ? stageIndex : 0;

    pruneHiddenFields(formSchema, state);

    if (!isMultiStage(formSchema)) {
        currentStage = 0;
        renderForm(formSchema, container, state);
        showErrors({});
        updateStageIndicator(formSchema, 0);
        updateNavigationControls(formSchema, 0);
        return;
    }

    const lastIndex = getStageCount(formSchema) - 1;
    const previousStage = currentStage;
    currentStage = Math.min(Math.max(targetIndex, 0), lastIndex);
    furthestStageReached = Math.max(furthestStageReached, currentStage);
    renderForm(formSchema, container, state, currentStage);
    showErrors({});
    updateStageIndicator(formSchema, currentStage);
    updateNavigationControls(formSchema, currentStage);

    // Announce stage change to screen readers
    if (previousStage !== currentStage) {
        const stage = formSchema.stages[currentStage];
        announceToScreenReader(`שלב ${currentStage + 1} מתוך ${getStageCount(formSchema)} - ${stage.label}`);
    }
}

function updateStageIndicator(schema, stageIndex = 0) {
    if (!stageIndicator) {
        return;
    }

    if (!isMultiStage(schema)) {
        stageIndicator.textContent = "";
        stageIndicator.classList.add("d-none");
        return;
    }

    const stage = schema.stages[stageIndex];
    stageIndicator.classList.remove("d-none");
    stageIndicator.innerHTML = "";

    const header = document.createElement("div");
    header.className = "d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2";

    const title = document.createElement("h3");
    title.className = "h4 mb-0";
    title.textContent = stage.label;

    const count = document.createElement("div");
    count.className = "text-muted small";
    count.textContent = `שלב ${stageIndex + 1} מתוך ${getStageCount(schema)}`;

    header.append(title, count);

    const steps = document.createElement("div");
    steps.className = "stage-indicator__steps mt-3";
    steps.setAttribute("role", "list");

    schema.stages.forEach((stageItem, index) => {
        const step = document.createElement("button");
        step.type = "button";
        step.className = "stage-step";
        step.dataset.stageIndex = String(index);
        step.setAttribute("role", "listitem");
        step.title = stageItem.label;
        step.textContent = String(index + 1);

        if (index === stageIndex) {
            step.classList.add("stage-step--current");
            step.setAttribute("aria-current", "step");
            step.disabled = true;
        } else if (index < furthestStageReached) {
            step.classList.add("stage-step--done");
        } else if (index === furthestStageReached) {
            step.classList.add("stage-step--next");
        } else {
            step.classList.add("stage-step--undone");
            step.disabled = true;
            step.setAttribute("aria-disabled", "true");
        }

        steps.appendChild(step);
    });

    stageIndicator.append(header, steps);

    if (stageIndicatorAbortController) {
        stageIndicatorAbortController.abort();
    }
    stageIndicatorAbortController = new AbortController();
    const { signal } = stageIndicatorAbortController;

    stageIndicator.addEventListener("click", event => {
        const target = event.target.closest("[data-stage-index]");
        if (!target || !(target instanceof HTMLButtonElement)) {
            return;
        }

        const targetIndex = Number(target.dataset.stageIndex);
        if (!Number.isInteger(targetIndex)) {
            return;
        }

        if (targetIndex > furthestStageReached) {
            return;
        }

        renderStage(targetIndex);
    }, { signal });
}

function updateNavigationControls(schema, stageIndex = 0) {
    if (!prevButton || !nextButton || !submitButton) {
        return;
    }

    if (!isMultiStage(schema)) {
        prevButton.style.display = "none";
        nextButton.style.display = "none";
        submitButton.style.display = "inline-block";
        return;
    }

    prevButton.style.display = stageIndex === 0 ? "none" : "inline-block";
    nextButton.style.display = stageIndex >= getStageCount(schema) - 1 ? "none" : "inline-block";
    submitButton.style.display = stageIndex === getStageCount(schema) - 1 ? "inline-block" : "none";
}
