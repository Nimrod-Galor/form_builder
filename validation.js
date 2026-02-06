import { z } from "https://cdn.jsdelivr.net/npm/zod@3.23.8/+esm";

// Default fallback messages used when a field does not override copy.
export const REQUIRED_MESSAGE = "שדה חובה";
const NUMBER_INVALID_MESSAGE = "ערך מספרי אינו תקין";
const EMAIL_INVALID_MESSAGE = "כתובת אימייל לא תקינה";
const PHONE_INVALID_MESSAGE = "מספר טלפון לא תקין";
const OPTION_INVALID_MESSAGE = "בחירה אינה תקפה";
const ACCEPTANCE_REQUIRED_MESSAGE = "יש לאשר את הסעיף";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isMultiStage(schema) {
    return Array.isArray(schema.stages) && schema.stages.length > 0;
}

export function getStageCount(schema) {
    return isMultiStage(schema) ? schema.stages.length : 1;
}

export function getFields(schema, stageIndex = null) {
    if (isMultiStage(schema)) {
        if (typeof stageIndex === "number") {
            return schema.stages[stageIndex]?.fields ?? [];
        }
        return schema.fields ?? schema.stages.flatMap(stage => stage.fields);
    }

    return schema.fields ?? [];
}

export function evaluateCondition(condition, state) {
    const value = state[condition.field];
    return value === condition.equals;
}

export function shouldDisplayField(field, state) {
    if (!field?.showIf) {
        return true;
    }

    return evaluateCondition(field.showIf, state);
}

export function getVisibleFields(schema, state, stageIndex = null) {
    return getFields(schema, stageIndex)
        .filter(field => !isPlainTextField(field))
        .filter(field => shouldDisplayField(field, state));
}

export function validateStage(schema, state, stageIndex = null) {
    const fields = getVisibleFields(schema, state, stageIndex);

    if (!fields.length) {
        return {};
    }

    const stageState = collectFieldState(fields, state);
    const validator = createSchemaForFields(fields);
    const result = validator.safeParse(stageState);

    if (result.success) {
        updateStateWithValidatedData(fields, result.data, state);
        return {};
    }

    return mapZodErrors(result.error);
}

function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
}

function getFieldMessage(field, key, fallback) {
    return field?.errorMessages?.[key] ?? fallback;
}

function buildFieldSchema(field) {
    if (field.type === "checkbox") {
        return buildCheckboxSchema(field);
    }

    if (field.type === "number") {
        return buildNumberSchema(field);
    }

    return buildTextSchema(field);
}

export function isPlainTextField(field) {
    const type = String(field?.type ?? "").toLowerCase();
    return type === "plain text" || type === "plaintext";
}

function buildTextSchema(field) {
    let schema = z.string({
        required_error: getFieldMessage(field, "required", REQUIRED_MESSAGE),
        invalid_type_error: getFieldMessage(field, "required", REQUIRED_MESSAGE)
    });

    const isEmpty = value => normalizeString(value).length === 0;

    if (field.required) {
        const requiredMessage = getFieldMessage(field, "required", REQUIRED_MESSAGE);
        schema = schema.min(1, requiredMessage).refine(value => !isEmpty(value), { message: requiredMessage });
    }

    if (field.type === "email") {
        schema = schema.refine(value => {
            if (isEmpty(value)) {
                return true;
            }
            return EMAIL_REGEX.test(normalizeString(value));
        }, { message: getFieldMessage(field, "emailInvalid", EMAIL_INVALID_MESSAGE) });
    }

    if (field.type === "tel" && field.attributes?.pattern) {
        const phoneRegex = new RegExp(field.attributes.pattern);
        schema = schema.refine(value => {
            if (isEmpty(value)) {
                return true;
            }
            return phoneRegex.test(normalizeString(value));
        }, { message: getFieldMessage(field, "phoneInvalid", PHONE_INVALID_MESSAGE) });
    }

    if ((field.type === "select" || field.type === "radio") && Array.isArray(field.options)) {
        const allowedValues = field.options.map(opt => {
            const optionValue = typeof opt === "string" ? opt : opt.value;
            if (optionValue == null) {
                return "";
            }
            return String(optionValue).trim();
        });
        schema = schema.refine(value => {
            if (isEmpty(value)) {
                return true;
            }
            return allowedValues.includes(String(value).trim());
        }, { message: getFieldMessage(field, "optionInvalid", OPTION_INVALID_MESSAGE) });
    }

    return field.required ? schema : schema.optional();
}

