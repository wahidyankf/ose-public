/// TickSpec step definitions binding `gate-validation.feature`'s 26
/// scenarios [Repo-grounded —
/// `specs/apps/rhino/cli/behaviours/gate/gate-validation.feature`,
/// `apps/rhino-cli/tests/gate_specs.rs`].
///
/// The scenarios invoke the production validation core over in-memory
/// documents and explicit executable-hook metadata. Filesystem discovery is
/// covered by Integration.
module RhinoCli.Tests.Unit.Steps.GateValidationSteps

/// Explicit static-coverage ownership; the validator scopes this file's
/// TickSpec bindings to these canonical features.
let private behaviourFeatureOwnership =
    [ "specs/apps/rhino/cli/behaviours/gate/gate-validation.feature" ]


open System
open System.IO
open TickSpec
open Xunit
open RhinoCli.Cli.Gate

let private repoRoot =
    Path.GetFullPath(Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "..", ".."))

/// Mirrors `gate_specs.rs::config`.
let private config (gates: string) : string = "gates:\n" + gates

/// Mirrors `gate_specs.rs::gate`.
let private gate (id: string) (gateType: string) (command: string) (kind: string) (surfaces: string) : string =
    sprintf
        "  - id: %s\n    type: %s\n    command: %s\n    kind: %s\n    surfaces:\n%s"
        id
        gateType
        command
        kind
        surfaces

