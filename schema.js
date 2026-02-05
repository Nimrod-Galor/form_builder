const stages = [
  {
    id: "employment",
    label: "פרטי תעסוקה",
    fields: [
      {
        name: "employmentType",
        label: "סוג תעסוקה",
        type: "select",
        options: ["employee", "self-employed"],
        required: true,
        helperText: "בחר את סוג ההעסקה הרלוונטי"
      },
      {
        name: "workModel",
        label: "מודל העסקה",
        type: "radio",
        options: [
          { label: "משרה מלאה", value: "full" },
          { label: "חלקית", value: "part" },
          { label: "פרילנס", value: "freelance" }
        ],
        required: true,
        helperText: "עוזר לנו להבין את היקף העבודה"
      },
      {
        name: "startDate",
        label: "תאריך תחילת עבודה",
        type: "date",
        required: true,
        helperText: "הזן את התאריך שבו התחלת בתפקיד"
      },
      {
        name: "employmentNotes",
        label: "מידע נוסף",
        type: "textarea",
        rows: 3,
        placeholder: "הוסף פרטים או נסיבות מיוחדות",
        helperText: "אופציונלי — למשל פרויקטים בולטים או מגבלות"
      },
      {
        name: "employmentInfoNote",
        type: "plain text",
        title: "שים לב",
        text: "מידע זה לא נשמר בטופס ומשמש כהסבר בלבד."
      }
    ]
  },
  {
    id: "organization",
    label: "פרטי גוף",
    fields: [
      {
        name: "companyName",
        label: "שם החברה",
        type: "text",
        required: true,
        placeholder: "לדוגמה: סטודיו א.ב בעמ",
        helperText: "השם הרשמי המופיע במסמכים",
        showIf: {
          field: "employmentType",
          equals: "self-employed"
        }
      },
      {
        name: "employerName",
        label: "שם המעסיק",
        type: "text",
        required: true,
        placeholder: "שם המנהל הישיר",
        showIf: {
          field: "employmentType",
          equals: "employee"
        }
      },
      {
        name: "businessDescription",
        label: "תיאור הפעילות",
        type: "textarea",
        rows: 4,
        placeholder: "ספר בקצרה על סוג השירותים או המוצרים",
        helperText: "הסבר קצר עוזר לנו לתמוך טוב יותר",
        showIf: {
          field: "employmentType",
          equals: "self-employed"
        }
      },
      {
        name: "hasEmployees",
        label: "האם יש עובדים נוספים",
        type: "checkbox",
        helperText: "סמן אם יש לך צוות מעבר אליך",
        showIf: {
          field: "employmentType",
          equals: "self-employed"
        }
      },
      {
        name: "teamSize",
        label: "מספר עובדים",
        type: "number",
        helperText: "כולל עובדים במשרה מלאה וחלקית",
        attributes: {
          min: 1,
          step: 1
        },
        showIf: {
          field: "hasEmployees",
          equals: true
        }
      }
    ]
  },
  {
    id: "financial",
    label: "נתונים פיננסיים",
    fields: [
      {
        name: "monthlyIncome",
        label: "שכר חודשי",
        type: "number",
        required: true,
        helperText: "נא לספק אומדן לפני מס",
        attributes: {
          min: 0,
          step: 100
        },
        // Example: field-specific custom error messages override defaults.
        errorMessages: {
          required: "אנא הזן שכר משוער",
          numberInvalid: "יש להזין ספרות בלבד",
          min: "השכר חייב להיות חיובי"
        }
      },
      {
        name: "paymentFrequency",
        label: "תדירות תשלום",
        type: "select",
        options: [
          { label: "חודשי", value: "monthly" },
          { label: "דו-שבועי", value: "bi-weekly" },
          { label: "שבועי", value: "weekly" }
        ],
        required: true,
        helperText: "איך מתקבל השכר בפועל"
      },
      {
        name: "allowCreditCheck",
        label: "אני מאשר בדיקת אשראי",
        type: "checkbox",
        required: true,
        helperText: "חובה כדי להמשיך בתהליך הבקשה",
        errorMessages: {
          acceptance: "חייבים לאשר את ההצהרה כדי להתקדם"
        }
      }
    ]
  },
  {
    id: "contact",
    label: "פרטי קשר",
    fields: [
      {
        name: "contactEmail",
        label: "אימייל ליצירת קשר",
        type: "email",
        required: true,
        placeholder: "name@example.com",
        helperText: "נשתמש בו לעדכונים שוטפים",
        errorMessages: {
          emailInvalid: "הקלד כתובת אימייל תקינה (name@example.com)"
        }
      },
      {
        name: "contactPhone",
        label: "טלפון ליצירת קשר",
        type: "tel",
        required: true,
        placeholder: "05X-XXXXXXX",
        helperText: "מספר שניתן להשיג אותך בו במהלך היום",
        attributes: {
          inputmode: "tel",
          pattern: "[0-9+\\- ]+"
        }
      },
      {
        name: "additionalNotes",
        label: "הערות נוספות",
        type: "textarea",
        rows: 4,
        placeholder: "שתף דרישות או תזכורות חשובות"
      }
    ]
  },
  {
    id: "summary",
    label: "סיכום",
    type: "summary",
    fields: []
  }
];

const fields = stages.flatMap(stage => stage.fields);

export const formSchema = {
  stages,
  fields
};
