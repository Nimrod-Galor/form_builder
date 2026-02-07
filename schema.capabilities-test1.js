const stages = [
    {
      id: "intro",
      label: "ברוכים הבאים",
      fields: [
        {
          name: "IntroText",
          type: "plain text",
          title: "מטרת הטופס ואיך משתמשים בו",
          text: "טופס זה מדגים את כל יכולות בונה הטפסים.\n מלאו כל שלב לפי ההנחיות.\n השתמשו בכפתורי הניווט בתחתית הטופס כדי לעבור קדימה ואחורה בין השלבים, או בתפריט השלבים בראש העמוד לקפוץ קדימה ואחורה לשלב ספציפי.\n לחצו על איפוס כדי להתחיל מחדש.\n בשלב הסיכום ניתן לבדוק את הנתונים לפני שליחה."
        }
      ]
    },
    {
      id: "basics",
      label: "יסודות",
      fields: [
        {
          name: "plainTextInfo",
          type: "plain text",
          title: "שדות דינמיים",
          text: "ניתן להגדיר שדות שמופיעים או נעלמים בהתאם לקלטים אחרים בטופס."
        },
        {
          name: "showControlledField",
          label: "show controlled field?",
          type: "checkbox",
          helperText: "סמן כדי להציג שדה נשלט"
        },
        {
          name: "controlledText",
          label: "שדה נשלט",
          type: "text",
          placeholder: "יופיע רק כשהתיבה מסומנת",
          showIf: {
            field: "showControlledField",
            equals: true
          }
        },
        {
          name: "SelectInfo",
          type: "plain text",
          text: "בחר באפשרות א כדי להציג שדה נשלט (שדה חובה)."
        },
        {
          name: "controllSelect",
          label: "בחירה שולטת",
          type: "select",
          options: [
            {
              label: "אפשרות א'",
              value: "option-a"
            },
            {
              label: "אפשרות ב'",
              value: "option-b"
            },
            {
              label: "אפשרות ג'",
              value: "option-c"
            }
          ],
          helperText: "יופיע רק כשהתיבה מסומנת"
        },
        {
          name: "showControlledSelect",
          label: "שדה נשלט",
          type: "text",
          placeholder: "יופיע רק כאפשרות א נבחרה",
          required: true,
          showIf: {
            field: "controllSelect",
            equals: "option-a"
          }
        },
        {
          name: "test-001",
          type: "select",
          label: "test 001",
          helperText: "this is a test",
          rows: 4,
          options: [
            {
              label: "op1",
              value: "op1"
            },
            {
              label: "op2",
              value: "op2"
            },
            {
              label: "op3",
              value: "op3"
            }
          ]
        }
      ]
    },
    {
      id: "inputs",
      label: "סוגי קלט",
      fields: [
        {
          name: "fullName",
          label: "שם מלא",
          type: "text",
          required: true,
          placeholder: "הזן שם פרטי ומשפחה",
          helperText: "דוגמה: נועה כהן"
        },
        {
          name: "email",
          label: "אימייל",
          type: "email",
          required: true,
          placeholder: "name@example.com",
          helperText: "נשתמש בו רק לדוגמה",
          errorMessages: {
            emailInvalid: "הקלד כתובת אימייל תקינה"
          }
        },
        {
          name: "phone",
          label: "טלפון",
          type: "tel",
          placeholder: "05X-XXXXXXX",
          helperText: "תומך בתווים מספריים וסימנים",
          attributes: {
            inputmode: "tel",
            pattern: "[0-9+\\- ]+"
          }
        },
        {
          name: "birthDate",
          label: "תאריך",
          type: "date",
          helperText: "דוגמה לשדה תאריך"
        },
        {
          name: "quantity",
          label: "כמות",
          type: "number",
          required: true,
          helperText: "שדה מספר עם מגבלות",
          attributes: {
            min: 1,
            max: 10,
            step: 1
          },
          errorMessages: {
            required: "חובה להזין כמות",
            numberInvalid: "יש להזין ספרות בלבד",
            min: "המינימום הוא 1",
            max: "המקסימום הוא 10"
          }
        }
      ]
    },
    {
      id: "choices",
      label: "בחירה",
      fields: [
        {
          name: "plan",
          label: "תוכנית",
          type: "select",
          options: [
            {
              label: "בסיסית",
              value: "basic"
            },
            {
              label: "מתקדמת",
              value: "pro"
            },
            {
              label: "ארגונית",
              value: "enterprise"
            }
          ],
          required: true,
          helperText: "דוגמה לבחירה מרשימה"
        },
        {
          name: "deliveryMethod",
          label: "שיטת מסירה",
          type: "radio",
          options: [
            {
              label: "דוא\"ל",
              value: "email"
            },
            {
              label: "קישור",
              value: "link"
            },
            {
              label: "איסוף עצמי",
              value: "pickup"
            }
          ],
          helperText: "דוגמה לקבוצת רדיו"
        },
        {
          name: "agreeTerms",
          label: "אני מאשר את התנאים",
          type: "checkbox",
          required: true,
          helperText: "נדרש להמשך",
          errorMessages: {
            acceptance: "חובה לאשר כדי להתקדם"
          }
        }
      ]
    },
    {
      id: "longText",
      label: "טקסט ארוך",
      fields: [
        {
          name: "feedback",
          label: "משוב",
          type: "textarea",
          rows: 4,
          placeholder: "שתף חוויה או רעיון",
          helperText: "דוגמה לשדה טקסט ארוך"
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
  id: "capabilities-test1",
  stages,
  fields
};