/// Instance step-definition container — see `ConventionSteps.fs`'s module doc
/// comment for the one-instance-per-scenario rationale behind mutable
/// instance state here.
type GateValidationSteps() =
    let mutable documents: Map<string, string> = Map.empty
    let mutable executableHooks: Set<string> = Set.empty
    let mutable succeeded: bool option = None
    let mutable output: string = ""
    let mutable listOutput: string = ""

    let write (relative: string) (contents: string) =
        documents <- documents |> Map.add relative contents

    // Mirrors `GateWorld::new`'s default seeding of all three Husky hooks
    // with valid, delegating content — individual scenarios override one
    // hook to introduce a violation.
    do
        for hook in [ "commit-msg"; "pre-commit"; "pre-push" ] do
            let relative = ".husky/" + hook
            write relative (sprintf "#!/bin/sh\nexec ./rhino gate run --surface %s\n" hook)
            executableHooks <- executableHooks.Add relative

    let validate () =
        let parsed =
            match documents |> Map.tryFind "repo-config.yml" with
            | None -> Error "repo-config.yml fixture is missing"
            | Some text -> RhinoCli.Application.RepoConfig.parse text

        match
            parsed
            |> Result.bind (fun registry ->
                validateDocuments
                    registry
                    { Files = documents
                      ExecutableHooks = executableHooks })
        with
        | Ok() ->
            succeeded <- Some true
            output <- ""
        | Error message ->
            succeeded <- Some false
            output <- message

    let isSuccess () =
        match succeeded with
        | Some value -> value
        | None -> failwith "gate validate has not run yet"

    [<Given>]
    member _.``a check declares pre-commit but no ci surface or carve-out``() =
        write
            "repo-config.yml"
            (config (
                gate "missing-ci" "check" "repo-config validate" "rhino-cli" "      pre-commit: { scope: other }\n"
            ))

    [<Given>]
    member _.``a mutation declares pre-commit but no ci surface``() =
        write
            "repo-config.yml"
            (config (
                gate
                    "format"
                    "mutation"
                    "prettier --write"
                    "external"
                    "      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
            ))

        write ".husky/pre-commit" "#!/bin/sh\nexec ./rhino gate run --surface pre-commit\n"

    [<Given>]
    member _.``a staged-only check declares pre-commit but no ci surface``() =
        write
            "repo-config.yml"
            (config (
                gate "index-guard" "check" "index validate" "rhino-cli" "      pre-commit: { scope: other }\n"
                + "    carve-out: staged-only\n"
            ))

        write ".husky/pre-commit" "#!/bin/sh\nexec ./rhino gate run --surface pre-commit\n"

    [<Given>]
    member _.``a declared pre-push surface has a non-delegating hook``() =
        write
            "repo-config.yml"
            (config (
                gate
                    "pre-push-check"
                    "check"
                    "test:quick"
                    "nx"
                    "      pre-push: { scope: affected-projects }\n      ci: { scope: affected-projects }\n"
                + "    ci-group: fixture-group\n"
            ))

        write ".husky/pre-push" "#!/bin/sh\necho stale\n"

    [<Given>]
    member _.``a workflow command is absent from the CI registry``() =
        write
            "repo-config.yml"
            (config (
                gate "known-check" "check" "known-check" "external" "      ci: { scope: affected-projects }\n"
                + "    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  build-rhino:\n    steps:\n      - uses: actions/upload-artifact@v4\n"
                  "  enumerate:\n    needs: build-rhino\n    steps:\n      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
                  "  gate:\n    needs: [build-rhino, enumerate]\n    strategy:\n      matrix:\n        group: '${{ fromJson(needs.enumerate.outputs.groups) }}'\n    steps:\n      - run: ./rhino gate run --surface ci -- --group=\"$GROUP_ID\"\n        env:\n          GROUP_ID: ${{ matrix.group.group }}\n"
                  "  quality-gate:\n    needs: [build-rhino, enumerate, gate]\n    steps:\n      - run: rhino-cli gate run --surface=ci --only=unknown-check\n" ])

    [<Given>]
    member _.``a matrix-driven CI gate has an aggregate missing its enumerate dependency``() =
        write
            "repo-config.yml"
            (config (
                gate "known-check" "check" "known-check" "external" "      ci: { scope: affected-projects }\n"
                + "    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  enumerate:\n    steps:\n      - run: rhino-cli gate list --surface=ci --format=json\n"
                  "  gate:\n    needs: enumerate\n    strategy:\n      matrix:\n        gate: '${{ fromJson(needs.enumerate.outputs.gates) }}'\n    steps:\n      - run: rhino-cli gate run --surface=ci --only=\"$GATE_ID\"\n        env:\n          GATE_ID: ${{ matrix.gate.id }}\n"
                  "  quality-gate:\n    needs: gate\n" ])

    [<Given>]
    member _.``a gate verifies a missing gate id``() =
        write
            "repo-config.yml"
            (config (
                gate
                    "verify-format"
                    "check"
                    "prettier --check"
                    "external"
                    "      ci: { scope: affected-file-type, glob: '*.md' }\n"
                + "    verifies: missing-gate\n    ci-group: fixture-group\n"
            ))

    [<Given>]
    member _.``package.json lint-staged differs from the registry projection``() =
        write
            "repo-config.yml"
            (config (
                gate
                    "format-markdown"
                    "mutation"
                    "prettier --write"
                    "external"
                    "      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
            ))

        write "package.json" """{"lint-staged":{"*.md":"prettier --check"}}"""
        write ".husky/pre-commit" "#!/bin/sh\nexec ./rhino gate run --surface pre-commit\n"

    [<Given>]
    member _.``a formatter mutation has no verifying check``() =
        write
            "repo-config.yml"
            (config (
                gate
                    "format-markdown"
                    "mutation"
                    "prettier --write"
                    "external"
                    "      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
                + "    category: formatter\n"
            ))

    [<Given>]
    member _.``a hand-wired CI gate has its matching workflow job``() =
        write
            "repo-config.yml"
            (config (
                gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
                + "    wiring: hand-wired\n    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  enumerate:\n    steps:\n      - run: rhino-cli gate list --surface=ci --format=json\n"
                  "  gate:\n    needs: enumerate\n    strategy:\n      matrix:\n        gate: '${{ fromJson(needs.enumerate.outputs.gates) }}'\n    steps:\n      - run: rhino-cli gate run --surface=ci --only=\"$GATE_ID\"\n        env:\n          GATE_ID: ${{ matrix.gate.id }}\n"
                  "  test-quick:\n    steps:\n      - run: npx nx affected -t test:quick\n"
                  "  quality-gate:\n    needs: [enumerate, gate, test-quick]\n" ])

    [<Given>]
    member _.``a hand-wired CI gate has no matching workflow job``() =
        write
            "repo-config.yml"
            (config (
                gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
                + "    wiring: hand-wired\n    ci-group: fixture-group\n"
            ))

        write ".github/workflows/pr-quality-gate.yml" "jobs: {}\n"

    [<Given>]
    member _.``a hand-wired CI command is only commented out``() =
        write
            "repo-config.yml"
            (config (
                gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
                + "    wiring: hand-wired\n    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  test-quick:\n    steps:\n      - run: '# npx nx affected -t test:quick'\n"
                  "  quality-gate:\n    needs: [test-quick]\n" ])

    [<Given>]
    member _.``a hand-wired CI command is only inline-commented``() =
        write
            "repo-config.yml"
            (config (
                gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
                + "    wiring: hand-wired\n    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  test-quick:\n    steps:\n      - run: echo disabled # npx nx affected -t test:quick\n"
                  "  quality-gate:\n    needs: [test-quick]\n" ])

    [<Given>]
    member _.``a hand-wired CI command is only quoted text``() =
        write
            "repo-config.yml"
            (config (
                gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
                + "    wiring: hand-wired\n    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  test-quick:\n    steps:\n      - run: \"echo 'npx nx affected -t test:quick'\"\n"
                  "  quality-gate:\n    needs: [test-quick]\n" ])

    [<Given>]
    member _.``a hand-wired CI command has a literal-disabled step``() =
        write
            "repo-config.yml"
            (config (
                gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
                + "    wiring: hand-wired\n    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  test-quick:\n    steps:\n      - if: false\n        run: npx nx affected -t test:quick\n"
                  "  quality-gate:\n    needs: [test-quick]\n" ])

    [<Given>]
    member _.``a hand-wired CI command has a normalized literal-disabled step``() =
        write
            "repo-config.yml"
            (config (
                gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
                + "    wiring: hand-wired\n    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  test-quick:\n    steps:\n      - if: ${{false}}\n        run: npx nx affected -t test:quick\n"
                  "  quality-gate:\n    needs: [test-quick]\n" ])

    [<Given>]
    member _.``a hand-wired CI command has falsey literal-disabled steps``() =
        write
            "repo-config.yml"
            (config (
                gate "test-quick" "check" "test:quick" "nx" "      ci: { scope: affected-projects }\n"
                + "    wiring: hand-wired\n    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  test-quick:\n"
                  "    steps:\n"
                  "      - if: |-\n          ${{ 0 }}\n        run: npx nx affected -t test:quick\n"
                  "      - if: |-\n          ${{ -0 }}\n        run: npx nx affected -t test:quick\n"
                  "      - if: |-\n          ${{ '' }}\n        run: npx nx affected -t test:quick\n"
                  "      - if: |-\n          ${{ \"\" }}\n        run: npx nx affected -t test:quick\n"
                  "      - if: |-\n          ${{ null }}\n        run: npx nx affected -t test:quick\n"
                  "  quality-gate:\n    needs: [test-quick]\n" ])

    [<Given>]
    member _.``a gate entry in repo-config.yml carrying a ci surface and no ci_group field``() =
        write
            "repo-config.yml"
            (config (
                gate "missing-ci-group" "check" "md links validate" "rhino-cli" "      ci: { scope: all-file-type }\n"
            ))

    [<Given>]
    member _.``the quality-gate job's needs list omits build-rhino``() =
        write
            "repo-config.yml"
            (config (
                gate "known-check" "check" "known-check" "external" "      ci: { scope: affected-projects }\n"
                + "    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  build-rhino:\n"
                  "    steps:\n"
                  "      - run: cargo build --profile gate --manifest-path apps/rhino-cli/Cargo.toml\n"
                  "  enumerate:\n"
                  "    needs: build-rhino\n"
                  "    steps:\n"
                  "      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
                  "  gate:\n"
                  "    needs: [build-rhino, enumerate]\n"
                  "    strategy:\n"
                  "      matrix:\n"
                  "        group: ${{ fromJson(needs.enumerate.outputs.groups) }}\n"
                  "    steps:\n"
                  "      - run: ./rhino gate run --surface ci -- --group=\"$GROUP_ID\"\n"
                  "        env:\n"
                  "          GROUP_ID: ${{ matrix.group.group }}\n"
                  "  quality-gate:\n"
                  "    needs: [enumerate, gate]\n" ])

    /// Shared by the three matrix/Doctor-shape scenarios below: a compliant
    /// `build-rhino`/`enumerate`/`format`/`gate`/`quality-gate` skeleton that
    /// on its own satisfies `validateCiMatrixContract` and
    /// `validateCiDoctorBootstrap`, so each scenario introduces exactly one
    /// additional violation without tripping an unrelated check
    /// [Repo-grounded — `gate_specs.rs::write_compliant_ci_matrix_fixture`].
    member private this.WriteCompliantCiMatrixFixture() =
        write
            "repo-config.yml"
            (config (
                gate "shellcheck" "check" "shellcheck" "external" "      ci: { scope: all-file-type }\n"
                + "    doctor-tools: [shellcheck]\n    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  build-rhino:\n"
                  "    steps:\n"
                  "      - run: cargo build --profile gate --manifest-path apps/rhino-cli/Cargo.toml\n"
                  "  enumerate:\n"
                  "    needs: build-rhino\n"
                  "    steps:\n"
                  "      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
                  "  format:\n"
                  "    steps:\n"
                  "      - run: |\n"
                  "          tools=$(rhino-cli gate list --surface=pre-commit --format=json | jq -r '[.[] | .doctor_tools[]] | unique | join(\",\")')\n"
                  "          if [ -n \"$tools\" ]; then\n"
                  "            apps/rhino-cli/scripts/rhino-bin.sh doctor --fix --tools \"$tools\"\n"
                  "          fi\n"
                  "  gate:\n"
                  "    needs: [build-rhino, enumerate]\n"
                  "    strategy:\n"
                  "      matrix:\n"
                  "        group: ${{ fromJson(needs.enumerate.outputs.groups) }}\n"
                  "    steps:\n"
                  "      - run: ./rhino gate run --surface ci -- --group=\"$GROUP_ID\"\n"
                  "        env:\n"
                  "          GROUP_ID: ${{ matrix.group.group }}\n"
                  "      - run: |\n"
                  "          tools=\"$DOCTOR_TOOLS\"\n"
                  "          if [ -n \"$tools\" ]; then\n"
                  "            apps/rhino-cli/scripts/rhino-bin.sh doctor --fix --tools \"$tools\"\n"
                  "          fi\n"
                  "        env:\n"
                  "          DOCTOR_TOOLS: ${{ join(matrix.group.doctor_tools, ',') }}\n"
                  "  quality-gate:\n"
                  "    needs: [build-rhino, enumerate, gate]\n" ])

    [<Given>]
    member this.``a gate run --surface=ci step declares neither --only= nor --group=``() =
        this.WriteCompliantCiMatrixFixture()

        let workflow =
            documents.[".github/workflows/pr-quality-gate.yml"]
            + "  extra-check:\n    steps:\n      - run: rhino-cli gate run --surface=ci\n"

        write ".github/workflows/pr-quality-gate.yml" workflow

    [<Given>]
    member this.``a gate run --surface=ci step's --group value matches no declared ci_group``() =
        this.WriteCompliantCiMatrixFixture()

        let workflow =
            documents.[".github/workflows/pr-quality-gate.yml"]
            + "  extra-check:\n    steps:\n      - run: rhino-cli gate run --surface=ci --group=unregistered-group\n"

        write ".github/workflows/pr-quality-gate.yml" workflow

    [<Given>]
    member _.``the gate job provisions Doctor tools via npm run doctor instead of the rhino-bin.sh shim``() =
        write
            "repo-config.yml"
            (config (
                gate "shellcheck" "check" "shellcheck" "external" "      ci: { scope: all-file-type }\n"
                + "    doctor-tools: [shellcheck]\n    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  build-rhino:\n"
                  "    steps:\n"
                  "      - run: cargo build --profile gate --manifest-path apps/rhino-cli/Cargo.toml\n"
                  "  enumerate:\n"
                  "    needs: build-rhino\n"
                  "    steps:\n"
                  "      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
                  "  format:\n"
                  "    steps:\n"
                  "      - run: |\n"
                  "          tools=$(rhino-cli gate list --surface=pre-commit --format=json | jq -r '[.[] | .doctor_tools[]] | unique | join(\",\")')\n"
                  "          if [ -n \"$tools\" ]; then\n"
                  "            apps/rhino-cli/scripts/rhino-bin.sh doctor --fix --tools \"$tools\"\n"
                  "          fi\n"
                  "  gate:\n"
                  "    needs: [build-rhino, enumerate]\n"
                  "    strategy:\n"
                  "      matrix:\n"
                  "        group: ${{ fromJson(needs.enumerate.outputs.groups) }}\n"
                  "    steps:\n"
                  "      - run: ./rhino gate run --surface ci -- --group=\"$GROUP_ID\"\n"
                  "        env:\n"
                  "          GROUP_ID: ${{ matrix.group.group }}\n"
                  "      - run: |\n"
                  "          tools=\"$DOCTOR_TOOLS\"\n"
                  "          if [ -n \"$tools\" ]; then\n"
                  "            npm run doctor -- --fix --tools \"$tools\"\n"
                  "          fi\n"
                  "        env:\n"
                  "          DOCTOR_TOOLS: ${{ join(matrix.group.doctor_tools, ',') }}\n"
                  "  quality-gate:\n"
                  "    needs: [build-rhino, enumerate, gate]\n" ])

    [<Given>]
    member _.``a CI matrix dispatcher step interpolates matrix.group.group directly into its run body without env indirection``
        ()
        =
        write
            "repo-config.yml"
            (config (
                gate "known-check" "check" "known-check" "external" "      ci: { scope: affected-projects }\n"
                + "    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  build-rhino:\n"
                  "    steps:\n"
                  "      - run: cargo build --profile gate --manifest-path apps/rhino-cli/Cargo.toml\n"
                  "  enumerate:\n"
                  "    needs: build-rhino\n"
                  "    steps:\n"
                  "      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
                  "  gate:\n"
                  "    needs: [build-rhino, enumerate]\n"
                  "    strategy:\n"
                  "      matrix:\n"
                  "        group: ${{ fromJson(needs.enumerate.outputs.groups) }}\n"
                  "    steps:\n"
                  "      - run: ./rhino gate run --surface ci -- --group=\"$GROUP_ID\"\n"
                  "        env:\n"
                  "          GROUP_ID: ${{ matrix.group.group }}\n"
                  "      - run: echo \"debug group id is ${{ matrix.group.group }}\"\n"
                  "  quality-gate:\n"
                  "    needs: [build-rhino, enumerate, gate]\n" ])

    [<Given>]
    member _.``a CI matrix dispatcher step carries matrix.group.group through a differently-named env var``() =
        write
            "repo-config.yml"
            (config (
                gate "known-check" "check" "known-check" "external" "      ci: { scope: affected-projects }\n"
                + "    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  build-rhino:\n"
                  "    steps:\n"
                  "      - run: cargo build --profile gate --manifest-path apps/rhino-cli/Cargo.toml\n"
                  "  enumerate:\n"
                  "    needs: build-rhino\n"
                  "    steps:\n"
                  "      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
                  "  gate:\n"
                  "    needs: [build-rhino, enumerate]\n"
                  "    strategy:\n"
                  "      matrix:\n"
                  "        group: ${{ fromJson(needs.enumerate.outputs.groups) }}\n"
                  "    steps:\n"
                  "      - run: ./rhino gate run --surface ci -- --group=\"$CI_SELECTED_GROUP\"\n"
                  "        env:\n"
                  "          CI_SELECTED_GROUP: ${{ matrix.group.group }}\n"
                  "  quality-gate:\n"
                  "    needs: [build-rhino, enumerate, gate]\n" ])

    [<Given>]
    member _.``pre-commit and pre-push invoke their declared gate surfaces``() =
        write
            "repo-config.yml"
            (config (
                String.concat
                    ""
                    [ "  - id: commit-msg-mutation\n    type: mutation\n    command: commitlint --edit\n    kind: external\n    surfaces:\n      commit-msg: { scope: other }\n"
                      "  - id: pre-commit-mutation\n    type: mutation\n    command: prettier --write\n    kind: external\n    surfaces:\n      pre-commit: { scope: other }\n"
                      "  - id: pre-push-mutation\n    type: mutation\n    command: verify\n    kind: external\n    surfaces:\n      pre-push: { scope: other }\n" ]
            ))

    [<Given>]
    member _.``commit-msg is missing its declared gate surface invocation``() =
        write ".husky/commit-msg" "#!/bin/sh\necho stale hook\n"

    [<Given>]
    member _.``the registry and surfaces as shipped by this plan``() =
        write
            "repo-config.yml"
            (config (
                String.concat
                    ""
                    [ "  - id: pre-commit-check\n    type: check\n    command: md links validate\n    kind: rhino-cli\n    ci-group: fixture-group\n    surfaces:\n      pre-commit: { scope: other }\n      ci: { scope: all-file-type }\n"
                      "  - id: pre-push-check\n    type: check\n    command: test:quick\n    kind: nx\n    ci-group: fixture-group\n    surfaces:\n      pre-push: { scope: affected-projects }\n      ci: { scope: affected-projects }\n"
                      "  - id: generate-bindings\n    type: mutation\n    command: harness bindings generate\n    kind: rhino-cli\n    surfaces:\n      pre-commit: { scope: other }\n"
                      "  - id: test-quick\n    type: check\n    command: test:quick\n    kind: nx\n    wiring: hand-wired\n    ci-group: fixture-group\n    surfaces:\n      ci: { scope: affected-projects }\n" ]
            ))

        write ".husky/pre-push" "#!/bin/sh\nexec ./rhino gate run --surface pre-push\n"
        write ".husky/pre-commit" "#!/bin/sh\nexec ./rhino gate run --surface pre-commit\n"

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  build-rhino:\n    steps:\n      - uses: actions/upload-artifact@v4\n"
                  "  enumerate:\n    needs: build-rhino\n    steps:\n      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
                  "  gate:\n    needs: [build-rhino, enumerate]\n    strategy:\n      matrix:\n        group: '${{ fromJson(needs.enumerate.outputs.groups) }}'\n    steps:\n      - uses: actions/download-artifact@v4\n      - run: ./rhino gate run --surface ci -- --group=\"$GROUP_ID\"\n        env:\n          GROUP_ID: ${{ matrix.group.group }}\n"
                  "  test-quick:\n    steps:\n      - run: npx nx affected -t test:quick\n"
                  "  quality-gate:\n    needs: [build-rhino, enumerate, gate, test-quick]\n" ])

    [<When>]
    member _.``"rhino-cli gate validate" runs``() = validate ()

    [<When>]
    member _.``gate validate runs``() = validate ()

    [<Then>]
    member _.``it fails and names the Gate Composition Rule, gate, and ci surface``() =
        Assert.False(isSuccess ())
        Assert.Contains("Gate Composition Rule", output)
        Assert.Contains("missing-ci", output)
        Assert.Contains("ci", output)

    [<Then>]
    member _.``it succeeds``() =
        Assert.True(isSuccess (), sprintf "gate validation failed: %s" output)

    [<Then>]
    member _.``it succeeds and gate list reports the exemption``() =
        Assert.True(isSuccess (), sprintf "gate validation failed: %s" output)

        let registry =
            documents.["repo-config.yml"]
            |> RhinoCli.Application.RepoConfig.parse
            |> Result.defaultWith failwith

        match listFromConfig registry "pre-commit" RhinoCli.Domain.Types.OutputFormat.Text false with
        | Ok text -> listOutput <- text
        | Error message -> failwithf "gate list failed: %s" message

        Assert.Contains("carve-out=staged-only", listOutput)

    [<Then>]
    member _.``it fails and names the hook file``() =
        Assert.False(isSuccess ())
        Assert.Contains(".husky/pre-push", output)

    [<Then>]
    member _.``it fails and names that command``() =
        Assert.False(isSuccess ())
        Assert.Contains("unknown-check", output)

    [<Then>]
    member _.``it fails and names the enumerate dependency and quality-gate``() =
        Assert.False(isSuccess ())
        Assert.Contains("enumerate", output)
        Assert.Contains("quality-gate", output)

    [<Then>]
    member _.``it fails and names both IDs``() =
        Assert.False(isSuccess ())
        Assert.Contains("verify-format", output)
        Assert.Contains("missing-gate", output)

    [<Then>]
    member _.``it names package.json and the emit command``() =
        Assert.False(isSuccess ())
        Assert.Contains("package.json", output)
        Assert.Contains("gate emit --surface=pre-commit", output)

    [<Then>]
    member _.``it fails and names the formatter``() =
        Assert.False(isSuccess ())
        Assert.Contains("format-markdown", output)

    [<Then>]
    member _.``it fails and names the gate and workflow file``() =
        Assert.False(isSuccess ())
        Assert.Contains("test-quick", output)
        Assert.Contains("pr-quality-gate.yml", output)

    [<Then>]
    member _.``its output names the offending gate id``() =
        Assert.Contains("missing-ci-group", output)

    [<Then>]
    member _.``its output states that ci_group is required``() =
        Assert.Contains("ci_group is required", output)

    [<Then>]
    member _.``it fails and names build-rhino``() =
        Assert.False(isSuccess ())
        Assert.Contains("build-rhino", output)

    [<Then>]
    member _.``it fails and states that the invocation must select exactly one matrix gate``() =
        Assert.False(isSuccess ())
        Assert.Contains("must select exactly one matrix gate", output)

    [<Then>]
    member _.``it fails and names the undeclared group id``() =
        Assert.False(isSuccess ())
        Assert.Contains("unregistered-group", output)

    [<Then>]
    member _.``it fails and names the gate job's stale Doctor bootstrap``() =
        Assert.False(isSuccess ())
        Assert.Contains("format and matrix Doctor selections", output)

    [<Then>]
    member _.``it fails and states that the gate matrix id must be derived through env indirection``() =
        Assert.False(isSuccess ())
        Assert.Contains("must derive its gate matrix", output)

    [<Then>]
    member _.``validation fails and identifies the commit-msg hook``() =
        Assert.False(isSuccess ())
        Assert.Contains(".husky/commit-msg", output)

    [<Given>]
    member _.``a declared pre-commit surface hook invokes rhino-cli gate run instead of the pinned RHINO binary``() =
        write
            "repo-config.yml"
            (config (
                gate
                    "format"
                    "mutation"
                    "prettier --write"
                    "external"
                    "      pre-commit: { scope: affected-file-type, glob: '*.md' }\n"
            ))

        write ".husky/pre-commit" "#!/bin/sh\nrhino-cli gate run --surface=pre-commit\n"

    [<Given>]
    member _.``a CI matrix dispatcher step runs the repository CLI's gate run for its group instead of the pinned RHINO binary``
        ()
        =
        write
            "repo-config.yml"
            (config (
                gate "known-check" "check" "known-check" "external" "      ci: { scope: affected-projects }\n"
                + "    ci-group: fixture-group\n"
            ))

        write
            ".github/workflows/pr-quality-gate.yml"
            (String.concat
                ""
                [ "jobs:\n"
                  "  build-rhino:\n"
                  "    steps:\n"
                  "      - run: cargo build --profile gate --manifest-path apps/rhino-cli/Cargo.toml\n"
                  "  enumerate:\n"
                  "    needs: build-rhino\n"
                  "    steps:\n"
                  "      - run: rhino-cli gate list --surface=ci --format=json --by-group\n"
                  "  gate:\n"
                  "    needs: [build-rhino, enumerate]\n"
                  "    strategy:\n"
                  "      matrix:\n"
                  "        group: ${{ fromJson(needs.enumerate.outputs.groups) }}\n"
                  "    steps:\n"
                  "      - run: apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=ci --group=\"$GROUP_ID\"\n"
                  "        env:\n"
                  "          GROUP_ID: ${{ matrix.group.group }}\n"
                  "  quality-gate:\n"
                  "    needs: [build-rhino, enumerate, gate]\n" ])

    [<Then>]
    member _.``it fails and names the hook file and its ./rhino gate run invocation``() =
        Assert.False(isSuccess ())
        Assert.Contains(".husky/pre-commit", output)
        Assert.Contains("./rhino gate run --surface pre-commit", output)

    [<Then>]
    member _.``it fails and states that the group must be dispatched through ./rhino gate run --surface ci``() =
        Assert.False(isSuccess ())
        Assert.Contains("./rhino gate run --surface ci", output)

    [<Then>]
    member _.``it exits zero``() =
        Assert.True(isSuccess (), sprintf "gate validation failed: %s" output)

    [<Then>]
    member _.``it exits non-zero``() = Assert.False(isSuccess ())

