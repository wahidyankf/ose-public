---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

## Mental model

Security work has a useful loop: name the asset and boundary, enumerate plausible abuse, prioritize
the harm, choose layered controls, and test the result. A control is not evidence because it exists;
it is evidence when the intended input succeeds and the unsafe condition is rejected safely.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
flowchart LR
    accTitle: Mental model
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Assets and boundaries, STRIDE and risk, Layered controls, Test and improve. Connections: Assets and boundaries to STRIDE and risk, STRIDE and risk to Layered controls, Layered controls to Test and improve.
    A["Assets and<br/>boundaries"]:::blue --> B["STRIDE and risk"]:::orange
    B --> C["Layered controls"]:::teal
    C --> D["Test and improve"]:::purple
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Example progression

- **Security foundations and application boundaries** (Examples 1–18) establishes the CIA triad,
  threat models, OWASP vocabulary, access control, injection, and validation.
- **Cryptography and identity** (Examples 19–38) separates reversible protection from verification,
  then connects passwords, signatures, TLS, OAuth/OIDC, JWTs, and sessions.
- **Hardening and secure delivery** (Examples 39–52) layers browser defenses, secrets, supply-chain
  controls, secure-SDLC gates, vulnerability assessment, and privacy into an engineering practice.

## Run the safe mechanisms

From `learning/code/`, create a virtual environment, install the pinned packages, and run the named
file in each code-bearing example. All inputs are fabricated and all keys are generated in memory.

```text
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 ex-22-23-passwords.py
```

Next: [Security foundations and application boundaries](./foundations.md) →
