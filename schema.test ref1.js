const stages = [
    {
      id: "stage-001",
      label: "first",
      fields: [
        {
          name: "frist name",
          type: "text",
          label: "First Name",
          placeholder: "First Name",
          helperText: "First Name",
          rows: 4
        },
        {
          name: "LAst NAme",
          type: "text",
          label: "Last Name",
          placeholder: "LAst Name",
          helperText: "Last Name",
          rows: 4,
          required: true,
          errorMessages: {
            required: "שדה שם משפחה חובה!!!"
          }
        }
      ]
    }
  ];

const fields = stages.flatMap(stage => stage.fields);

export const formSchema = {
  id: "test ref1",
  stages,
  fields
};