module private FeatureRunner =

    let private featurePath: string =
        Path.Combine(repoRoot, "specs", "apps", "rhino", "cli", "behaviours", "gate", "gate-validation.feature")

    let private extractScenario (featureLines: string[]) (scenarioTitle: string) : string[] =
        let featureLine =
            featureLines
            |> Array.find (fun l -> l.TrimStart().StartsWith("Feature:", StringComparison.Ordinal))

        let startIdx =
            featureLines
            |> Array.findIndex (fun l -> l.Trim() = sprintf "Scenario: %s" scenarioTitle)

        let endIdx =
            featureLines
            |> Array.skip (startIdx + 1)
            |> Array.tryFindIndex (fun l ->
                let trimmed = l.Trim()

                trimmed.StartsWith("Scenario:", StringComparison.Ordinal)
                || trimmed.StartsWith("@", StringComparison.Ordinal))
            |> Option.map (fun relativeIdx -> startIdx + 1 + relativeIdx)
            |> Option.defaultValue featureLines.Length

        Array.append [| featureLine; "" |] featureLines.[startIdx .. endIdx - 1]

    let run (scenarioTitle: string) : unit =
        let allLines =
            ConventionSteps.FeatureResource.readLines (Path.GetFileName featurePath)

        let snippet = extractScenario allLines scenarioTitle
        let definitions = StepDefinitions([| typeof<GateValidationSteps> |])
        let feature = definitions.GenerateFeature(featurePath, snippet)
        let scenario = Seq.exactlyOne feature.Scenarios
        scenario.Action.Invoke()

