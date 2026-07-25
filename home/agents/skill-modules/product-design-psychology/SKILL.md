---
name: product-design-psychology
description: Apply Wouter de Bres’s Product Design Psychology principles to design reviews, UX copy, flow optimization, and product decision-making.
argument-hint: "[target behavior/context/problem statement]"
---

Use this skill when a user asks for design decisions, UX improvements, flow copy edits, roadmap triage, or research interpretation. The core assumption is: most design failures are psychological miscalibration, not implementation bugs.

## Required prep
- Read the project context first: audience, key task, and constraints (deadline, risk, legal, accessibility, analytics goals).
- Prefer observing real user intent over internal assumptions before proposing changes.
- Always separate: **individual usability problems** vs **process/probability problems** (team/design system vs user behavior).

## High-level mental model (4 layers)

### 1) Designer’s mind (you)
- Designers overfit to themselves unless they deliberately design for difference.
- Expertise can become blindness (“I know this; they don’t”).
- Ego and criticism often become protection systems, not learning systems.
- Creativity is repeatable and deliberate, not sudden inspiration.

### 2) Interface mechanics (what the screen does)
- Visual structure communicates before text.
- Defaults, ordering, and framing are already steering behavior.
- Click affordances must be visible, especially for novice and stressed users.
- Too much choice or too much friction creates abandonment.
- Memory support beats memorability: make next actions obvious, not implied.

### 3) User mind (before product)
- Users do not arrive with abstract task goals; they arrive with outcome goals.
- Present-bias, habits, emotion-first reactions, and cognitive load shape behavior.
- People often do not act on stated intention.
- New behavior needs immediate value and low first cost.

### 4) Organization mind (what gets shipped)
- Power dynamics and meeting dynamics can drown out evidence.
- Metrics drift from meaning when optimized as targets.
- Roadmaps and sunk cost can override user evidence.
- Research must be designed to disconfirm, not only confirm.

## Chapter-level decision checks (quick map)

When reviewing any design artifact, run through these checks in this order:

1. **False consensus / own perspective drift**
   - Am I treating my preference as user evidence?
   - Did I validate with someone who does not share my mental model?

2. **Confidence distortion**
   - Where am I overconfident because I have seen this design too long?
   - What did we remove to make this feel safer instead of clearer?

3. **Ego protection**
   - Did criticism trigger defensiveness instead of testing?
   - What specific data would make me change direction?

4. **Visibility of action**
   - Is the primary action clearly actionable (size, contrast, affordance, hierarchy)?
   - Can a first-time user identify what to do in under 2 seconds?

5. **Cognitive load budget**
   - Can each screen communicate in one glance?
   - Does this path require users to hold too many things in mind?

6. **Pattern consistency**
   - Is this deviation from pattern intentional and explained?
   - Do we break learned flow where consistency is more valuable than novelty?

7. **Rememberability**
   - If users return after 2 weeks, can they still find and run this flow?
   - Are labels and entry points repeated where memory would be needed?

8. **Goal-gradient leverage**
   - Do progress signals accelerate task completion honestly, or create artificial urgency?

9. **Outcome-first design**
   - What exact outcome is the user trying to achieve?
   - Are we optimizing completion of an intermediate task while outcome drops?

10. **Attention economics**
    - Is this message or feature likely to be filtered out in context overload?
    - Can it become obvious at the moment of need?

11. **Decision hygiene**
    - Did we confuse “more options” with “more value”?
    - Are choices grouped by decision need, not feature breadth?

12. **Decision traps in the team**
    - Are we defaulting to boss/reviewer opinion over evidence?
    - Are meeting dynamics changing what is considered “truth”?

13. **Metric hygiene**
    - Which metric currently stands in for user outcome?
    - What is the risk it is being optimized at the cost of user trust/value?

14. **Problem framing hygiene**
    - Could we be solving the wrong problem under a plausible brief?
    - If assumptions change, what would disprove our current framing?

15. **Ethical boundary check**
    - If users understood every mechanism in this experience, would they still feel helped, not tricked?

## Applied templates

### Before approving a flow
- “What is the first emotional reaction likely to be?”
- “What one default can reverse intended behavior?”
- “Where is the biggest friction point?”
- “Which action is least discoverable?”
- “What can be delayed to reduce anxiety and improve trust?”

### Before adding a new feature
- Add only if it reduces one of:
  - user effort,
  - uncertainty,
  - perceived risk,
  - or time-to-outcome.
- If it only adds capability or differentiation language, defer and benchmark first.

### Before shipping a redesign
- Validate value transfer, not just visual preference.
- Expect short-term resistance (loss aversion).
- Stage rollout with explicit comparison to old outcome, not just old style.

### For research planning
- Predefine one finding that would change your mind.
- Recruit outside your team’s favorite persona cluster.
- Track behavior over time, not just stated preference.
- Flag evidence that contradicts the initial thesis first.

### For team/process checkpoints
- Explicitly record who can change direction and under what evidence.
- Force a “what did we learn we were wrong about?” artifact before major shipping.
- Keep a short decision log: context, assumption, evidence, decision, reversal criteria.

## One-line heuristics you can use in reviews
- “Design is loaded before first click.”
- “Defaults are never neutral.”
- “If it feels obvious to the designer, it is probably not obvious to everyone.”
- “If users can’t see what to do, they can’t do what you built.”
- “No metric is a user.”
- “A better flow can still fail if it asks users to give up something they already have.”
- “Use persuasive psychology only when it helps user agency, never to bypass consent.”

## What to avoid
- Don’t use “intuitive” as a substitute for evidence.
- Don’t ship by hierarchy or attendance pressure.
- Don’t confuse momentum effects with honest progress.
- Don’t treat a clean UI as proof of usability.
- Don’t use research as a post-hoc shield for a decided path.

Use this skill as a judgment framework, not a rigid doctrine: the goal is less friction, less coercion, and better alignment between design intent and lived user behavior.
