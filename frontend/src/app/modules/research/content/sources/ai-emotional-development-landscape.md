# AI Emotional Development: Research Landscape 2023–2026

*Survey, 2026-07-23. Covers AI systems that develop/change emotions over time (not just recognition).*

---

## The Core Insight: The Field Is Split Into Three Strands

Research on AI that *develops* emotions (vs. recognizing them) clusters into three distinct approaches. Almost none of them share a vocabulary or cite each other. This is a field with no unified theory, no shared benchmark, and no consensus on what "artificial emotion" even means.

---

## STRAND 1: Computational Models of Emotional Emergence

These papers build agents that *generate* emotional states from internal dynamics, rather than labeling input.

### 1.1 Schillaci, Ciria & Lara, "Tracking Emotions: Intrinsic Motivation Grounded on Multi-Level Prediction Error Dynamics"
- **arXiv:** 2007.14632 (ICDL-EPIROB 2020)
- **What they did:** Formalized emotions as arising from differences between expected and actual rates of progress toward goals. Built an intrinsic motivation architecture where an agent tracks prediction error dynamics at multiple levels to regulate exploration/exploitation, essentially giving the agent "emotional" modulation based on how well it's learning.
- **Key mechanism:** Multi-level prediction error monitoring → emotion-like states → goal selection modulation → exploration noise adjustment.
- **Status: Running code available**; the architecture was implemented on robotic agents. The paper is from the ICDL-EPIROB community (developmental robotics).
- **Code:** Not on GitHub as a standalone repo; was part of a larger robotic platform.

