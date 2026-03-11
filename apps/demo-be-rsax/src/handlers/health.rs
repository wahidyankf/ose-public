use axum::Json;
use serde_json::{json, Value};

pub async fn get_health() -> Json<Value> {
    Json(json!({"status": "UP"}))
}