[<Fact>]
let ``A check declared for pre-commit but not for ci violates the composition rule`` () =
    FeatureRunner.run "A check declared for pre-commit but not for ci violates the composition rule"

[<Fact>]
let ``A mutation at pre-commit does not require a ci counterpart`` () =
    FeatureRunner.run "A mutation at pre-commit does not require a ci counterpart"

[<Fact>]
let ``The staged-only carve-out exempts a check that cannot have a CI counterpart`` () =
    FeatureRunner.run "The staged-only carve-out exempts a check that cannot have a CI counterpart"

[<Fact>]
let ``A surface file that stops invoking the registry is caught`` () =
    FeatureRunner.run "A surface file that stops invoking the registry is caught"

[<Fact>]
let ``A CI workflow that hardcodes a check instead of deriving it is caught`` () =
    FeatureRunner.run "A CI workflow that hardcodes a check instead of deriving it is caught"

[<Fact>]
let ``A registry matrix aggregate cannot omit its enumerator`` () =
    FeatureRunner.run "A registry matrix aggregate cannot omit its enumerator"

[<Fact>]
let ``A verifies field naming no existing gate is caught`` () =
    FeatureRunner.run "A verifies field naming no existing gate is caught"

[<Fact>]
let ``A hand-edited lint-staged block is caught`` () =
    FeatureRunner.run "A hand-edited lint-staged block is caught"

