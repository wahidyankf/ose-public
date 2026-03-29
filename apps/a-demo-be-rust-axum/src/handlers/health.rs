use a_demo_contracts::models::HealthResponse;
use axum::Json;

pub async fn get_health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "UP".to_string(),
    })
}
