/** Longform markdown bodies for research papers 002–004 (split out for readability). */
import type { ResearchPaper } from './researchPapers';

export const PAPER_002: ResearchPaper = {
  id: 'db-r-2026-002',
  title: 'Deny-by-default authorization for tool-using agents: the Cortex kernel model',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-22',
  status: 'pending',
  tags: ['cortex', 'authorization', 'kernel', 'security'],
  abstract:
    'The Cortex kernel model for tool-using agents: a structured request, deny-by-default authorization, explicit and scoped authority, a policy gate at the effect boundary, brokered effects through a sole writer, and content-bound receipts. A restatement of the reference-monitor and least-privilege principles specialised for agent effects. No benchmark claims.',
  content: `> **Owner gate.** Design-descriptive working paper. It states an authorization model, its invariants, a decision procedure, and an evaluation protocol; it makes *no* benchmark, latency, or production-governance claim about a running Cortex deployment. Where the paper cites results, those are other authors' published figures, attributed by reference.

## Abstract

A capable agent decides *what* to attempt; it does not, by itself, decide what may become a committed effect. We describe Cortex, an execution kernel that sits beneath agent reasoning and owns that second decision. The kernel accepts a structured request; refuses by default; requires an explicit, scoped grant; evaluates policy at the point where the concrete effect is known; routes any allowed effect through a single broker that is the sole writer of controlled state; and returns a content-bound receipt for every outcome, allowed or denied. This is a specialisation of two classical ideas — the *reference monitor* and *least privilege* — to the setting where the principal proposing effects is a probabilistic model.

## 1. Introduction

The question is not whether the agent is *smart* enough to choose a good action, but whether the system can guarantee that a proposed action becomes a committed effect **only** when it is explicitly authorized under current policy. When authority is implicit in tool access — "the model could call the tool, therefore it may" — reasoning quality or mere possession of a tool name silently become authorization. That substitution is the failure this kernel prevents.

This paper contributes: a **request contract** (§4); a **deny-by-default decision procedure** with a sole-writer commit path (§5); a set of **kernel invariants** (§6); a **content-bound receipt** structure (§7); and a mapping to classical and contemporary access-control work plus an **evaluation protocol** that relies on deterministic checks (§8–§9).

## 2. Threat model and assumptions

The agent is *capable but not trusted with authority*: it may propose any operation, including ones it should not perform, and produce fluent justifications. The kernel must be correct even if the agent is wrong, confused, prompt-injected, or optimising for task completion at the expense of a constraint. It must resist: authority implied by tool availability; a persuasive argument standing in for a grant; an effect authorized against stale context then committed after the evidence is invalid; and a parallel write path that bypasses the boundary. The trusted computing base — the decision procedure, the broker, the receipt store — must be small, testable, and auditable. Out of scope: OS-level sandbox escape, compromise of the broker's credentials, supply-chain compromise of the kernel binary.

## 3. System model and notation

A *request* \`r\` carries an *actor*, an *intent* (operation class), a *target*, a *context*, and *presented authority*. A *grant* declares an operation set and target scope. A *policy* \`P\` is a predicate evaluated at the effect boundary. The *broker* \`B\` is the single component permitted to perform controlled effects. The kernel decides \`authorize(r, g, P) → {ALLOW, DENY}\`; ALLOW proceeds through \`B\`, DENY (including absence of a decision) proceeds to a refusal; both produce a receipt.

## 4. The request contract

A free-form model message is not itself an execution contract. The request envelope structures, before execution, the fields the decision procedure consumes:

\`\`\`
request := {
  actor:     principal proposing the operation
  intent:    operation class (e.g. write.customer_note)
  target:    concrete object + scope of the effect
  context:   state / evidence the proposal was formed against
  authority: the grant presented as covering this request
}
\`\`\`

## 5. The authorization decision procedure

Seven mechanisms compose one controlled path: (1) request envelope; (2) **deny by default**; (3) **explicit authority**; (4) the **policy gate** at the effect boundary; (5) **brokered tools**; (6) **sole-writer commit**; (7) **execution receipts**. The conceptual kernel path is small:

\`\`\`
decision = authorize(request, authority, policy)

if decision != ALLOW:
    return receipt(request, decision, no_effect)   # refusal is still receipted

result = tool_broker.execute(request.operation)    # sole writer performs the effect
return receipt(request, decision, result)          # bind proposal, decision, outcome
\`\`\`

Two properties are load-bearing. The policy gate is evaluated *at the effect boundary*: authorizing against intent alone permits an operation to be committed after its authorizing evidence has gone stale. And the commit path is a *sole writer*: if any other path could write controlled state, the decision would be advisory.

## 6. Kernel invariants

- **INV-1 Default deny.** A request is denied unless sufficient authority is established.
- **INV-2 Explicit scope.** Authority applies to declared operations and targets, not general intent.
- **INV-3 Brokered effects.** Authorized execution crosses the effect boundary through the broker.
- **INV-4 Sole writer.** The broker is the only component permitted to commit controlled state.
- **INV-5 Decision before effect.** Authorization completes before a requested write is committed.
- **INV-6 Receipt after decision.** Allowed, denied, and failed requests all return evidence of their path.

## 7. Execution receipts

A receipt binds, for one request, the proposal, the decision and the policy it was evaluated under, the writer identity, and the observed outcome:

\`\`\`
receipt := {
  request_ref:  the exact proposal (actor, intent, target, context)
  decision:     ALLOW | DENY, with the policy reference evaluated
  writer:       that the controlled commit path stayed with the broker
  outcome:      whether an effect occurred, and the resulting state ref
}
\`\`\`

Because a receipt is produced for a denial as well as a success, the log distinguishes "refused" from "silently did nothing" — a distinction black-box outcome checking alone cannot always make.

## 8. Relationship to classical and contemporary work

The invariants restate the *reference-monitor* concept — always invoked, tamper-resistant, small enough to verify [1] — and *least privilege* [2], applied to agent effects. Recent work brings these to LLM agents: programmable privilege control (Progent) over tool names/args/context [4]; control/data-flow separation (CaMeL) mediating effects through a capability interpreter [5]; policy engines (OPA [6], Cedar [7]); per-worker identity (SPIFFE [8]) and signed step metadata (in-toto [9]). Cortex's contribution is the specific composition presented as a kernel with stated invariants.

## 9. Evaluation methodology (no results claimed)

The kernel is evaluated by deterministic checks, not a model's opinion. A conforming suite establishes, per mechanism: default deny (missing/invalid authority → DENY, no write, checked against the system of record); explicit scope; decision-before-effect freshness (revoke the grant between decision and commit → effect must flip allow→deny); sole writer (any non-broker commit fails closed); and receipt completeness. This is a black-box outcome oracle plus a grey-box process oracle in the sense of [3]; deterministic evidence decides pass/fail and no model vote overrides an executable contradiction.

## 10. Limitations and non-claims

- The kernel enforces whatever policy it is given; an incorrect policy authorizes the wrong effects.
- Per-request authorization is necessary but not sufficient: valid operations can compose into an invalid sequence.
- Moving authority out of the agent relocates the root of trust to the policy, broker, and receipt store.
- No live production-governed runs claimed; composition status is tracked separately [10].

## References

1. Anderson, J. P. *Computer Security Technology Planning Study* (reference-monitor concept). ESD-TR-73-51, USAF, 1972.
2. Saltzer, J. H.; Schroeder, M. D. "The Protection of Information in Computer Systems" (least privilege). *Proc. IEEE* 63(9), 1975.
3. Pujan; Design Bakery. *Black-box and grey-box validation of autonomous agent work*. db-r-2026-004, 2026 (pending).
4. Shi et al. "Progent: Programmable Privilege Control for LLM Agents." arXiv:2504.11703, 2025.
5. Debenedetti et al. "Defeating Prompt Injections by Design (CaMeL)." arXiv:2503.18813, 2025.
6. Open Policy Agent Project. Documentation (decision / enforcement separation).
7. Cutler et al. "Cedar: A Language for Expressive, Fast, Safe, Analyzable Authorization." arXiv:2403.04651, 2024.
8. CNCF. "SPIFFE / SPIRE" (workload identity). Project documentation.
9. in-toto Project. Signed supply-chain / step metadata.
10. Pujan; Design Bakery. *Cortex reliability kernel: composition status and evidence boundaries*. db-r-2026-001, 2026 (pending).`,
  bibtex: `@techreport{db-r-2026-002,
  title  = {Deny-by-default authorization for tool-using agents: the Cortex kernel model},
  author = {Pujan}, institution = {Design Bakery}, year = {2026}, month = {7},
  number = {db-r-2026-002}, note = {Working paper; pending owner approval; no numeric claims.}
}`,
};