[<Fact>]
let ``A formatter without a verifying check fails validation`` () =
    FeatureRunner.run "A formatter without a verifying check fails validation"

[<Fact>]
let ``A hand-wired gate is asserted present but not matrix-derived`` () =
    FeatureRunner.run "A hand-wired gate is asserted present but not matrix-derived"

[<Fact>]
let ``A hand-wired gate whose job was deleted is caught`` () =
    FeatureRunner.run "A hand-wired gate whose job was deleted is caught"

[<Fact>]
let ``A commented hand-wired CI command does not satisfy the workflow contract`` () =
    FeatureRunner.run "A commented hand-wired CI command does not satisfy the workflow contract"

[<Fact>]
let ``An inline-commented hand-wired CI command does not satisfy the workflow contract`` () =
    FeatureRunner.run "An inline-commented hand-wired CI command does not satisfy the workflow contract"

[<Fact>]
let ``A quoted hand-wired CI command does not satisfy the workflow contract`` () =
    FeatureRunner.run "A quoted hand-wired CI command does not satisfy the workflow contract"

[<Fact>]
let ``A literal-disabled hand-wired CI command does not satisfy the workflow contract`` () =
    FeatureRunner.run "A literal-disabled hand-wired CI command does not satisfy the workflow contract"

[<Fact>]
let ``A normalized literal-disabled hand-wired CI command does not satisfy the workflow contract`` () =
    FeatureRunner.run "A normalized literal-disabled hand-wired CI command does not satisfy the workflow contract"