### 1.2 Free Energy-Based Modeling of Emotional Dynamics
- **arXiv:** 2601.00812 (accepted IEEE Access, 2026)
- **Authors:** Ushio, Onishi, Yanagisawa
- **What they did:** Used the Free Energy Principle (Friston's framework) to model emotional dynamics *from scene features alone*, no physiological signals, no self-report. Quantified "pleasantness," "surprise," and "habituation" using Kullback-Leibler divergence (prediction error), Bayesian surprise (belief updates), and uncertainty (prior ambiguity).
- **Key mechanism:** KLD → pleasantness, Bayesian surprise → surprise response, uncertainty → surprise from ambiguity. Identified three emotional patterns: uncertain stimulus, sustained high emotion, momentary peak and decay.
- **Significance:** This is the closest thing to a *computational theory of how emotions form and change over time* in an AI system. It's grounded in active inference, which connects to developmental psychology's idea that emotions are fundamentally about expectation-reality gaps.
- **Status: Theory + validated on video data.** No standalone GitHub repo, but the approach is reproducible from the paper.

### 1.3 PsychoAgent, Psychology-Driven Generative Agent Framework
- **arXiv:** from the "emotion formation artificial agents" search (CogSci 2026 accepted)
- **Authors:** Qingqing Gu et al.
- **What they did:** Built an LLM-based agent that simulates *panic emotion formation* using appraisal theory. Uses role-playing agents to simulate individual psychological chains through dedicated prompts. Improved panic prediction by 12.6–21.7% over baselines.
- **Key mechanism:** Emotion arousal theory → cognitive appraisal → role-based simulation. The LLM is prompted to *be* a person going through an emotional sequence, not just classify emotions.
- **Code:** `https://anonymous.4open.science/r/PsychoAgent-19DD` (anonymous-review mirror; unreachable as of 2026-07-26, HTTP 401/403, so treat the code as not currently retrievable)
- **Significance:** This is a paradigm shift from "data-driven fitting" to "role-based simulation with mechanistic interpretation", the agent actually *runs through* an emotional process rather than labeling it.

---

## STRAND 2: Emergent Affective Geometry in Foundation Models

These papers discover that large models *accidentally* develop emotion representations through training, they don't try to build emotions, but emotions emerge.

### 2.1 Du et al., "Multimodal Large Language Models Converge on the Human-Like Geometry of Abstract Emotion"
- **Project:** https://reedonepeck.github.io/ai-emotion.github.io/
- **What they did:** Collected 12 million triplet odd-one-out judgments from MLLMs and LLMs on 2,180 emotionally evocative videos. Learned 30-dimensional embeddings via SPoSE. Found that the MLLM's affective space:
  - Is highly interpretable (34 emotion categories + 14 affective dimensions)
  - Organizes emotion along categorical lines in a "hybrid" fashion
  - **Predicts human fMRI activity** in emotion-processing brain regions (TPJ) with accuracy matching or exceeding human self-report
  - Outperforms human behavioral ratings at predicting neural activity
- **Key mechanism:** Sensory grounding (learning from rich visual data) is critical, the MLLM beats the language-only model at neural alignment. This suggests emotions aren't just linguistic labels; they require multimodal experience.
- **Code:** Project page has visualization tools; underlying SPoSE implementation is standard.
- **Significance:** This is the strongest evidence yet that MLLMs autonomously develop neurally-aligned affective representations. The fact that they outperform human self-reports at predicting brain activity is extraordinary.

### 2.2 Social Dynamics in LLM Agent Networks (MoltBook / MoltBook Ecosystem)
- **arXiv:** appeared in the "emotion emergence LLM agent" search
- **What they did:** Multiple papers studying how LLM agents form social networks, develop emotional support behaviors, and exhibit homophily/reciprocity through repeated interaction. The agents develop stable interaction patterns and form emergent social ties.
- **Key mechanism:** Behavioral reward functions capturing emotional support + in-context learning → emergent social dynamics mirroring real online communities.
- **Significance:** This shows that when LLM agents interact in populations, emotional behaviors *emerge* without being programmed, a form of emotional development through social experience.

---

## STRAND 3: Emotion as a Developmental Capability

These papers explicitly connect AI emotion to developmental psychology frameworks.

### 3.1 Tang et al., "Robot Character Generation and Adaptive Human-Robot Interaction with Personality Shaping"
- **arXiv:** 2503.15518 (March 2025)
- **What they did:** Built a framework integrating Big Five Personality Traits, Appraisal Theory, and abstracted memory layers through LLMs. The LLM generates a parameterized robot personality, processes human language, evaluates using Appraisal Theory, generates emotions, and selects actions adapted by historical context over time.
- **Key mechanism:** Personality (Big Five) + Appraisal Theory + memory layers → emotionally adaptive robot behavior that *changes over time* based on interaction history.
- **Status: Running code, validated with three robot personalities.**
- **Significance:** This is the closest thing to a "developmental" approach to robot emotions, the robot's emotional responses evolve through interaction history, not just instantaneous stimulus-response.

### 3.2 L²-EMG: Lifelong Empathic Motion Generation
- **arXiv:** 2512.19551 (December 2025)
- **Authors:** Wang, Wang, Chen, Zhang, Zhou
- **What they did:** Proposed a task where LLMs *continually acquire* emotional motion generation knowledge across different unseen scenarios. The system needs to generate emotionally appropriate movements for scenarios it hasn't seen before.
- **Key mechanism:** Emotion-Transferable and Scenario-Adapted Mixture of Experts (ES-MoE) with causal-guided emotion decoupling. The system explicitly handles how emotions transfer across different contexts.
- **Significance:** This is "lifelong emotional learning", the system gets better at generating emotional responses over time across new situations, which is directly analogous to how human emotional development works.

### 3.3 Agent-Infant Interaction System (Emotional Engagement)
- **arXiv:** from the "emotion robot social learning development" search
- **What they did:** Dialogue management for multiparty agent-infant interaction to teach visual sign language. Uses eye-tracking (attention) and thermal imaging (emotional arousal) to measure the baby's internal emotional states. The system adapts its behavior based on the baby's emotional engagement.
- **Key mechanism:** Emotional state tracking → adaptive dialogue policy → sustained engagement.
- **Significance:** This is the most direct connection to developmental psychology, studying how AI agents can participate in *emotional development* of human infants during a critical period.

---

## STRAND 4: Affective Computing Beyond Recognition

### 4.1 Appraisal Theory for Cross-Age Affect Recognition (THERADIA-WoZ)
- **arXiv:** appeared in the first search
- **What they did:** Compared appraisal dimensions vs. categorical labels for affect recognition across age groups. Found appraisal dimensions consistently outperform categorical labels and generalize better across ages.
- **Significance:** Supports the theoretical move from "emotion detection" to "appraisal-based emotion modeling", a more psychologically grounded approach.

### 4.2 BDEI Framework for Panic Emotional Arousal
- **arXiv:** from the "emotion emergence LLM agent" search
- **What they did:** Introduced Belief-Desire-Emotion-Intention (BDEI) pathways into agent architectures. Added an explicit Emotion node grounded in appraisal theory to standard BDI agents.
- **Key mechanism:** Psychological Safety Distance model → appraisal theory → explicit Emotion node in agent architecture. The LLM is confined to parameter estimation for Belief-to-Desire transitions, preventing hallucination propagation.
- **Significance:** This is a principled way to add emotional processing to AI agents, not bolted on, but architecturally integrated.

---

## Open-Source Implementations

| System | Code Available? | Link |
|--------|----------------|------|
| PsychoAgent | Listed, link dead 2026-07-26 | anonymous.4open.science/r/PsychoAgent-19DD |
| Robot Personality (Tang et al.) | Appears to have code | Check paper for repo |
| MLLM Affective Geometry | Project page | reedonepeck.github.io/ai-emotion.github.io |
| Free Energy Emotional Dynamics | Theory, reproducible | Paper only (IEEE Access 2026) |
| L²-EMG (ES-MoE) | Unclear | Check paper |
| Tracking Emotions (Schillaci) | Was on robotic platform | No standalone GitHub |

---

## What's Missing (The Gaps)

1. **No shared benchmark.** There's no equivalent of ImageNet for emotional development. Every paper uses different stimuli, different metrics, different definitions of "emotion."

2. **No longitudinal studies.** Almost every paper measures performance on a fixed dataset. None track how an agent's emotional responses *change over months or years* of experience.

3. **No unified theory.** Appraisal theory, free energy principle, prediction error monitoring, and Big Five personality are all used in different papers with no attempt at unification.

4. **Almost no embodied emotional development.** The vast majority of work is on language/vision models. Only Tang et al. and the infant interaction system deal with physical robots developing emotional responses through embodied experience.

5. **No open-source "emotional development" framework.** There's no modular library where you can plug in an emotion model, a memory system, and a learning algorithm and watch emotional behavior emerge.

6. **The definition problem.** "Emotion" means different things in every paper, sometimes it's a label, sometimes a behavioral state, sometimes a computational signal, sometimes a social behavior. The field hasn't converged on what it means for AI to "have emotions."

---

## Key Papers to Read (Priority Order)

1. **Du et al. (MLLM Affective Geometry)**, strongest evidence that emotions *emerge* in foundation models
2. **Schillaci et al. (Tracking Emotions)**, most direct theory of how emotions arise from learning dynamics
3. **Ushio et al. (Free Energy Emotional Dynamics)**, computational mechanism for emotional dynamics using active inference
4. **Tang et al. (Robot Personality + Memory)**, most complete system for emotionally adaptive robot behavior
5. **L²-EMG (Lifelong Empathic Motion)**, first paper on lifelong emotional learning in agents
6. **PsychoAgent**, LLM-based emotional process simulation
7. **BDEI Framework**, principled architectural integration of emotion into agents

---

*This survey covers the landscape as of July 2026. The field is rapidly evolving, particularly around LLM-based emotional agents.*
