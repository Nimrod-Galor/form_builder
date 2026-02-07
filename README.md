# Form Builder

A schema-driven, multi-stage form builder that renders fields dynamically, validates input, and persists draft data in localStorage.

## Features

- Schema-based form rendering
- Multi-stage navigation with progress indicator
- Conditional fields (`showIf`)
- Optional read-only summary stage (schema-controlled)
- Validation with inline errors
- Draft persistence in localStorage
- Accessible labels and helper text
- Plain text informational blocks (no state/validation)

## Project Structure

- index.html — page markup and layout
- formBuilder.js — rendering, state, and UI logic
- schema.capabilities.js — example schema module
- schema.js — alternate schema definition
- validation.js — validation helpers and rules

## Getting Started

Open `index.html` in a browser.

To use a different schema per page, set `data-schema-src` on the form element to the schema module path:

```html
<form
  id="form"
  class="needs-validation"
  novalidate
  data-schema-src="./schema.capabilities.js"
></form>
```

Schema module template:

```javascript
export const formSchema = {
  id: "example-form",
  stages: [
    {
      label: "Stage 1",
      fields: [
        {
          name: "fullName",
          label: "Full name",
          type: "text",
          required: true,
        },
      ],
    },
  ],
};
```

## Schema Editor

Form schemas can be created and edited visually using the [Form Builder Schema Editor](https://github.com/Nimrod-Galor/form_builder_schema_editor). The editor provides a graphical interface for building and modifying schemas without writing JSON by hand.

## Notes

- Form values are stored in localStorage under `formDraft` or `formDraft:{schemaId}` when `id` is provided in the schema.
- Each schema module must export `formSchema`.
- To make the summary stage optional, set `optional: true` on the summary stage in the schema module.
- If the form does not render, ensure the form element includes `data-schema-src` and that the module path is correct.