[<Fact>]
let ``A falsey literal-disabled hand-wired CI command does not satisfy the workflow contract`` () =
    FeatureRunner.run "A falsey literal-disabled hand-wired CI command does not satisfy the workflow contract"

[<Fact>]
let ``Gate validation covers every hook surface`` () =
    FeatureRunner.run "Gate validation covers every hook surface"

[<Fact>]
let ``The shipped configuration passes`` () =
    FeatureRunner.run "The shipped configuration passes"

[<Fact>]
let ``A gate declared without a CI group fails validation`` () =
    FeatureRunner.run "A gate declared without a CI group fails validation"

[<Fact>]
let ``quality-gate must depend on build-rhino as well as enumerate and gate`` () =
    FeatureRunner.run "quality-gate must depend on build-rhino as well as enumerate and gate"

[<Fact>]
let ``A gate run --surface=ci invocation must carry a selector`` () =
    FeatureRunner.run "A gate run --surface=ci invocation must carry a selector"

[<Fact>]
let ``An undeclared --group selector is rejected`` () =
    FeatureRunner.run "An undeclared --group selector is rejected"

[<Fact>]
let ``The gate job's Doctor bootstrap must use the resolver shim`` () =
    FeatureRunner.run "The gate job's Doctor bootstrap must use the resolver shim"

[<Fact>]
let ``A matrix group id spliced directly into a shell command is rejected`` () =
    FeatureRunner.run "A matrix group id spliced directly into a shell command is rejected"

[<Fact>]
let ``A matrix group id with a non-default env var name still validates`` () =
    FeatureRunner.run "A matrix group id with a non-default env var name still validates"

[<Fact>]
let ``A hook that bypasses the pinned RHINO binary is caught`` () =
    FeatureRunner.run "A hook that bypasses the pinned RHINO binary is caught"

[<Fact>]
let ``A matrix group dispatched straight to the repository CLI is caught`` () =
    FeatureRunner.run "A matrix group dispatched straight to the repository CLI is caught"
