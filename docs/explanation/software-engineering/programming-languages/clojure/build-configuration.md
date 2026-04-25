---
title: "Clojure Build Configuration"
description: Authoritative OSE Platform Clojure build configuration standards (deps.edn, tools.build, Leiningen, Babashka)
category: explanation
subcategory: prog-lang
tags:
  - clojure
  - build-configuration
  - deps-edn
  - leiningen
  - tools-deps
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Clojure Build Configuration

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Clojure fundamentals from [AyoKoding Clojure Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/clojure/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Clojure tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines the build configuration standards for Clojure projects in OSE Platform. `deps.edn` + `tools.deps` is the modern preferred approach; Leiningen remains supported for legacy projects.

**Target Audience**: OSE Platform Clojure developers, DevOps engineers

**Scope**: deps.edn structure, aliases, tools.build (build.clj), Leiningen project.clj, Babashka scripts, REPL startup config, ClojureScript shared code

## Software Engineering Principles

### 1. Reproducibility First

**MUST** use exact version coordinates in `deps.edn` — no version ranges, no LATEST:

```clojure
;; CORRECT: Exact version pinning
{:deps {org.clojure/clojure {:mvn/version "1.12.0"}}}

;; WRONG: Version ranges or LATEST
{:deps {org.clojure/clojure {:mvn/version "[1.11,)"}}} ;; Non-reproducible
```

### 2. Explicit Over Implicit

**MUST** declare all aliases explicitly with clear `:doc` strings explaining their purpose.

### 3. Automation Over Manual

**MUST** define build tasks as code (`build.clj`, `bb.edn`) rather than ad-hoc shell commands.

### 4. Immutability Over Mutability

Build artifacts are immutable: each build produces a versioned, content-addressable JAR.

### 5. Pure Functions Over Side Effects

`tools.build` functions are data-driven — build configuration is pure data in `build.clj`.

## deps.edn Structure

**MUST** use this structure for all new Clojure projects:

```clojure
;; CORRECT: Full deps.edn structure for OSE Platform Clojure project
{:paths ["src" "resources"]

 :deps
 {org.clojure/clojure {:mvn/version "1.12.0"}

  ;; HTTP
  ring/ring-core {:mvn/version "1.12.2"}
  metosin/reitit {:mvn/version "0.7.2"}
  metosin/muuntaja {:mvn/version "0.6.10"}

  ;; Database
  com.github.seancorfield/next.jdbc {:mvn/version "1.3.939"}
  org.postgresql/postgresql {:mvn/version "42.7.3"}

  ;; System lifecycle
  integrant/integrant {:mvn/version "0.13.1"}

  ;; Serialization
  cheshire/cheshire {:mvn/version "5.13.0"}

  ;; Utilities
  org.clojure/tools.logging {:mvn/version "1.3.0"}}

 :aliases
 {;; Development REPL
  :dev
  {:extra-paths ["dev" "test" "resources/dev"]
   :extra-deps {nrepl/nrepl {:mvn/version "1.3.1"}
                cider/cider-nrepl {:mvn/version "0.50.2"}
                integrant/repl {:mvn/version "0.3.3"}}
   :main-opts ["-m" "nrepl.cmdline" "--middleware" "[cider.nrepl/cider-middleware]"]}

  ;; Test runner (kaocha)
  :test
  {:extra-paths ["test"]
   :extra-deps {lambdaisland/kaocha {:mvn/version "1.91.1392"}
                org.clojure/test.check {:mvn/version "1.1.1"}}
   :main-opts ["-m" "kaocha.runner"]}

  ;; Coverage (cloverage)
  :coverage
  {:extra-paths ["test"]
   :extra-deps {cloverage/cloverage {:mvn/version "1.2.4"}}
   :main-opts ["-m" "cloverage.coverage"
               "--src-ns-path" "src"
               "--test-ns-path" "test"
               "--fail-threshold" "95"
               "--output" "target/coverage"]}

  ;; Linting (clj-kondo)
  :lint
  {:extra-deps {clj-kondo/clj-kondo {:mvn/version "2024.11.14"}}
   :main-opts ["-m" "clj-kondo.main" "--lint" "src" "test"]}

  ;; Formatting (cljfmt)
  :fmt-check
  {:extra-deps {cljfmt/cljfmt {:mvn/version "0.9.2"}}
   :main-opts ["-m" "cljfmt.main" "check"]}

  :fmt-fix
  {:extra-deps {cljfmt/cljfmt {:mvn/version "0.9.2"}}
   :main-opts ["-m" "cljfmt.main" "fix"]}

  ;; Additional linting (Eastwood)
  :eastwood
  {:extra-deps {jonase/eastwood {:mvn/version "1.4.3"}}
   :main-opts ["-m" "eastwood.lint" "{:source-paths [\"src\"]}"]}

  ;; Build (tools.build)
  :build
  {:extra-deps {io.github.clojure/tools.build {:mvn/version "0.10.5"}}
   :ns-default build}}}
```

## tools.build — build.clj

**MUST** use `tools.build` for building JARs and uberjars. Define all build tasks in `build.clj` at the project root.

```clojure
;; CORRECT: build.clj using tools.build
(ns build
  (:require [clojure.tools.build.api :as b]))

(def lib 'ose/zakat-service)
(def version "1.0.0")
(def class-dir "target/classes")
(def basis (b/create-basis {:project "deps.edn"}))
(def uber-file (format "target/%s-%s-standalone.jar" (name lib) version))

(defn clean
  "Deletes the target directory."
  [_]
  (b/delete {:path "target"}))

(defn compile-clojure
  "Compiles Clojure sources ahead-of-time."
  [_]
  (b/compile-clj {:basis basis
                  :src-dirs ["src"]
                  :class-dir class-dir}))

(defn uber
  "Builds a standalone uberjar containing all dependencies."
  [_]
  (clean nil)
  (b/copy-dir {:src-dirs ["src" "resources"]
               :target-dir class-dir})
  (compile-clojure nil)
  (b/uber {:class-dir class-dir
           :uber-file uber-file
           :basis basis
           :main 'ose.zakat.core}))

(defn jar
  "Builds a thin library JAR (no dependencies included)."
  [_]
  (clean nil)
  (b/write-pom {:class-dir class-dir
                :lib lib
                :version version
                :basis basis
                :src-dirs ["src"]})
  (b/copy-dir {:src-dirs ["src" "resources"]
               :target-dir class-dir})
  (b/jar {:class-dir class-dir
          :jar-file (format "target/%s-%s.jar" (name lib) version)}))
```

**Running tools.build**:

```bash
# CORRECT: Build commands
clojure -T:build uber    ;; Build uberjar
clojure -T:build jar     ;; Build library JAR
clojure -T:build clean   ;; Clean target directory
```

## Leiningen — Legacy Project Support

**MAY** use Leiningen for legacy projects or ecosystem compatibility. New projects SHOULD prefer `deps.edn`.

```clojure
;; CORRECT: project.clj for Leiningen projects
(defproject ose/zakat-service "1.0.0"
  :description "Zakat calculation service for OSE Platform"
  :url "https://github.com/open-sharia-enterprise/zakat-service"
  :license {:name "MIT"
            :url "https://opensource.org/licenses/MIT"}

  :dependencies [[org.clojure/clojure "1.12.0"]
                 [ring/ring-core "1.12.2"]
                 [metosin/reitit "0.7.2"]
                 [com.github.seancorfield/next.jdbc "1.3.939"]
                 [cheshire/cheshire "5.13.0"]]

  :profiles
  {:dev {:dependencies [[nrepl/nrepl "1.3.1"]
                        [cider/cider-nrepl "0.50.2"]]
         :source-paths ["dev" "src"]
         :resource-paths ["resources/dev" "resources"]}
   :test {:dependencies [[lambdaisland/kaocha "1.91.1392"]
                         [org.clojure/test.check "1.1.1"]]}}

  :plugins [[lein-cljfmt "0.9.2"]
            [lein-cloverage "1.2.4"]]

  :main ose.zakat.core
  :aot [ose.zakat.core]

  :cljfmt {:indents {deftest [[:inner 0]]
                     testing [[:inner 0]]}}
  :cloverage {:fail-threshold 95})
```

## Babashka — Build Task Scripting

**SHOULD** use Babashka for scripting build automation tasks that require more flexibility than deps.edn aliases.

```clojure
;; CORRECT: bb.edn for Babashka task runner
{:tasks
 {:requires ([babashka.process :refer [shell]]
             [babashka.fs :as fs])

  ;; Quality tasks
  lint {:doc "Run clj-kondo static analysis"
        :task (shell "clj-kondo --lint src test")}

  fmt-check {:doc "Check cljfmt formatting"
             :task (shell "cljfmt check")}

  fmt-fix {:doc "Auto-fix cljfmt formatting"
           :task (shell "cljfmt fix")}

  eastwood {:doc "Run Eastwood additional linting"
            :task (shell "clojure -M:eastwood")}

  ;; Test tasks
  test {:doc "Run unit tests"
        :task (shell "clojure -M:test")}

  coverage {:doc "Run tests with coverage (fails below 95%)"
            :task (shell "clojure -M:coverage")}

  ;; Build tasks
  clean {:doc "Delete target directory"
         :task (fs/delete-tree "target")}

  build {:doc "Build uberjar"
         :task (shell "clojure -T:build uber")}

  ;; CI pipeline
  ci {:doc "Full CI quality gate: lint, format check, test, coverage, build"
      :depends [lint fmt-check eastwood coverage build]}}}
```

## REPL Startup Configuration

**SHOULD** configure the REPL startup namespace in `dev/user.clj` for productivity:

```clojure
;; CORRECT: dev/user.clj — loaded automatically by Clojure REPL
(ns user
  (:require [integrant.repl :as ig-repl]
            [integrant.repl.state :as ig-state]
            [clojure.repl :refer [doc source]]
            [clojure.tools.namespace.repl :as tn]))

;; Point Integrant REPL at the system configuration
(ig-repl/set-prep! (fn []
                     (require '[ose.system.config :as config])
                     ((resolve 'config/load-config) :dev)))

;; Convenience aliases for REPL workflow
(def go ig-repl/go)       ;; Start the system
(def halt ig-repl/halt)   ;; Stop the system
(def reset ig-repl/reset) ;; Reload and restart

(comment
  ;; REPL startup workflow
  (go)    ;; Start system from config
  (halt)  ;; Stop system
  (reset) ;; Reload changed namespaces and restart
  )
```

## ClojureScript — Shared cljc Code

**MAY** use `.cljc` files to share code between Clojure (JVM) and ClojureScript (JS) builds:

```clojure
;; CORRECT: src/ose/zakat/calculator.cljc — shared Clojure/ClojureScript
(ns ose.zakat.calculator
  #?(:clj (:require [clojure.spec.alpha :as s])
     :cljs (:require [cljs.spec.alpha :as s])))

(defn calculate-zakat
  "Calculates zakat amount. Works in both Clojure and ClojureScript."
  [wealth nisab]
  (if (>= wealth nisab)
    (* wealth 0.025)
    0))

#?(:clj (s/def :zakat/wealth (s/and decimal? pos?))
   :cljs (s/def :zakat/wealth (s/and number? pos?)))
```

**Use `.cljc` only when the logic genuinely needs to run in both environments** (e.g., domain validation shared between backend and frontend).

## Enforcement

Build configuration standards are enforced through:

- **deps.edn version pinning** - CI/CD fails if LATEST or version ranges detected
- **tools.build** - Standardized build process across all Clojure projects
- **Babashka CI task** - Single `bb ci` command for full quality gate
- **Code reviews** - Reviewers verify deps.edn structure and alias organization

## Related Standards

- [Code Quality Standards](./code-quality-standards.md) - Tool configuration within deps.edn aliases
- [Testing Standards](./testing-standards.md) - Test runner aliases
- [Coding Standards](./coding-standards.md) - Namespace mirroring directory structure

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**Clojure Version**: 1.10+ (baseline), 1.12 (recommended)
