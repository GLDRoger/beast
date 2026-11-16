# Vet a performance number

Use this whenever you produce a number someone will act on: a before/after for a change, a regression claim, the harness for a measured loop, or a choice between libraries or settings. Answer each question from a run, not from reading the code.

For a quick ballpark the user asked for, one run is enough: still check "did it error" and "did the work happen", and say it was one run. A choice between options is never a ballpark.

## Before running

- Write the sentence you expect to report, in the words you would ship ("export is 30% faster at p50 on the 60k-row dataset"). The questions below test that sentence.
- Read the measurement script: what it times, what it counts, what it ignores.
- Check the machine's load (`uptime`) and core count. If something else is busy and you cannot stop it, alternate the two sides so both see the same noise, and say so.

## Questions

1. **Why isn't it twice as good?** Name what bounds it: a core, a lock, the disk, the network, or the load generator itself. Find it with a profiler or system counters in a run you don't report, since profiling slows the work. If you can't name it, you don't yet know what you measured.
2. **Were both sides tuned?** Run each the way production does: release builds, production flags, the same versions, data, pools, and cache warmth. A side left on defaults means you compared settings, not code.
3. **Does it break a limit?** Do the arithmetic against disk and network bandwidth and core count. Removing a piece that takes 10% of the time can make the whole at most about 11% faster. A result past a limit measured a cache, a no-op, or a bug.
4. **Did it error?** Count failures and non-success responses, and check outputs are correct, not just present. Rejections are fast; retries and timeouts are slow.
5. **Does it reproduce?** At least five runs per side, alternating, reported as median and range. A gap smaller than the run-to-run spread is no measurable difference.
6. **Does it matter?** Measure the end-to-end path a user waits on, at realistic sizes, and report a micro result as its share of that path.
7. **Did the work happen?** Confirm it ran inside the timed region: the request reached the server, rows were written, results were used. Lazy code and timeouts produce numbers for work that never ran.

## Report

Lead with the verdict: faster, slower, no measurable difference, or inconclusive. Then the number with its unit, run count, range, and what bounds it ("p50 41 ms → 33 ms, median of 7 runs per side, range 32–35 ms after, bound by JSON parsing on one core"). Call it inconclusive when a side ran untuned, when you can't name what bounds it, or when questions 4 and 7 went unchecked, and say which.
