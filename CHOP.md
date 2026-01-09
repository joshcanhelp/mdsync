# AI Agent Coding Best Practices

This document contains best practices for working with AI coding agents, organized by impact level. These techniques address two root causes of agent failure: storing state in the wrong place (volatile context vs. persistent storage) and inadequate feedback loops (no verification, no checkpoints, no review).

## Highest Impact (Adopt First)

### External Task State
Use git-backed external storage (Beads) for task state, not the agent's context window. Tasks should live as persistent files that survive session boundaries. When resuming work, the agent checks external state, sees which tasks are closed, gets the next ready task, and continues without re-explanation.

**Do this:**
- Store task state in `.beads/` directory or similar persistent storage
- Track task status, dependencies, and progress externally
- Resume with `continue epic <id>` patterns

**Don't do this:**
- Rely on context window for multi-session task tracking
- Trust compaction summaries to preserve task state
- Re-explain completed work each session

### Verification Before "Done"
Never trust an agent's self-report that work is complete. Require external verification: tests pass, lint passes, code committed. Use two-stage review: (1) spec compliance—did you build what was requested? (2) code quality—is the code good?

**Do this:**
- Run tests after every change
- Run linters before considering work complete
- Commit working code before marking tasks done
- Have a separate reviewer check spec compliance

**Don't do this:**
- Accept "done" without running verification
- Skip linting because "it compiles"
- Trust the implementing agent to review its own work

### Fresh Context Per Task
Dispatch a fresh subagent for each task. Context drift causes quality degradation—by message 50, the agent has forgotten coding standards. Each subagent starts clean, loads only its specialized context, does one job well.

**Do this:**
- Clear context between major tasks
- Use subagents for implementation, review, and specialized work
- Keep each subagent focused on one responsibility

**Don't do this:**
- Let context accumulate indefinitely
- Use the same polluted context for review that was used for implementation
- Expect quality to remain consistent over very long sessions

### Context Window Management
Stay under 40% context window utilization. Never exceed 75%. Clear context between phases. LLM performance degrades as context grows.

**Do this:**
- Monitor context utilization
- Use `/clear` between major work phases
- Combine with external state persistence so clearing doesn't lose progress

**Don't do this:**
- Let context fill up to 90%+ before acting
- Paste entire large files when summaries would suffice
- Keep failed attempts in context (they bias toward similar failures)

### TODO Systems for Task Tracking
Use TODO lists to prevent early stopping. The agent should maintain a visible list of remaining work. Re-inject TODOs at context head to keep them salient.

**Do this:**
- Start with a granular TODO list for each feature
- Include timestamps, branches, and outcomes in TODOs
- End with a verification step: "go over everything and verify quality"

**Don't do this:**
- Let the agent decide it's "done" without checking the TODO
- Use vague TODOs like "implement feature"
- Forget to update TODOs as work progresses

### Commit Checkpoints as Save States
Commit working code frequently, even if incomplete. Before any risky change, commit. Treat git commits as save states.

**Do this:**
- Commit after each working milestone
- Commit before attempting refactors or risky changes
- Use descriptive commit messages that explain the state

**Don't do this:**
- Make large changes without intermediate commits
- Attempt risky refactors on uncommitted work
- Wait until "everything is done" to commit

### Fail Fast, Retry Fresh
If the agent is struggling after 2-3 attempts at the same problem, clear context and restart with a differently-framed prompt. Failed attempts pollute context.

**Do this:**
- Recognize when iteration isn't working (2-3 similar failures)
- Clear context and reframe the problem
- Try a different approach rather than more of the same

**Don't do this:**
- Keep adding context hoping it will eventually work
- Let failed attempts accumulate (they bias subsequent tries)
- Assume more information always helps

## High Impact (Adopt When Ready)

### Structured Planning Pipeline
Use a formal pipeline: Brainstorming → Design Doc → Implementation Plan → Task Creation → Execution. Each stage has checkpoints where humans approve before proceeding.

**Do this:**
- Separate planning from execution
- Get human approval at stage boundaries
- Embed context in tasks so subagents don't need original documents

**Don't do this:**
- Jump straight to implementation without planning
- Let the agent auto-proceed through all stages
- Assume the agent remembers earlier planning discussions