export const PAPER_003: ResearchPaper = {
  id: 'db-r-2026-003',
  title: 'Mechanically constraining an LLM orchestrator: control-plane authority and a same-family bias firewall',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-22',
  status: 'pending',
  tags: ['cortex', 'orchestration', 'bias', 'evaluation'],
  abstract:
    "The orchestrator is the most privileged component of a multi-agent system. Rather than debias a probabilistic planner, remove its authority: the model proposes and a deterministic controller owns state, permissions, retries, and commits. A same-family bias firewall makes a model's judgement of its own family advisory-only, with provenance-preserving blinding. Some 2026 arXiv identifiers are AI-suggested and unverified.",
  content: `> **Provenance & citation note.** Design-descriptive working paper; it asserts no benchmark result for any deployment. Where results are quoted (e.g. AgentSpec, CaMeL) they are other authors' published figures. Production-system references (Temporal, Durable Functions, Step Functions, OPA, Cedar, SPIFFE, in-toto) are solid; several 2026 arXiv identifiers are AI-suggested and **UNVERIFIED** and must be checked before approval.

## Abstract

The orchestrator is frequently the most fragile and privileged component of an AI-agent system: it determines which workers run, what they receive, when retries occur, whether outputs are accepted, when execution terminates, and which actions reach external systems. Giving those responsibilities to a probabilistic model creates structural risks. Recent studies indicate that many multi-agent failures arise from orchestration, specification, handoff, verification, and termination problems rather than insufficient model intelligence, and that the harness can materially change behaviour even when the model is held constant [1, 2].

> Probabilistic models propose work. A deterministic controller owns state transitions, permissions, retries, budgets, verification, and commits.

## 1. Evidence that orchestration is a major failure source

**1.1 Multi-agent failures are often structural.** MAST examined five frameworks across 150+ tasks and identified 14 recurring failure modes; simple prompt improvements did **not** eliminate them [1]. **1.2 Harness design changes performance.** Harness-Bench evaluated model-plus-harness combinations on 106 tasks / 5,194 trajectories and found substantial differences by harness configuration, not merely by model [2]; SWE-agent found a purpose-built interface materially improved performance [3].

## 2. The critical design error

A common architecture gives one LLM the whole pipeline, combining five authorities: **planning** (what should happen), **scheduling** (what runs next), **information** (who sees what), **evaluation** (whether work is acceptable), and **effect** (durable changes). A single probabilistic component should not hold all five. "Always run tests before finishing" is a behavioural *request*, not an enforced invariant.

## 3. The strongest production precedent

- **Azure Durable Functions:** orchestrator code must be deterministic; I/O lives in separately scheduled activities [4].
- **Temporal:** workflow logic deterministic; external calls belong in Activities; event history resumes without repeating recorded decisions [5].
- **AWS Step Functions:** workflows as state machines with explicit retries, catches, timeouts [6].

## 4. Planner versus orchestrator

An **LLM planner** may decompose a task, propose a workflow, and request a bounded replan — it emits a *proposal*. A **deterministic controller** validates the plan, owns the state machine, issues scoped capabilities, enforces budgets, invokes verification, and authorizes commitment — no natural-language reasoning in its path.

## 5. Recommended capability boundaries

The **planner** may read the task contract, propose a typed task graph, select registered roles, and request predefined transitions / bounded retries. It **must not** execute shell, write files, call APIs directly, hold credentials, mint capabilities, modify policy, raise budgets, change its own prompt/model, approve its own plan, verify its own result, read hidden tests, or commit state. **Workers** get temporary scoped capabilities and cannot delegate authority directly. A **verifier** emits findings but cannot modify candidates or issue commit authority. The **committer** is a small deterministic service: verify digest → checks → authorization → unchanged target → commit → record.

## 6. Mechanical gates supported by research

- **Typed plan gate.** A validator rejects unknown node types, undeclared tools, cycles, missing verification, illegal data flows; Agentproof statically verifies workflow graphs [7].
- **Runtime rule gate.** AgentSpec prevented >90% of unsafe code-agent executions at ms overhead — but enforces only the rules that exist [8].
- **Least-privilege tool gate.** Progent — fine-grained deterministic policies over tool names/args/context [9].
- **Control/data-flow separation.** CaMeL — trusted control flow vs untrusted data, 67% of AgentDojo with its guarantees [10].
- **Trusted monitoring & deferral.** AI-control wraps an untrusted model with monitoring [11]; monitoring can be defeated by adaptive attacks while *deferring critical actions to a trusted policy* stayed robust [12].
- **Commit-time authorization.** Re-check authorization immediately before a durable effect; a fail-closed commit boundary rechecks freshness / causal-dependency / eligibility [13].

## 7. A bounded orchestration state machine

\`\`\`
RECEIVED → PLAN_PROPOSED → [mechanical plan validation] → PLAN_APPROVED
  → WORK_DISPATCHED → WORK_COLLECTED → VERIFICATION_RUNNING
  → { PASS → COMMIT_READY | REPAIRABLE → REPLAN_ALLOWED | HARD_FAIL → ABORTED }
REPLAN_ALLOWED → { budget → PLAN_PROPOSED | exhausted → ESCALATED }
COMMIT_READY → [commit-time authorization] → HUMAN_REVIEW → { approve → COMMITTED | reject → ABORTED }
\`\`\`

The LLM cannot set the authoritative state; it emits \`{requested_transition, reason_code, evidence_refs}\` and the controller decides legality.

## 8. Mechanical efficiency controls

Per-stage budgets the orchestrator cannot modify. Progress predicates: \`same state + same action + no new evidence = loop detected\`. Retry classes by failure type. Limit delegation depth (≤2), active workers (≤5), replans (≤2), reviewer loops (≤3). Use the simplest sufficient architecture — MAST found adding agents can add coordination failures without adding capability [1].

## 9. Recommended production stack

Task-contract compiler → LLM planner (read-only activity) → typed plan validator → Temporal/Durable Functions/Step Functions → policy engine (OPA/Cedar [15, 16]) → scoped worker identity (SPIFFE [17]) → sandboxed worker → independent verifier → commit-time authorization → sole committer → attested result (in-toto [18]). LangGraph gives graphs/checkpoints [19] but its nodes run arbitrary functions, so it is **not by itself a non-bypassable authority boundary**.

## 10. Public benchmarks

MAST [1]; Harness-Bench [2]; Terminal-Bench 2 [20]; τ-bench / τ²-bench [21]; AgentDojo [22]; Agent Security Bench [23]; ControlArena [24].

## 11. Strict critique

Mechanical gates enforce only *encoded* properties. Restriction reduces flexibility. Fine-grained policy can explode. Moving authority out of the LLM relocates but does not delete the root of trust. Valid actions can compose into an invalid sequence. Monitoring can be evaded [12]. Human gates become ceremonial if the reviewer cannot see the exact diff and skipped steps. Benchmark improvement is not production proof.

## 12. Central recommendation

The practical answer is not to make the orchestrator sufficiently obedient — it is to ensure disobedience has limited consequences.

> The orchestrator may decide what it believes should happen next. It must not decide whether it is permitted to happen next.

## References

1. Cemri et al. "Why Do Multi-Agent LLM Systems Fail?" NeurIPS D&B 2025. arXiv:2503.13657.
2. Yao et al. "Harness-Bench." arXiv:2605.27922, 2026 (UNVERIFIED).
3. Yang et al. "SWE-agent: Agent-Computer Interfaces…" NeurIPS 2024. arXiv:2405.15793.
4. Microsoft. "Durable Task Programming Model / Orchestrator Code Constraints." Microsoft Learn.
5. Temporal. "Workflows, Determinism, Activities, Versioning." Platform docs.
6. AWS. "Step Functions: Task States, Retry, Catch, Timeout." AWS docs.
7. Xavier et al. "Agentproof: Static Verification of Agent Workflow Graphs." arXiv:2603.20356, 2026 (UNVERIFIED).
8. Wang, Poskitt, Sun. "AgentSpec." arXiv:2503.18666, 2025.
9. Shi et al. "Progent: Programmable Privilege Control for LLM Agents." arXiv:2504.11703, 2025.
10. Debenedetti et al. "Defeating Prompt Injections by Design (CaMeL)." arXiv:2503.18813, 2025.
11. Greenblatt, Shlegeris, Sachan, Roger. "AI Control." ICML 2024. arXiv:2312.06942.
12. Kutasov et al. "Evaluating Control Protocols for Untrusted AI Agents." arXiv:2511.02997, 2025 (UNVERIFIED).
13. Santos-Grueiro. "Temporary Authority, Permanent Effects." arXiv:2607.10487, 2026 (UNVERIFIED).
14. Liu, Zhao, Xu. "Utility-Guided Agent Orchestration." arXiv:2603.19896, 2026 (UNVERIFIED).
15. Open Policy Agent Project. Documentation.
16. Cutler et al. "Cedar." arXiv:2403.04651, 2024.
17. CNCF. "SPIFFE / SPIRE." Project documentation.
18. in-toto Project. Project documentation.
19. LangChain. "LangGraph." Documentation.
20. Merrill et al. "Terminal-Bench." arXiv:2601.11868, 2026 (UNVERIFIED).
21. Sierra Research. "τ-bench / τ²-bench."
22. Debenedetti et al. "AgentDojo." NeurIPS D&B 2024. arXiv:2406.13352.
23. Zhang et al. "Agent Security Bench." ICLR 2025. arXiv:2410.02644.
24. UK AISI + Redwood Research. "ControlArena."`,
  bibtex: `@techreport{db-r-2026-003,
  title  = {Mechanically constraining an LLM orchestrator: control-plane authority and a same-family bias firewall},
  author = {Pujan}, institution = {Design Bakery}, year = {2026}, month = {7},
  number = {db-r-2026-003}, note = {Working paper; pending; some 2026 arXiv IDs unverified.}
}`,
};

