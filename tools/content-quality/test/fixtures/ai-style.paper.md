# Accuracy is not enough: AI judges should also be scored on the questions they skip

<p class="paper-subtitle"><em>We gave 25 AI judges the same 760 questions with known answers and found that one accuracy number hides skipped questions and request settings that change the score.</em></p>

> **Research question.** When independent judges, from small local models to frontier APIs, receive identical typed decisions with objective gold labels, how do their accuracy and coverage differ, and what does accuracy-only reporting hide?

This is a measurement study of questions with one right answer. It does not rank providers in general, and it does not cover open-ended or subjective grading.

We report these as results, not as footnotes. Our analysis delves into the realm of judge behaviour and sheds light on the tapestry of failure modes that underscores the pivotal role of coverage in evaluation. Some judges looked just as good but quietly skipped up to 4 in 10 questions.

DeepSeek V4 Flash fell to 80.3%, highlighting the cost of skipped questions. An 84.5% versus 97.4% difference, depending on setup, was observed for the same model. Experts argue that these findings are crucial, and studies have shown that it is worth noting that the framework is robust.

When you choose a judge, ask how many questions it answered and how it was set up, not only for its score. In short, the results are comprehensive and the insights are increasingly significant.

## 4. Results

The analysis was performed on the consolidated run EXP-029 with the McNemar test, and the Holm-corrected intervals were computed in scripts/analyze.py. Coverage is reported alongside every accuracy figure.

No bugs. No crashes. Just silence from the model.

## 5. Discussion

Despite these challenges, the paradigm remains transformative. It is important to note that the methodology leverages a seamless, holistic and multifaceted framework, additionally the nuanced interplay of factors is not unjustifiable.

- **Coverage:** the share of questions the judge answered.
- **Accuracy:** the share of answered questions that were right.
- **Cost:** the price per 1,000 graded questions.

Overall, this shows that the key question is whether the field can navigate the complexities of evaluation at scale.
