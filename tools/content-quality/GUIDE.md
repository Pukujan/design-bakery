# Writing and charts guide for the Eval Lab paper

This guide is for rewriting the "25 AI judges, 760 questions" paper on design-bakery.com.
Follow every rule. If a rule and your instinct disagree, go with the rule. Tags in brackets, like
[WP:AISIGNS] or [Kobak], link to sources we read. The full list with URLs is in section 8.
Machine-checkable versions of these rules live in `rules.json` in this folder.

## 1. Why AI text sounds like AI (read once, then apply the rules)

- **It drifts toward the average.** A model picks the likeliest phrasing, so specific facts get
  smoothed into generic claims that sound important. Wikipedia editors describe it as a sharp photo
  "fading into a blurry, generic sketch" [WP:AISIGNS]. Bednar puts it this way: "the less you give the
  model, the more it gives you the average" [Bednar].
- **It overuses a small set of words.** In 15 million PubMed abstracts, "style words" like delves,
  underscores, showcasing and crucial jumped after ChatGPT came out. At least 13.5% of 2024 abstracts
  were processed by an LLM [Kobak]. In computer science abstracts, up to 17.5% of sentences were
  LLM-modified by early 2024, and the top marker words were realm, intricate, showcasing and pivotal [Liang].
  Juzek and Ward traced 21 such "focal words" to human-feedback training, and found readers disliked
  abstracts that open with "delves" [Juzek]. The list changes over time. Wikipedia notes that Grok leans on
  *causal, empirical, correlate, underscore* [WP:AISIGNS].
