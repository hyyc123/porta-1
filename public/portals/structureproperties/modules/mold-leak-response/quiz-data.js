window.QS_QUIZ = {
  moduleId: "mold-leak-response",
  checkpoints: [
    {
      t: 35,
      title: "Initial Response",
      questions: [
        {
          q: "What is the FIRST action when a mold or leak issue is reported?",
          a: [
            "Ignore it until maintenance hours",
            "Assess the situation and stop the source if possible",
            "Call the resident back next week"
          ],
          correct: 1
        }
      ]
    },
    {
      t: 95,
      title: "Health & Safety",
      questions: [
        {
          q: "Why is mold considered a serious issue?",
          a: [
            "It can cause health risks and property damage",
            "It only smells bad",
            "It is cosmetic only"
          ],
          correct: 0
        }
      ]
    },
    {
      t: 155,
      title: "Escalation",
      questions: [
        {
          q: "Who should be notified for significant leaks or mold issues?",
          a: [
            "Only the resident",
            "No one",
            "Property Manager or appropriate leadership"
          ],
          correct: 2
        }
      ]
    }
  ]
};
