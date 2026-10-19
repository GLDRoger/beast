---
name: ai-features
description: Build and judge features that embed AI models: evals and baselines, prompt changes, model choice by cost and quality, prompt caching, streaming, and failure handling. Use when an application calls an LLM or when comparing models or prompts.
---

# AI features

## Ask first

Before choosing, ask the user (question tool, recommendation first):
- whether to make sure caching is set up right (prompt caching, response caching where outputs repeat);
- whether to use economical or balanced models for this feature, or the strongest.

## Evals before opinions

- Build a small eval set from real inputs: typical cases, hard cases, and known failures. Twenty good cases beat two hundred synthetic ones.
- Score with code where the answer is checkable (exact match, schema validity, a test). Use a model judge only for open-ended output, with a written rubric, and spot-read its verdicts.
- Record a baseline (current prompt and model) before any change: accuracy, cost per run, latency.
- Change one thing at a time (prompt, model, parameters) and rerun the whole set. Report the deltas, with the cases that flipped.
- Keep the eval runnable with one command, so a prompt change is checked like a code change.

## Cost and caching

- Put stable content (system prompt, tools, long documents) first and the variable part last, so the provider's prompt cache can hit. Check the response's cache usage fields to confirm hits.
- Pick the cheapest model that passes the eval, not the biggest one available. Route easy calls to a small model when the eval shows it holds up.
- Estimate monthly cost from real traffic: tokens per call, times calls.

## In the product

- Stream long responses. Handle timeouts, rate limits and refusals with a clear message and a retry path.
- Validate structured output against a schema; retry or fall back on failure instead of showing broken data.
- Never put secrets or other users' data into prompts or logs.