- **Its grammar is different.** Instruction-tuned models use present-participle clauses ("..., highlighting
  the need for") 2 to 5 times as often as people do. GPT-4o's rate is 5.3 times. They also use
  nominalizations ("the reporting of") 1.5 to 2 times as often, which makes the prose dense and full of
  nouns [Reinhart]. The Economist studied 1.2 million words and found the same pattern: long sentences,
  few short ones, fewer commas and parentheses, Latinate words and science jargon [Economist].
- **Its rhetoric follows formulas:** "not X, but Y", the rule of three, "No X. No Y. Just Z.", bold
  inline headers, "serves as" where plain writing says "is", and "despite these challenges" endings.
  All are documented in [WP:AISIGNS], [Kriss] and [UZH].
- **The biggest problem is what's missing.** AI drafts have no person doing the work, no story, no
  concrete example and no stakes. When evidence is thin, a model fills the gap with rhetorical patterns
  [Bednar].

So swapping synonyms won't fix it. What fixes it is adding specifics, a narrator and an example. One
caution: no single tell proves a text is AI-written, and people who wrote the text themselves get flagged
too [UZH] [WP:AISIGNS]. We use these tells only as editing targets.

## 2. DO / DON'T rules with before and after

**Rule 1. Use a plain title that says what happened. Avoid the "X is not enough: Y should Z" formula.**
A colon-reveal title is a known tell. So is a slogan [WP:AISIGNS] [Kriss].
- Before: "Accuracy is not enough: AI judges should also be scored on the questions they skip"
- After: "Some AI graders skip up to 4 in 10 questions, and their scores don't show it"

**Rule 2. Open with one concrete case, then give the numbers.** For a complicated finding, start with a
single data point or character, then zoom out. For a simple finding, lead with the one number that
hits hardest [Pudding]. Readers should picture one question being graded before they meet 25 judges.
- Before: "We gave 25 AI judges the same 760 questions with known answers and found that one accuracy
  number hides skipped questions and request settings that change the score."
- After: "Imagine asking an AI to check whether an answer is right, and it simply doesn't reply. We asked
  25 AI models to grade the same 760 questions, and some of them did this a lot."

**Rule 3. Write as people. Use "we", active verbs and the present tense for findings** [Plain language]
[Orwell]. Say what you did and what surprised you. A narrator who made decisions is what AI drafts
lack [Bednar].
- Before: "We report these as results, not as footnotes."
- After: "We almost buried the skipped questions in an appendix. Then we saw how much they changed the
  ranking, so they're in the main results."

**Rule 4. Use contrast formulas rarely.** Avoid "not X, but Y", "X, not Y", "not only ... but also" and
"rather than" [WP:AISIGNS] [Economist] [Kriss]. Keep a contrast only when it marks a real boundary that
readers get wrong. Allow at most one per section. Fix contrasts when you edit, after the draft is written.
Banning them while drafting tends to strip out real reasoning [Pickles].
- Before: "When you choose a judge, ask how many questions it answered and how it was set up, not only for its score."
- After: "If you're picking an AI grader, ask two questions besides its score: how many questions did it
  actually answer, and what settings was it run with?"

**Rule 5. Cut sneaky adverbs and mood words.** Examples: quietly, silently, simply, notably, whisper, echo,
ghost. Say what happened [Kriss] [UZH].
- Before: "Some judges looked just as good but quietly skipped up to 4 in 10 questions."
- After: "Some judges scored as well as the leaders on the questions they answered. They also skipped up
  to 4 in 10 questions."

**Rule 6. Vary sentence length. Mix short and long.** Machine prose runs long and even, with few short
sentences [Economist] [UZH]. Target an average of 10 to 20 words per sentence. At least 1 in 7
sentences should be 8 words or fewer. No sentence should run past 35 words.
- Before: two bullets, each "Claim. Consequence." of the same length.
- After: "Counting skips as misses reshuffles the ranking. One judge drops from 99.8% to 80.3%."

**Rule 7. Replace abstract nouns with concrete things, and uncover hidden verbs.**
"Conduct an analysis of" becomes "analyze" [Plain language]. Orwell calls phrases like "give rise to" and
"exhibit a tendency to" "verbal false limbs" [Orwell]. Nominalizations are a measured AI tell [Reinhart].
"request settings" becomes "the settings we sent with each request, like whether the model gets one try
or several". "coverage" becomes "how many questions it answered". "accuracy-only reporting" becomes
"reporting just the score".

**Rule 8. Ask the research question in one plain sentence a friend might ask.** Muscatello's trial is
relevant: a plain question as the chart title lifted the share of readers who got the main point from
59% to 82% [Muscatello].
- Before: "When independent judges, from small local models to frontier APIs, receive identical typed
  decisions with objective gold labels, how do their accuracy and coverage differ, and what does
  accuracy-only reporting hide?"
- After: "If you give 25 AI graders, from small free models to the big paid ones, the same 760 questions
  with known answers, how often are they right, how often do they skip, and what do you miss if you only
  look at the score?"

**Rule 9. State the scope once, plainly, with the reason.**
- Before: "This is a measurement study of questions with one right answer. It does not rank providers in general..."
- After: "Every question we used has one right answer, because that's the only way to grade the graders
  fairly. So the results tell you how these models do at that job. They don't tell you which AI company is
  best overall."

**Rule 10. Keep jargon and internal names out of the main text.** Move these to the methods section or a
footnote: "McNemar", "Holm-corrected", "gold labels", "typed decisions", "baseline", "CI", "pre-v1.4",
"EXP-029". In the main text, say "we checked the differences weren't just luck" and "answers we already
knew were right". Be conversational first and precise later: put the precision in notes [Datawrapper text].
Use an everyday word whenever one exists [Orwell]. Readers understood acronyms far better once a footnote
spelled them out [Muscatello].

**Rule 11. Earn every claim.** Every paragraph needs a number, a named model or an example. Back each
claim with its evidence, an example, and a reason it matters [Bednar]. Watch for precise-sounding numbers
attached to vague claims, which Bednar calls "asymmetric specificity". Use only numbers from our results files.

**Rule 12. Don't restate.** No closing line that repeats the paragraph, such as "In short, ..." or "Overall,
this shows ...". Don't end on a moral or on "despite these challenges" [WP:AISIGNS]. End on the last new fact.

**Rule 13. Formatting.** Sentence-case headings. Bold at most one phrase per section. No bullets with bold
inline headers ("**Coverage:** ...") [WP:AISIGNS] [UZH]. Prose by default; bullets only for real lists; a
table only when there are real rows to compare [UZH]. Commas, periods or parentheses instead of em dashes,
at most 2 per 1,000 words [WP:AISIGNS] [Economist]. Straight quotes.

**Rule 14. Hedge once, precisely.** Not "may potentially suggest". Say "on these 760 questions" or state
the actual uncertainty ("the gap is within what luck could produce"). Don't split every claim into two sides
when the data picks one [UZH].

**Rule 15. Cut participle tails.** Don't end a sentence with ", highlighting ...", ", reflecting ..." or
", underscoring ...". These are the most over-used AI structure measured [Reinhart] [WP:AISIGNS]. End at the
fact. If the implication matters, give it its own sentence and its evidence.
- Before: "DeepSeek V4 Flash fell to 80.3%, highlighting the cost of skipped questions."
- After: "DeepSeek V4 Flash fell to 80.3%. It skipped about 1 in 5 questions."

**Rule 16. Use "is" and put the new information at the end.** Write "is" rather than "serves as",
"stands as" or "represents" [WP:AISIGNS]. Put the familiar part first and the new, important part last
in the sentence. Keep the verb close to its subject [Gopen & Swan].
- Before: "An 84.5% versus 97.4% difference, depending on setup, was observed for the same model."
- After: "The same model scored 84.5% with one setup and 97.4% with another."

**Rule 17. Name your sources.** Don't write "experts say" or "studies show". Link the study, or cut the
claim [WP:AISIGNS] [UZH].

**Rule 18. Use short, plain words.** Say "use" (not "leverage"), "big" (not "significant", unless you mean
a statistical test), "method" (not "methodology") and "more and more" (not "increasingly") [Orwell] [Economist].

## 3. Banned and suspicious words

The full list, with severity and fixes, is in `rules.json`. Sources: [Kobak] [Juzek] [Liang] [Reinhart]
[WP:AISIGNS] [Economist] [Kriss] [Orwell].

**Banned (replace every time):** delve, underscore(s), showcase, highlight(s/ing) as a verb, pivotal, tapestry, testament, intricate, realm, meticulous, vibrant, palpable, camaraderie, amidst, multifaceted, groundbreaking, boasts, garner, bolster, foster, seamless, holistic, paradigm, transformative, unprecedented, nuanced, game-changer, "serves as", "stands as", "plays a key role", "it's worth noting", "it is important to note", "in today's world", "sheds light on", "paves the way", "a growing body of", "experts argue", "studies have shown".

**Suspicious (at most once per page, and only when literal):** key (as an adjective), crucial, robust, landscape, insights, comprehensive, leverage, enhance, align with, notably, additionally, furthermore, moreover, ultimately, essentially, significant, increasingly, methodology, empirical, causal, framework, quiet(ly), echo, "give rise to", "the fact that", "conduct an analysis", "rather than", "in other words".

**Structural tells to remove:** colon titles, rule-of-three lists used for rhythm, "-ing" tail clauses, bullets that are all the same length, "Despite X, Y" openers, "No X. No Y. Just Z.", "an X with Y and Z" put-downs, sections that end on a moral.

## 4. Chart rules

1. **One message per chart.** Write the message as a sentence first. If you can't say it in a few
   sentences, rethink the chart [UK AF] [Pudding]. Decide what you actually want to show before picking a type
   [Datawrapper types].
2. **Pick the type from the relationship.** For a ranking, use an ordered bar chart. For parts of a whole
   (right + wrong + skipped = 760), use a stacked bar [FT VV]. Default to bars, because readers already
   know how to read them. Arrow, range and dumbbell charts are "trickier to read for a mainstream
   audience" [Datawrapper types]. Switching a pie chart to a bar chart made readers 3.6 times as likely to read a
   value correctly [Muscatello].
3. **Use two titles.** The headline title states the takeaway in plain words ("Some graders skipped a
   fifth of the questions"). The subtitle says what is measured, where and when [UK AF]. Use a
   takeaway title, never a label like "Accuracy by judge" [SWD]. Leave statistics words out of titles:
   no median, CI, Wilson, McNemar or Holm [Datawrapper text].
4. **Show uncertainty in words or with grey, not with whiskers.** Error bars confuse even researchers.
   In a study of 473 authors, many misjudged what overlapping bars mean [Belia]. Only 16% of respondents
   without a university degree, and 40% of those with one, understood confidence intervals in a chart
   [Muscatello]. Readers shown confidence intervals overestimated effects, compared with other displays
   [Hofman]. Bars carry their own bias: people treat values inside a bar as more likely. Bars are fine for
   counts and shares, but show a mean with spread as dots [Newman]. Say "differences under N points could be
   luck", or grey out judges that are statistically tied.
5. **Label directly.** Put names beside the bars and values at the bar ends. Don't use a legend. If you
   need colour, colour the words in the subtitle so they act as the key [Datawrapper text] [SWD] [UK AF].
6. **Limit series.** Use at most 4 segments in a stack. Use at most 3 colours plus grey, and one
   highlight colour [UK AF] [SWD]. Use at most about 15 rows in a main-text chart. Put the full list in a table.
7. **Use plain row names.** No version tags, run IDs or file paths [Datawrapper text]. "Qwen3.8 Flash,
   one pass" becomes "Qwen3.8 Flash (one try per question)". "Verdict pre-v1.4 (local)" becomes a plain
   description of what it is (e.g. "Our grader, older version, run on our own computer"). Check the real
   meaning first.
8. **Annotate the 1 to 3 things you want people to see.** Place each annotation next to the data, and
   write it as a sentence [Datawrapper text] [UK AF].
9. **Give reference lines a sentence, not a word.** "baseline 50.3%" becomes "Always giving the same
   answer scores 50.3%" [UK AF].
10. **Sort bars by the number that matters.** Here that's right out of all 760, not alphabetical order
    [UK AF] [FT VV]. Start bar axes at zero and never break them [UK AF].
11. **Make the footer a source a reader can use**, e.g. "Source: Eval Lab benchmark, [link to data]".
    Script names and experiment IDs go in the methods section [UK AF].
12. **Add a 1 to 3 sentence text description under each chart**, plus alt text [UK AF]. The caption
    adds what the chart can't show: why it matters or how the data was made. Never repeat the title.
13. **Declutter.** Remove the border. Use light gridlines or none. Don't rotate text. Keep data labels
    sparse and numbers to at most 1 decimal place [SWD] [Datawrapper text] [UK AF].
14. **Test it.** Show the chart to someone for 5 seconds. They should be able to say the takeaway back.

### Redesign of Figure 1 (the dumbbell chart)

The current chart is a dumbbell with the title "Scores on answered questions hide skipped ones". It has
hollow and filled dots, a dotted "baseline 50.3%" line, internal row names, and a footer with EXP-029 and
a script path.

The new version:
- **Chart type:** a horizontal 100% stacked bar, one bar per judge. Each bar covers all 760 questions,
  split into three segments: **Right** (dark blue), **Wrong** (orange) and **Skipped** (light grey).
  Sort the bars by Right. If 25 bars is too many, show the top 10 plus any judge that skipped a lot,
  and put the full list in a table.
- **Title:** "Some AI graders look almost perfect until you count the questions they skipped"
- **Subtitle:** "Each bar is all 760 questions: <blue>right</blue>, <orange>wrong</orange>, or
  <grey>skipped</grey>". The coloured words replace the legend.
- **Labels:** the judge name on the left in plain words. Print % right at the end of the blue segment.
  Print % skipped inside the grey segment when it's larger than 10%.
- **Annotation 1 (arrow to DeepSeek V4 Flash):** "Right 99.8% of the times it answered, but only 80.3%
  of all 760, because it skipped the rest." (80.3 / 99.8 means it answered about 80%. Verify this in the data.)
- **Annotation 2 (vertical line at 50.3%):** "A grader that always gives the same answer would get 50.3% right."
- **Annotation 3 (if both settings of one model are shown):** "Same model, different settings: 84.5% vs 97.4%."
- **Footer:** "Source: Eval Lab benchmark of 25 AI graders on 760 questions with known answers. Data: [link]."
- **Text under the chart:** "We counted a skipped question as a wrong grade. In real use, a skipped
  grade is still a question someone has to check by hand."

### Redesign of the whisker chart ("Holm-corrected McNemar")

Replace it with plain bars of % right out of 760 [Muscatello] [Datawrapper types]. Grey out the judges
whose difference from the top judge could be luck. Say so in the subtitle: "Grey bars: too close to the
leader to call a winner." Move "95% CI", "McNemar" and "Holm" to the methods section, with one sentence
explaining each [Datawrapper text] [Belia].

## 5. Self-check before submitting

`rules.json` automates most of these checks once the linter exists.

- [ ] The title has no colon, no "not enough" and no "should". It states a finding.
- [ ] The first paragraph contains one concrete example question.
- [ ] "We" appears in the first three sentences. Something we did or noticed is told as a small story.
- [ ] Zero banned words. Each suspicious word appears at most once.
- [ ] Search for "not ", "rather than" and "but also". At most one contrast per section, and only a real one.
- [ ] Search for ", highlighting", ", reflecting" and other ", ...ing" tails. None remain.
- [ ] Search for "—". At most 2 per 1,000 words.
- [ ] Sentence lengths vary. Read three sentences in a row aloud. If they share a length or rhythm, change one.
- [ ] No bullet list where every item has the same shape. No bold inline headers.
- [ ] Every paragraph has a number, a name or an example. No "experts say".
- [ ] No paragraph ends by restating itself.
- [ ] No internal IDs, file paths, version tags or test names outside the methods section.
- [ ] Every chart has: a takeaway title and a plain subtitle, direct labels, no legend, plain row names,
      at most 3 colours plus grey, 1 to 3 annotations, a usable source line and a text description.
- [ ] No dumbbell, whisker or error-bar chart in the main text.
- [ ] Every number matches the results files. Nothing was rounded into a different claim.
- [ ] Could a smart friend who doesn't work in AI explain the main finding back to you after one read?

## 6. How to use the tells without overcorrecting

- Fix structure first: the title, the opening example and the narrator. Then fix words. A rewrite that
  only swaps synonyms still reads as AI [Bednar] [Kobak].
- Do a separate edit pass for contrasts and triplets. Models obey "no em dashes" easily, but they don't
  obey "no not-X-but-Y" when drafting [Bednar] [Pickles].
- Don't replace one tic with another. Stripping out every comma or every list of three is also uniform [UZH].

## 7. Sample opening

# Some AI graders skip up to 4 in 10 questions, and their scores don't show it

Say you ask an AI to check one answer on a test, where we already know the correct grade, and it comes
back with nothing. The usual score just leaves that question out and grades the AI on the ones it did answer.
We gave 25 AI graders the same 760 questions and counted every skip as a miss. One model, DeepSeek V4
Flash, was right 99.8% of the time when it answered, but only 80.3% of the time across all 760. That gap
is what this paper is about.

What we found:

1. The best grader got 99% right.
2. Some graders skipped up to 4 in 10 questions. If you only look at the questions they answered, they look as good as the leaders.
3. How you set a model up changes its score. The same model got 84.5% with one setup and 97.4% with another.
4. A grader that gave the same answer every time would score 50.3%. That is the floor every other score should be measured from.

(Swap the hypothetical "one answer on a test" for a real item from the 760 questions, quoted word for word.)

## 8. Sources

Every source below was fetched and read. [Belia] and [Newman] were read as abstracts only.

**AI writing tells (research)**
- [WP:AISIGNS] Wikipedia: Signs of AI writing. https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
  Taken: the word lists by era, copula avoidance, negative parallelism, rule of three, "-ing" tails,
  vague attribution, formatting tells, and the warning that tells are not proof.
- [Kobak] Kobak et al., "Delving into LLM-assisted writing in biomedical publications through excess
  vocabulary", Science Advances 2025. https://arxiv.org/abs/2406.07016
  Taken: the excess style-word list; at least 13.5% of 2024 PubMed abstracts were LLM-processed.
- [Reinhart] Reinhart et al., "Do LLMs write like humans? Variation in grammatical and rhetorical styles",
  PNAS 2025. https://arxiv.org/html/2410.16107
  Taken: participle clauses at 2-5x the human rate and nominalizations at 1.5-2x; the GPT-4o word list.
- [Liang] Liang et al., "Mapping the Increasing Use of LLMs in Scientific Papers".
  https://arxiv.org/abs/2404.01268
  Taken: 17.5% of CS-abstract sentences were LLM-modified; top words were realm, intricate, showcasing, pivotal.
- [Juzek] Juzek & Ward, "Why Does ChatGPT 'Delve' So Much?". https://arxiv.org/abs/2412.11385
  Taken: the 21 focal words; human-feedback training as the likely cause; readers dislike "delves".

**AI writing tells (practitioners and journalism)**
- [Economist] The Economist, "How to spot AI writing" (Jul 2026, reprinted by Hindustan Times).
  https://www.hindustantimes.com/lifestyle/art-culture/how-to-spot-ai-writing-101785491459334.html
  Taken: long, uniform sentences; fewer commas and parentheses; Latinate and science words; "and"
  overused; only Claude still overuses em dashes.
- [Kriss] Sam Kriss, "Why Does A.I. Write Like ... That?", NYT Magazine, Dec 2025 (full text via
  Business Standard). https://www.business-standard.com/world-news/why-does-ai-write-like-that-exploring-strange-patterns-of-machine-text-125120700170_1.html
  Taken: "No X. No Y. Just Z.", tricolons, "it's not X, it's Y", and quiet/echo/ghost mood words.
- [Bednar] Ed Bednar, "Why AI Writing Sounds Like AI Writing" (Aug 2026).
  https://edbednar.com/why-ai-writing-sounds-like-ai-writing/
  Taken: missing evidence gets filled with rhetoric; asymmetric specificity; earn each claim; prompt bans
  on contrast formulas fail.
- [UZH] Marco Weber, "Do I Sound Like an AI?", UB Zurich blog (Sep 2026).
  https://www.uzh.ch/blog/ub/2026/09/10/schreibe-ich-schon-wie-eine-ki/?lang=en
  Taken: vocabulary, formatting and rhetoric tells; over-hedging and forced both-sides; forced tables;
  a tell is not proof.
- [Pickles] "The Thinking Inside the LLM Clichés", pickles.news (May 2026).
  https://pickles.news/posts/the-thinking-inside-the-cliches/
  Taken: ban decorative words freely, but edit contrast operators after drafting, because they can carry real logic.

**Plain language and science writing**
- [Orwell] George Orwell, "Politics and the English Language" (1946).
  https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/
  Taken: the six rules; "verbal false limbs"; short words over long; everyday words over jargon.
- [Plain language] Digital.gov, "Writing for understanding". https://digital.gov/guides/plain-language/writing
  Taken: active voice, present tense, short sentences, and hidden verbs ("conduct an analysis of" becomes "analyze").
- [Gopen & Swan] "The Science of Scientific Writing", American Scientist 1990.
  https://www.gatsby.ucl.ac.uk/~pel/misc/gopen_swan.pdf
  Taken: old information first and new information in the stress position at the end; keep the verb near the subject.

**Charts and how people read them**
- [Datawrapper text] Lisa Charlotte Muth, "What to consider when using text in data visualizations".
  https://www.datawrapper.de/blog/text-in-data-visualizations
  Taken: label directly; plain phrasing; no stats words in titles; sensible decimals; no insider acronyms.
- [Datawrapper types] Lisa Charlotte Muth, "A friendly guide to choosing a chart type".
  https://www.datawrapper.de/blog/chart-types-guide
  Taken: bars are easiest; stacked bars for shares; arrow and range plots are hard for mainstream readers.
- [SWD] Elizabeth Ricks, "declutter! (and question default settings)", Storytelling with Data.
  https://www.storytellingwithdata.com/blog/2019/5/13/declutter-and-question-defaults
  Taken: the 8 declutter steps: no border or gridlines, labels next to data, sparing colour, takeaway title.
- [FT VV] Financial Times, Visual Vocabulary. https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
  (web: https://ft-interactive.github.io/visual-vocabulary/)
  Taken: choose the chart by relationship (ordered bar for ranking, stacked bar for part-to-whole).
- [UK AF] UK Government Analysis Function, "Data visualisation: charts".
  https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/
  Taken: headline title plus statistical subtitle; at most 4 series; direct labels; ranked bars; zero axis;
  useful source line; text description.
- [Muscatello] Muscatello et al., "Communicating population health statistics through graphs: a
  randomised controlled trial", BMC Medicine 2006. https://pmc.ncbi.nlm.nih.gov/articles/PMC1766925/
  Taken: bar charts beat pies (3.6x); a plain question title helped (59% to 82%); most readers misread CIs.
- [Pudding] Ilia Blinderman, "Making Internet Things, part 3: Storytelling", The Pudding.
  https://pudding.cool/process/how-to-make-dope-shit-part-3/
  Taken: start with a central question; lead with one strong number or one character; methods go at the end.
- [Belia] Belia et al., "Researchers Misunderstand Confidence Intervals and Standard Error Bars", 2005 (abstract).
  https://www.sci.utah.edu/~kpotter/Library/Papers/belia:2005:RMCI/index.html
  Taken: many of 473 published researchers misjudged what error bars say about significance.
- [Newman] Newman & Scholl, "Bar Graphs Depicting Averages are Perceptually Misinterpreted", 2012 (abstract).
  https://www.sci.utah.edu/~kpotter/Library/Papers/newman:2012:WTBB/index.html
  Taken: the within-the-bar bias, so use bars for counts and shares and dots for means.
- [Hofman] Hofman, Goldstein & Hullman, "How Visualizing Inferential Uncertainty Can Mislead Readers
  About Treatment Effects", CHI 2020.
  https://www.dangoldstein.com/papers/Hofman_Goldstein_Hullman_Visualizing_Uncertainty_Mislead_Scientific.pdf
  Taken: showing CIs made readers overestimate effects; prediction intervals or animations did better.
