# Issue tracker: GitHub

Issues and PRDs for this repository live as GitHub issues. Use the `gh` CLI for all issue operations and infer the repository from the configured Git remote.

## Conventions

- Create issues with `gh issue create`.
- Read issues and their comments with `gh issue view`.
- List work with `gh issue list` and the relevant label and state filters.
- Apply and remove triage state with `gh issue edit`.
- Close completed or rejected work with `gh issue close` and a concise explanatory comment.

## Pull requests as a triage surface

External pull requests are not treated as incoming feature requests and are excluded from the issue-triage queue.

## Skill behavior

When a skill says to publish to the issue tracker, create a GitHub issue. When a skill says to fetch a ticket, read the corresponding GitHub issue and its comments.