### Three-Field Task Separation
Split task content across three fields:

| Field | Purpose | Content |
|-------|---------|---------|
| Description | What to do | Implementation steps, code snippets, file paths, testing commands |
| Design | Why and how it fits | Architecture context, relevant design decisions |
| Notes | Fallback references | Source document paths with line numbers |

### File Overlap Dependency Detection
Automatically infer dependencies by tracking which files each task modifies. If Task 4 and Task 5 both modify the same file, Task 5 depends on Task 4. This prevents parallel execution conflicts.

### Session End Protocol
Standardize session cleanup with a trigger phrase (e.g., "land the plane") that runs:
1. File issues for follow-up work
2. Run quality gates (tests, linters, builds)
3. Update issue statuses
4. Push to remote
5. Clean up git state
6. Suggest next task

### Scope Anchoring Before Execution
Before starting work, have the agent state what it will do and what it will NOT do.

**Example prompt:**
> Before making changes, tell me: (1) exactly which files you'll modify, (2) what changes you'll make, (3) what you will NOT touch or change.

### Incremental Verification
Don't let the agent write 10 functions and then test. Have it write one function, verify it works, then proceed.

**Do this:**
- Test each unit of work before moving on
- Verify complex logic step by step
- Catch errors early when they're easy to fix

**Don't do this:**
- Write an entire feature before any testing
- Debug compound errors from multiple functions
- Assume code works because it compiles

### Reference Implementation Anchoring
Point the agent to working examples of the pattern you want.

**Example prompt:**
> Follow the same pattern used in `users.ts` for pagination. The products endpoint should work identically.

## Medium Impact (Good Additions)

### Negative Examples in Instructions
Show the agent what NOT to do, not just what to do.

**Example:**
> When editing files, don't rewrite the entire file. Use targeted edits.
> - Bad: regenerating 500 lines to change 10
> - Good: replacing only the specific lines that need to change

### Error Message Forwarding with Context Stripping
When forwarding errors, include the error but strip noise. Don't paste 500 lines of stack trace—extract relevant frames and add one sentence of context.

**Do this:**
> Error in auth.ts:47 - "Cannot read property 'userId' of undefined"
> This happens when clicking submit on the login form with valid credentials.

**Don't do this:**
> [Paste entire 500-line stack trace without explanation]

### Explicit "Don't Know" Permission
Tell the agent it's okay to ask for clarification instead of guessing.

**Example instruction:**
> If you're unsure about something, say so and ask rather than guessing. It's better to ask a clarifying question than to make an assumption that's wrong.

### Two-Chat Workflow
Use a separate LLM chat for planning and exploration. Keep the execution session clean of meanderings. Bring only the condensed decisions to the coding session.

### Strict Mode for Tool Calls
Enable strict mode for tool calling when available. This prevents malformed tool calls through constrained decoding.

### Handling Tool Forgetting
Configure nudges for when the agent outputs plain text instead of calling tools. Send a reminder to use the appropriate tool.

## Lower Impact (But Useful)

### Token Budget Awareness
Be aware that agents have output token limits. For large changes, break into multiple explicit steps to avoid truncation.

**Example prompt:**
> First, show me the changes to imports and type definitions. Then I'll ask for the function implementations.

### Semantic Compression for Long Context
When including a lot of context, summarize aggressively but preserve structure.

**Instead of pasting 500 lines, write:**
> auth.ts exports: parseToken(string) → Token, validateToken(Token) → boolean.
> Token type has fields: value, expiry, userId.
> parseToken throws InvalidTokenError on malformed input.

### Explicit State Transitions
For stateful operations, have the agent state the before and after.

**Example prompt:**
> Before making this change, tell me: what is the current state, and what will the state be after your change?

### Diff Review Before Apply
For non-trivial changes, ask to see the diff before applying.

**Example prompt:**
> Show me the diff of what you're planning to change before making the edit.

### No Emoji
Don't use emoji in code, comments, or documentation unless explicitly requested.

### Skills as Structured Documentation
Skills are markdown files with instructions and code patterns. They're retrieved and loaded into context when relevant. You can create custom skills for domain-specific patterns.