export const PAPER_004: ResearchPaper = {
  id: 'db-r-2026-004',
  title: 'Black-box and grey-box validation of autonomous agent work',
  authors: ['Pujan', 'Design Bakery'],
  submitted: '2026-07-22',
  status: 'pending',
  tags: ['cortex', 'validation', 'agents', 'testing'],
  abstract:
    'Validating autonomous agent output without trusting the agent: a black-box outcome oracle over external state, a grey-box process oracle over invariants, and grey-box holdouts that receive real signatures (not implementations). A deterministic checker — never a model vote — decides pass or fail. A technical survey and position paper.',
  content: `> **Provenance note.** This is a technical survey and position paper. It reports no original benchmark experiment or production deployment; all quantitative findings are attributed to prior publications. References and numerical claims must be independently verified before owner approval. Citations were AI-suggested; several carry 2026 arXiv identifiers that must be confirmed before this paper is marked \`approved\`.

## Abstract

AI agents are difficult to evaluate because their behaviour emerges from multi-turn interaction, tool use, external state, retrieval, memory, orchestration, and probabilistic outputs. This paper distinguishes **black-box** validation (externally observable behaviour) from **grey-box** validation (selected internal information — tool trajectories, intermediate states, coverage, policy decisions). The two provide complementary evidence but cannot validate one another automatically. The central conclusion: they should be treated as independent evidence channels whose oracles, instrumentation, and failure modes must themselves be tested.

## 1. Introduction

A useful evaluation must answer two questions: (1) did the agent produce the correct externally observable result, and (2) did it reach that result through an acceptable process? The software-testing literature calls the difficulty of determining correctness the *test-oracle problem*: even when execution is fully observable, the evaluator may lack a complete definition of correct behaviour [1].

## 2. Definitions

### 2.1 Black-box validation
Evaluates a system through its externally observable interface. The validator observes inputs, final responses, external tool effects, database/filesystem state, and whether the task completed; it does not depend on internal prompts, source, or hidden reasoning.

\`\`\`
Initial state + User request → Agent system → Final response + external state → Outcome oracle
\`\`\`

AgentEval mines conversational workflow graphs and covered 23–38 boundaries per agent vs 12 for a prompt-only baseline [2].

### 2.2 Grey-box validation
Also uses selected internal information — tool calls, arguments, intermediate states, coverage, policy decisions.

\`\`\`
Agent system → { final response, tool trajectory, intermediate states, metadata } → Outcome oracle + process oracle
\`\`\`

AgentBoard's progress metrics correlated above 0.95 with human progress assessments [4].

### 2.3 White-box validation
Broad access to implementation; it risks validating what the system *claims* to do rather than what it actually does. Treated here as a complementary auditing method.

## 3. The case for black-box validation

**3.1 Implementation independence.** "The agent must not issue a refund without approval" can be tested regardless of provider or framework. **3.2 End-to-end evaluation.** τ-bench compares final database state against a goal state and introduced "pass^k" for repeated-run consistency [5]. **3.3 Resistance to implementation-specific gaming.** A hidden trajectory means the agent cannot pass by emitting expected trace labels.

## 4. Strict critique of black-box validation

**4.1 The oracle can be wrong.** An empirical analysis of SWE-bench Verified found that 7.8% of patches counted as correct nevertheless failed developer-written tests. Differential testing found behavioural discrepancies in 29.6% of plausible patches, and the combined weaknesses inflated reported resolution rates by 6.2 absolute percentage points [6]. **4.2 Correct outcome, incorrect cause.** A result may be correct accidentally. **4.3 Limited diagnosis.** A failure can show *that* a system is wrong without showing *why*. **4.4 Sparse coverage.** State-dependent boundaries may require specific earlier actions [2]. **4.5 Nondeterministic success.** Single-run accuracy overestimates reliability [5]. **4.6 Public benchmark contamination.** A high score can measure benchmark familiarity [7].

## 5. The case for grey-box validation

**5.1 Diagnosing where failure occurred.** A trace separates a wrong result into distinct causes. **5.2 Detecting accidental success.** A final-state oracle marks a task successful while a trajectory evaluator catches an unsafe shortcut. **5.3 Measuring partial progress.** AgentBoard's progress rate distinguishes systems with similar low final success [4]. **5.4 Coverage-guided test generation.** FuzzBench and Magma provide precedents [8, 9]. **5.5 Efficiency analysis.** OSWorld-Human found high-scoring agents often took far more steps than necessary [10].

## 6. Strict critique of grey-box validation

**6.1 Instrumentation is not ground truth.** A self-generated trace may be a convincing but false account. **6.2 The trajectory-equivalence problem.** Comparing against one "golden trajectory" rejects valid alternatives; specify invariants, not exact imitation. **6.3 Overfitting to the evaluator.** **6.4 Implementation coupling.** **6.5 Instrumentation can alter behaviour** (observer effect). **6.6 Exposure of sensitive information.**

## 7. Circular validation

\`\`\`
Model creates answer → Related model evaluates answer → Evaluation confirms shared assumptions → Treated as independent validation
\`\`\`

**7.2 Shared-oracle circularity.** One incorrect requirement feeds every layer. **7.3 LLM-as-judge bias.** MT-Bench found position, verbosity, and self-enhancement bias [11]; self-preference favours lower-perplexity outputs [12]. **7.4 Correlated model errors.** A study of 350+ models found substantial correlated errors across families [13]. **7.5 Adaptive holdout overfitting** [14]. **7.6 Benchmark gaming.** **7.7 Trace circularity** — trusting records generated by the component being evaluated.

## 8. Anti-circular validation design

1. Separate outcome and process oracles. 2. Prefer deterministic evidence. 3. Evaluate invariants, not exact trajectories. 4. Independently observe final state. 5. Blind model judges (conceal identity, reverse ordering, commit before seeing others). 6. Limit hidden-evaluation feedback; count every query. 7. Use metamorphic and differential testing. 8. **Test the evaluator** with deliberately defective cases — an evaluator never tested against known failures is not authoritative.

## 9. Publicly available benchmarks

τ-bench / τ³-bench [5]; AgentBoard [4]; AgentBench [15]; SWE-bench [6]; WebArena [16]; OSWorld / OSWorld 2.0 [17, 18]; BFCL [19]; AgentDojo [20]; Agent Security Bench [21]; AgentDyn [22]; FuzzBench [8]; Magma [9].

## 10. Production and open-source evaluation tools

Inspect AI [23]; LangSmith [24]; Braintrust [25]; Arize Phoenix [26]. These operationalise evaluation but do not prove the design is non-circular — observability is not validation.

## 11. Recommended evaluation protocol

- **Layer A — black-box outcome:** final completion, external state, side effects, repeated-run consistency.
- **Layer B — grey-box invariants:** required steps, forbidden actions, tool correctness, resource consumption.
- **Layer C — evaluator validation:** scoring, trace completeness, judge bias, contamination, holdout leakage.
- **Layer D — production validation:** sampled traces, independent outcomes, incident review, refreshed benchmarks.

\`\`\`
PASS = external outcome correct AND critical invariants satisfied
       AND evaluation infrastructure healthy AND repeated-run reliability acceptable
\`\`\`

Model consensus must not override a deterministic external-state failure or a critical invariant violation.

## 12. Proposed empirical evaluation

Measure the incremental value of each channel directly: run the same agents under four conditions — **A** black-box only, **B** grey-box only, **C** combined, **D** combined with evaluator fault injection — while injecting known failure classes (correct outcome via crash/shortcut; correct trace but wrong result; forged/incomplete trace; alternate valid trajectory; unauthorized access; duplicate non-idempotent call; delayed side effect; evaluator position bias; repeated hidden-set feedback; benchmark overfitting). Measure false-acceptance, false-rejection, critical-defect recall, time-to-diagnosis, cost, sensitivity to alternative trajectories, trace-omission detection, repeated-run reliability, and evaluator-bias rate.

> Does combining independently generated black-box and grey-box evidence detect more meaningful failures than either method alone, without producing unacceptable false rejection or cost?

## 13. Conclusions

Combining both is stronger than either alone, but the combination does not automatically solve circularity. The correct claim is not "black-box and grey-box validation prove that an agent is correct," but "together they create complementary evidence about outcomes and execution processes, provided that their oracles, instrumentation, benchmarks, and evaluators are themselves independently challenged."

## References

1. Barr, Harman, McMinn, Shahbaz, Yoo. "The Oracle Problem in Software Testing: A Survey." IEEE TSE 41(5), 2015. DOI: 10.1109/TSE.2014.2372785.
2. Lin et al. "Mining Workflow Graphs for Black-Box Boundary Testing of Conversational LLM Agents." arXiv:2607.06873, 2026.
3. Böhme, Pham, Roychoudhury. "Coverage-Based Greybox Fuzzing as Markov Chain." ACM CCS 2016.
4. Ma et al. "AgentBoard." NeurIPS D&B 2024. arXiv:2401.13178.
5. Yao, Shinn, Razavi, Narasimhan. "τ-bench." arXiv:2406.12045, 2024.
6. Yang et al. "Are 'Solved Issues' in SWE-bench Really Solved Correctly?" arXiv:2503.15223, 2025.
7. Zhang et al. "SWE-bench Goes Live!" arXiv:2505.23419, 2025.
8. Metzman et al. "FuzzBench." ESEC/FSE 2021.
9. Hazimeh et al. "Magma: A Ground-Truth Fuzzing Benchmark." arXiv:2009.01120, 2020.
10. Abhyankar, Qi, Zhang. "OSWorld-Human." arXiv:2506.16042, 2025.
11. Zheng et al. "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena." NeurIPS 2023. arXiv:2306.05685.
12. Wataoka, Takahashi, Ri. "Self-Preference Bias in LLM-as-a-Judge." arXiv:2410.21819, 2024.
13. Kim, Garg, Peng, Garg. "Correlated Errors in Large Language Models." ICML 2025. arXiv:2506.07962.
14. Dwork et al. "Generalization in Adaptive Data Analysis and Holdout Reuse." NeurIPS 2015. arXiv:1506.02629.
15. Liu et al. "AgentBench." ICLR 2024. arXiv:2308.03688.
16. Zhou et al. "WebArena." arXiv:2307.13854, 2023.
17. Xie et al. "OSWorld." NeurIPS 2024. arXiv:2404.07972.
18. Yuan et al. "OSWorld 2.0." arXiv:2606.29537, 2026.
19. Patil et al. "Berkeley Function-Calling Leaderboard." UC Berkeley.
20. Debenedetti et al. "AgentDojo." NeurIPS D&B 2024. arXiv:2406.13352.
21. Zhang et al. "Agent Security Bench." ICLR 2025. arXiv:2410.02644.
22. Li et al. "AgentDyn." arXiv:2602.03117, 2026.
23. UK AI Security Institute. "Inspect AI" / "Inspect Evals."
24. LangChain. "LangSmith Trajectory Evaluations and Agent Evals."
25. Braintrust. "Systematic Evaluation, Trace Scorers, and Online Scoring."
26. Arize AI. "Phoenix: Open-Source AI Observability and Evaluation."`,
  bibtex: `@techreport{db-r-2026-004,
  title  = {Black-box and grey-box validation of autonomous agent work},
  author = {Pujan}, institution = {Design Bakery}, year = {2026}, month = {7},
  number = {db-r-2026-004}, note = {Technical survey / position paper; pending; citations to be verified.}
}`,
};
