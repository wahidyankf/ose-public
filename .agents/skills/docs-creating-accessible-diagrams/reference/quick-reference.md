# Accessible Diagrams — Quick Reference

**Verified Palette (Copy-Paste):**

```
Blue:   #0173B2 - Primary flow
Orange: #DE8F05 - Decisions, warnings
Teal:   #029E73 - Success, validation
Purple: #CC78BC - Special states
Brown:  #CA9161 - Neutral
Gray:   #808080 - Secondary, disabled
Black:  #000000 - Borders, text
White:  #FFFFFF - Text on dark
```

**Mermaid classDef Template:**

```
classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
classDef gray fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

**Required `classDef default` (every flowchart, graph, class, ER, and requirement diagram):** blue, or neutral when blue already
carries a meaning in the diagram.

```
classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Pre-commit Checklist:**

- [ ] Uses only verified palette colors
- [ ] Every flowchart, graph, class, ER, and requirement diagram declares a palette `classDef default`
- [ ] Every label line and edge label is 20 graphemes or fewer (split with `<br/>`)
- [ ] Black borders on all elements
- [ ] White text on dark fills
- [ ] Text labels on all nodes
- [ ] Shape differentiation used
- [ ] Palette comment included
- [ ] Tested in color blindness simulator
- [ ] Contrast ratios verified
- [ ] Works in light and dark modes
