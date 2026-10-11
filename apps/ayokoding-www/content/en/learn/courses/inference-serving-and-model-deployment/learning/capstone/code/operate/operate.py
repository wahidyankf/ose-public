"""Capstone step 5 -- operate/: package weights, runtime, and configuration as one versioned artefact;
wire the serving-observability dashboard; execute a staged model rollout with a quality guardrail and a
rollback; write the build-versus-buy recommendation.

Reuses the deployment-manifest shape from Example 62, the dashboard/diagnosis pattern from Examples
64/74, the staged-rollout-with-guardrail pattern from Examples 63/72/73, and the TCO-sensitivity
calculation from Example 75.
"""

from dataclasses import asdict, dataclass


@dataclass
class DeploymentManifest:  # => co-24: weights + runtime + config, versioned as ONE unit
    model_id: str
    model_revision: str
    framework_version_pin: str  # => placeholder -- pin the real framework version at actual deploy time
    replica_count: int
    max_batch_slots: int


def package_deployment(model_id: str, revision: str, replica_count: int, max_batch_slots: int) -> dict[str, object]:
    manifest = DeploymentManifest(
        model_id=model_id,
        model_revision=revision,
        framework_version_pin="PLACEHOLDER-pin-at-deploy-time",
        replica_count=replica_count,
        max_batch_slots=max_batch_slots,
    )
    return asdict(manifest)


def build_dashboard(queue_depth: int, batch_occupancy: float, itl_p50_ms: float, preemption_rate: float) -> dict[str, float | int]:
    # => co-26: the five signals that explain a serving problem, read together
    return {
        "queue_depth": queue_depth,
        "batch_occupancy": batch_occupancy,
        "itl_p50_ms": itl_p50_ms,
        "preemption_rate": preemption_rate,
    }


def diagnose(dashboard: dict[str, float | int]) -> str:  # => co-26: the SAME rule chain as Example 74
    if dashboard["preemption_rate"] > 0.3:
        return "cache_pressure"
    if dashboard["queue_depth"] > 15 and dashboard["batch_occupancy"] < 0.5:
        return "undersized_replica_count"
    if dashboard["itl_p50_ms"] > 40:
        return "oversized_batch"
    return "healthy"


def evaluate_rollout_stage(error_rate: float, p99_latency_ms: float, error_guardrail: float, latency_guardrail_ms: float) -> str:
    # => co-25: BOTH guardrails must hold for a stage to advance -- either alone is not enough
    if error_rate > error_guardrail:
        return "halt"
    if p99_latency_ms > latency_guardrail_ms:
        return "halt"
    return "advance"


def should_rollback(old_p99_ms: float, new_p99_ms: float, regression_tolerance: float) -> bool:
    # => co-25/co-26: the SAME rollback rule as Example 73, applied to a planted regression
    return new_p99_ms > old_p99_ms * (1 + regression_tolerance)


def build_vs_buy_recommendation(
    gpu_hourly_rate: float,
    tokens_per_second_at_full_load: float,
    realistic_utilization: float,
    hosted_api_price_per_million_tokens: float,
) -> dict[str, object]:
    # => co-27/co-28: the HONEST comparison uses REALISTIC utilization, never full-load utilization
    effective_tokens_per_hour = tokens_per_second_at_full_load * 3600 * realistic_utilization
    self_hosted_cost = (gpu_hourly_rate / effective_tokens_per_hour) * 1_000_000
    recommendation = "self_host" if self_hosted_cost < hosted_api_price_per_million_tokens else "use_hosted_api"
    return {
        "self_hosted_cost_per_million_tokens": round(self_hosted_cost, 4),
        "hosted_api_cost_per_million_tokens": hosted_api_price_per_million_tokens,
        "realistic_utilization": realistic_utilization,
        "recommendation": recommendation,
    }
