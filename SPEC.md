# Facet specification

## Problem

Coding agents load full MCP tool schemas into every request. Tool count scales with enabled servers; schema tokens are paid on every turn.

## Approach

Facet treats tool selection as **budgeted routing**:

1. **Cluster** tools by inferred capability from name/namespace
2. **Score** each tool against the task via token overlap on name, description, and schema property keys
3. **Distill** schemas by trimming descriptions and nonessential schema metadata
4. **Route** greedily by score until the token budget is reached, with a minimum floor count

## Outputs

- `selected[]` — tools to expose this turn
- `deferred[]` — tools omitted to save tokens
- `reasons{}` — per-tool routing rationale for debugging

## Non-goals (v0.1)

- Replacing MCP transport or proxying LLM requests
- Semantic embedding models (keyword scoring only in v0.1)
- Automatic MCP server installation

## Evaluation

See `eval/runner.ts` — fixture-based routing accuracy against expected tool inclusion/exclusion.