function buildNumberSchema(field) {
    let schema = z.string({
        required_error: getFieldMessage(field, "required", REQUIRED_MESSAGE),
        invalid_type_error: getFieldMessage(field, "required", REQUIRED_MESSAGE)
    });

    const isEmpty = value => normalizeString(value).length === 0;

    if (field.required) {
        const requiredMessage = getFieldMessage(field, "required", REQUIRED_MESSAGE);
        schema = schema.min(1, requiredMessage).refine(value => !isEmpty(value), { message: requiredMessage });
    }

    schema = schema.refine(value => {
        if (isEmpty(value)) {
            return true;
        }
        return !Number.isNaN(Number(normalizeString(value)));
    }, { message: getFieldMessage(field, "numberInvalid", NUMBER_INVALID_MESSAGE) });

    if (field.attributes?.min !== undefined) {
        const minValue = Number(field.attributes.min);
        schema = schema.refine(value => {
            if (isEmpty(value)) {
                return true;
            }
            return Number(normalizeString(value)) >= minValue;
        }, { message: getFieldMessage(field, "min", `הערך חייב להיות לפחות ${field.attributes.min}`) });
    }

    if (field.attributes?.max !== undefined) {
        const maxValue = Number(field.attributes.max);
        schema = schema.refine(value => {
            if (isEmpty(value)) {
                return true;
            }
            return Number(normalizeString(value)) <= maxValue;
        }, { message: getFieldMessage(field, "max", `הערך חייב להיות עד ${field.attributes.max}`) });
    }

    return schema;
}

function buildCheckboxSchema(field) {
    let schema = z.boolean();

    if (field.required) {
        schema = schema.refine(value => value === true, { message: getFieldMessage(field, "acceptance", ACCEPTANCE_REQUIRED_MESSAGE) });
    }

    return schema;
}

function createSchemaForFields(fields) {
    const shape = {};
    fields.forEach(field => {
        shape[field.name] = buildFieldSchema(field);
    });
    return z.object(shape);
}

function collectFieldState(fields, state) {
    return fields.reduce((acc, field) => {
        if (field.type === "checkbox") {
            acc[field.name] = Boolean(state[field.name]);
        } else {
            const rawValue = state[field.name];
            if (rawValue === undefined || rawValue === null) {
                acc[field.name] = "";
                return acc;
            }

            if (field.type === "number") {
                const numericSource = typeof rawValue === "string" ? rawValue : String(rawValue);
                acc[field.name] = normalizeString(numericSource);
                return acc;
            }

            const textSource = typeof rawValue === "string" ? rawValue : String(rawValue);
            acc[field.name] = textSource.trim();
        }
        return acc;
    }, {});
}

function mapZodErrors(zodError) {
    const fieldErrors = zodError.formErrors?.fieldErrors ?? {};
    return Object.entries(fieldErrors).reduce((acc, [fieldName, messages]) => {
        if (Array.isArray(messages) && messages.length) {
            acc[fieldName] = messages[0];
        }
        return acc;
    }, {});
}

function updateStateWithValidatedData(fields, data, state) {
    fields.forEach(field => {
        if (!Object.prototype.hasOwnProperty.call(data, field.name)) {
            return;
        }

        const value = data[field.name];

        if (field.type === "checkbox") {
            state[field.name] = Boolean(value);
            return;
        }

        if (field.type === "number") {
            if (value === "" || value === null || value === undefined) {
                delete state[field.name];
                return;
            }

            const numericValue = Number(value);
            if (Number.isNaN(numericValue)) {
                delete state[field.name];
                return;
            }

            state[field.name] = numericValue;
            return;
        }

        if (typeof value === "string") {
            const trimmed = value.trim();
            if (!trimmed && !field.required) {
                delete state[field.name];
                return;
            }
            state[field.name] = trimmed;
            return;
        }

        state[field.name] = value;
    });
}
