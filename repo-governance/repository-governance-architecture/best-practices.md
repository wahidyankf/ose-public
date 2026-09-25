---
description: Checklists for creating conventions, practices, agents, workflows, and skills
when_to_use: Use before creating a new convention, practice, agent, workflow, or skill.
---

# Best Practices

## When Creating New Conventions

1. **Check principles first** - Which principle does this implement?
2. **Add traceability section** - "Principles Implemented/Respected"
3. **Document in Conventions Index** - Add to `conventions/README.md`
4. **Consider agent impact** - Which agents need to enforce this?
5. **Consider agent skills delivery** - Should this be packaged as a Skill for agents?

## When Creating New Development Practices

1. **Check both principles AND conventions** - What do you implement/respect?
2. **Add both traceability sections** - Principles AND Conventions
3. **Document in Development Index** - Add to `development/README.md`
4. **Consider automation** - Git hooks? AI agents?
5. **Consider agent skills delivery** - Should this be packaged as a Skill for agents?

## When Creating New Agents

1. **Identify governing layers** - Which conventions/practices does this enforce?
2. **Define atomic responsibility** - One clear purpose
3. **Choose tools carefully** - Match to task (Read-only, Write, Edit, Bash, Web)
4. **Document in Agents Index** - Add to `.agents/agents/README.md`
5. **Reference relevant agent skills** - Which agent skills will help this agent?

## When Creating Workflows

1. **Identify step sequence** - What agents, procedures, and/or nested workflows are needed, and in what order?
2. **Define termination criteria** - When does workflow complete?
3. **Add approval checkpoints** - Where does user review?
4. **Document state management** - How does state flow between steps?
5. **Check for circular nesting** - Ensure no workflow calls another that calls back to itself

## When Creating agent skills

1. **Identify service need** - What knowledge/task do agents need repeatedly?
2. **Choose delivery mode** - Inline (knowledge) or fork (delegation)?
3. **Package clearly** - SKILL.md with purpose, patterns, examples
4. **Reference in agents** - Update agent frontmatter with new skill
5. **Avoid governance claims** - agent skills serve, don't govern
