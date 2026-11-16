# Checking a flow beyond tests

Loaded from `SKILL.md` when a flow where a bug costs most needs more than example tests. A test checks the cases someone wrote. A property test checks a rule against many generated inputs. A model checker checks every ordering of steps in a small model. Each is only as good as what it describes, so most of this file is about keeping the check honest.

## Choose the target

Pick a promise the code makes where a break harms users and tests rarely reach the case that breaks it: money moves exactly once, a private record never reaches the wrong viewer, a message is never silently dropped, a retry never repeats a side effect, a scheduled job fires once per slot across restarts. Choose the strongest target in the repo, not the easiest to verify. If the user named a flow or a bug, start there.

## Let the question pick the check

| Question | Check |
|---|---|
| Does this input give that output? | A plain test. |
| Does a rule hold for every input of a pure function: a viewer filter, a date rule, a parser round trip, a count against its list? | A property test with the repo's generator library (fast-check, Hypothesis, proptest, jqwik, or whatever is already installed). |
| Can steps from several actors, retries, restarts, or timeouts happen in a bad order? | A model checker over a small model of the design. TLA+ with TLC is the default in any language. |
| Does the code itself behave for every input: overflow, memory safety, a data-structure invariant? | A verifier that runs on the code (Kani, Dafny, CBMC, and the like). If none runs on this language, say so and use generated inputs against the real code instead of a hand-written model. |
| Must it hold at every size, where a bound is not enough? | A proof assistant. Rarely worth its cost; say why when you pick it. |

Prefer a tool the repo's developers can install and run, and tell the user why you chose it. A new tool is a new dependency: check need, provenance, and maintenance, and pin the version.

## Property tests

- Useful kinds: an invariant that always holds; a round trip (`parse(format(x)) == x`); the implementation against a small obviously-correct reference; a relation between two answers (the count shown equals the length of the list the same viewer gets; filtering twice equals filtering once); never crashes on any input.
- When a bug came through an entry point (an RPC, a route, a tool call), drive the property through that entry point, not a helper below it.
- Keep each shrunk failing case as a plain regression test beside the property.
- Fix the seed on failure and print it. A property that fails one run in fifty is a finding, not a flake.

## TLA+ models

- Write each rule the user agreed to as an `INVARIANT` (true in every state) or a `PROPERTY` (something eventually happens: "the payment ends sent or reported failed"). If the model has no variable for a rule, add one.
- Write `Next` as a disjunction of named actions in product words: `Next == YouApprove \/ BankDeclines \/ AppRestarts`. Traces and charts then read as steps.
- One indivisible step in the code is one action in the model, no larger. If the code reads, awaits, then writes, the model has two actions, and another actor can act between them. Note the file and function behind each action.
- Model what the environment does wrong: crashes and restarts, retries, duplicate or reordered delivery, timeouts, a second device.
- Keep constants small (two users, two messages, three retries). Most ordering bugs show at small sizes. Add a `CONSTRAINT` when a counter can grow without end.
- TLC reports a deadlock at any state with no step out, including a correct end state. Add an action that is enabled only in end states and changes nothing (`Done == phase \in {"sent", "failed"} /\ UNCHANGED vars`), or run with `-deadlock` to turn the check off when there is nothing else to find.
- Running TLC needs Java 11 or later and `tla2tools.jar` from the releases of `tlaplus/tlaplus` on GitHub (MIT). Keep the jar outside the repo or in a tools cache, and record the version. A typical run: `java -XX:+UseParallelGC -cp tla2tools.jar tlc2.TLC -workers auto -config Spec.cfg Spec.tla`. For charts, see the statecharts module.

## Able to fail

A check you have never seen fail proves nothing. Show each property failing on a broken variant of the real code it guards, such as a removed check or two steps swapped, and on the real past bug when there was one. Then restore the code and confirm the check is back where it started.

## Findings stay findings

- Never weaken a property, drop a variable, or shrink the model to get a pass. Do not change product code unless asked.
- When the code breaks a rule, report the rule in one sentence, the counterexample as numbered product steps ("1. You approve the payment. 2. The app restarts before it records the send. 3. You approve again. 4. The payment goes out twice."), and the harm.
- Replay the counterexample against the real code, one step per action, as a test or a live repro. If a step cannot happen in the code, the model is wrong: fix it and say what was wrong.

## Leave a check the next agent will run

Write a project-local skill or doc beside the model with: the property and the harm in one sentence each; the files and functions it covers; the bounds and assumptions; one command to run it; the tool version; and the commit at which someone last confirmed the model describes the code (the sync commit). An agent changing covered code reruns the check and moves the sync commit only after confirming the model still matches.

## Keeping a model true to the code

When covered code changed without a recheck, a passing model can describe code that no longer exists. That pass is the dangerous case.

1. Run the check as it is and record the result.
2. Read every change to the covered files since the sync commit, including code that moved or was renamed and new code that writes the guarded state.
3. Sort each change: no effect on what the model describes; the model no longer matches the code (a step split in two, a new path to the guarded state, a new value range); the promise changed on purpose (cite the evidence: tests, commit message, doc); or the promise may be broken.
4. Update the model from the code before rerunning, not from what makes it pass. Change a property only for a promise that changed on purpose, and write down the old and new wording.
5. Rerun. On a pass, break the new code the way the property guards against and confirm the check catches it. On a fail, replay the counterexample against the real code to tell drift from a bug.

Give each check one outcome: in sync, updated, bug (name the commit that introduced it), or blocked (say why). Put verification updates in a change of their own, separate from any product fix.

## Report

In plain words: what was verified, with which tool and why, under which bounds; each finding as product steps with its harm; the chart (statecharts module); the command to rerun; and what the check does not cover.
