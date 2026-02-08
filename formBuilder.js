import { FormBuilderBase } from "./formBuilderBase.js";
import { validateStage } from "./validation.js";

export class FormBuilder extends FormBuilderBase {

    // --- Schema loading ---

    _getSchemaSource() {
        if (!this.container) {
            return null;
        }

        const schemaSrc = this.container.getAttribute("data-schema-src");
        if (!schemaSrc) {
            console.error("Form schema source is missing. Add data-schema-src to the form element.");
            return null;
        }

        return schemaSrc;
    }

    async _loadSchemaFromDom() {
        if (this.isLoadingSchema) {
            console.warn("Schema is already loading, skipping concurrent load attempt");
            return null;
        }

        const schemaSrc = this._getSchemaSource();
        if (!schemaSrc) {
            return null;
        }

        this.isLoadingSchema = true;
        try {
            const moduleUrl = new URL(schemaSrc, import.meta.url).href;
            const schemaModule = await import(moduleUrl);
            if (!schemaModule?.formSchema) {
                console.error("Schema module did not export formSchema:", schemaSrc);
                this._displaySchemaError("Schema file does not export 'formSchema'. Please check the schema file.");
                return null;
            }

            return schemaModule.formSchema;
        } catch (error) {
            console.error("Failed to load schema module:", schemaSrc, error);
            this._displaySchemaError("Failed to load form schema. Please refresh the page and try again.");
            return null;
        } finally {
            this.isLoadingSchema = false;
        }
    }

    // --- Draft persistence ---

    _getDraftStorageKey() {
        const schemaId = String(this.activeSchema?.id ?? "").trim();
        return schemaId ? `formDraft:${schemaId}` : "formDraft";
    }

    _saveDraft() {
        try {
            localStorage.setItem(this._getDraftStorageKey(), JSON.stringify(this.state));
        } catch {
            // Fail silently if storage is unavailable.
        }
    }

    _loadDraft() {
        try {
            return JSON.parse(localStorage.getItem(this._getDraftStorageKey()) || "{}");
        } catch {
            return {};
        }
    }

    _clearDraft() {
        try {
            localStorage.removeItem(this._getDraftStorageKey());
        } catch {
            // Fail silently if storage is unavailable.
        }
    }

    // --- Validation ---

    _validateStage(stageIndex = null) {
        return validateStage(this.activeSchema, this.state, stageIndex);
    }

    // --- Submission ---

    async _postPayload(payload) {
        const formAction = this.container?.getAttribute("action");
        if (!formAction) {
            console.warn("Form action is missing; payload was not submitted.");
            this._setSubmitFeedback("danger", "לא ניתן לשלוח: חסר יעד שליחה בטופס.");
            return false;
        }

        const formMethod = (this.container?.getAttribute("method") || "post").toUpperCase();
        this._setSubmittingState(true);
        try {
            const response = await fetch(formAction, {
                method: formMethod,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.warn("Form submit failed:", response.status, response.statusText);
                this._setSubmitFeedback("danger", `השליחה נכשלה (${response.status}). נסה שוב.`);
                return false;
            }

            this._setSubmitFeedback("success", "הטופס נשלח בהצלחה.");
            this._clearDraft();
            return true;
        } catch (error) {
            console.error("Form submit error:", error);
            this._setSubmitFeedback("danger", "אירעה שגיאה בשליחה. נסה שוב.");
            return false;
        } finally {
            this._setSubmittingState(false);
        }
    }

    // --- Init ---

    async _init() {
        this.activeSchema = await this._loadSchemaFromDom();
        if (!this.activeSchema) {
            return;
        }

        this.state = this._loadDraft();
        this._pruneHiddenFields();
        this._saveDraft();
        this._renderStage(0);
    }
}

// Auto-initialize all form builder instances found in the DOM
document.querySelectorAll("[data-form-builder]").forEach(root => {
    new FormBuilder(root);
});
