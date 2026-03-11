use axum::body::Body;
use cucumber::{given, then, when};
use http::Request;

use crate::world::{get_req, json_req, AppWorld};

fn multipart_request(
    uri: &str,
    auth: Option<&str>,
    filename: &str,
    content_type: &str,
    data: Vec<u8>,
) -> Request<Body> {
    let boundary = "----TestBoundary123";
    let mut body = format!(
        "--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n"
    )
    .into_bytes();
    body.extend_from_slice(&data);
    body.extend_from_slice(format!("\r\n--{boundary}--\r\n").as_bytes());

    let mut builder = Request::builder().method("POST").uri(uri).header(
        "Content-Type",
        format!("multipart/form-data; boundary={boundary}"),
    );
    if let Some(token) = auth {
        builder = builder.header("Authorization", token);
    }
    builder.body(Body::from(body)).unwrap()
}

async fn upload_file(
    world: &mut AppWorld,
    expense_id: &str,
    filename: &str,
    content_type: &str,
    bearer: &str,
    data: Vec<u8>,
) {
    let uri = format!("/api/v1/expenses/{expense_id}/attachments");
    let req = multipart_request(&uri, Some(bearer), filename, content_type, data);
    world.send(req).await.unwrap();
    if world.last_status == 201 {
        world.last_attachment_id = world
            .last_body
            .get("id")
            .and_then(|v| v.as_str())
            .and_then(|s| uuid::Uuid::parse_str(s).ok());
    }
}

#[when(
    regex = r#"alice uploads file "([^"]+)" with content type "([^"]+)" to POST /api/v1/expenses/\{expenseId\}/attachments"#
)]
async fn alice_uploads_file(world: &mut AppWorld, filename: String, content_type: String) {
    let bearer = world.bearer();
    let expense_id = world
        .last_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let data = b"fake file content for testing".to_vec();
    upload_file(world, &expense_id, &filename, &content_type, &bearer, data).await;
}

#[given(regex = r#"alice has uploaded file "([^"]+)" with content type "([^"]+)" to the entry"#)]
async fn alice_uploaded_file(world: &mut AppWorld, filename: String, content_type: String) {
    let bearer = world.bearer();
    let expense_id = world
        .last_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let data = b"fake file content".to_vec();
    upload_file(world, &expense_id, &filename, &content_type, &bearer, data).await;
}

#[when("alice sends GET /api/v1/expenses/{expenseId}/attachments")]
async fn alice_list_attachments(world: &mut AppWorld) {
    let bearer = world.bearer();
    let expense_id = world
        .last_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let req = get_req(
        &format!("/api/v1/expenses/{expense_id}/attachments"),
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when("alice sends DELETE /api/v1/expenses/{expenseId}/attachments/{attachmentId}")]
async fn alice_delete_attachment(world: &mut AppWorld) {
    let bearer = world.bearer();
    let expense_id = world
        .last_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let att_id = world
        .last_attachment_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let req = Request::builder()
        .method("DELETE")
        .uri(&format!(
            "/api/v1/expenses/{expense_id}/attachments/{att_id}"
        ))
        .header("Authorization", &bearer)
        .body(Body::empty())
        .unwrap();
    world.send(req).await.unwrap();
}

#[when("alice uploads an oversized file to POST /api/v1/expenses/{expenseId}/attachments")]
async fn alice_uploads_oversized(world: &mut AppWorld) {
    let bearer = world.bearer();
    let expense_id = world
        .last_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let data = vec![0u8; 11 * 1024 * 1024];
    upload_file(world, &expense_id, "big.jpg", "image/jpeg", &bearer, data).await;
}

#[then(expr = "the response body should contain {int} items in the {string} array")]
async fn response_array_count(world: &mut AppWorld, count: usize, field: String) {
    let actual = world
        .last_body
        .get(&field)
        .and_then(|v| v.as_array())
        .map(|a| a.len())
        .unwrap_or(0);
    assert_eq!(
        actual, count,
        "Expected {count} items in '{field}', got {actual}, body: {}",
        world.last_body
    );
}

#[then(
    regex = r#"the response body should contain an attachment with "([^"]+)" equal to "([^"]+)""#
)]
async fn attachment_with_field(world: &mut AppWorld, field: String, value: String) {
    let attachments = world
        .last_body
        .get("attachments")
        .and_then(|v| v.as_array());
    let found = attachments
        .map(|arr| {
            arr.iter().any(|att| {
                att.get(&field)
                    .and_then(|v| v.as_str())
                    .map(|s| s == value.as_str())
                    .unwrap_or(false)
            })
        })
        .unwrap_or(false);
    assert!(
        found,
        "Expected attachment with '{field}' = '{value}' in: {}",
        world.last_body
    );
}

#[then("the response body should contain an error message about file size")]
async fn error_file_size(world: &mut AppWorld) {
    let msg = world
        .last_body
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    assert!(
        !msg.is_empty(),
        "Expected file size error, got: {}",
        world.last_body
    );
}

// Bob steps for cross-user ownership tests

#[given(
    regex = r#"bob has created an entry with body \{ "amount": "25\.00", "currency": "USD", "category": "transport", "description": "Taxi", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn bob_created_entry(world: &mut AppWorld) {
    let login_req = json_req(
        "POST",
        "/api/v1/auth/login",
        r#"{"username": "bob", "password": "Str0ng#Pass2"}"#,
        None,
    );
    world.send(login_req).await.unwrap();
    if world.last_status == 200 {
        world.bob_auth_token = world
            .last_body
            .get("access_token")
            .and_then(|v| v.as_str())
            .map(String::from);
        let bob_bearer = world.bob_bearer();
        let req = json_req(
            "POST",
            "/api/v1/expenses",
            r#"{"amount": "25.00", "currency": "USD", "category": "transport", "description": "Taxi", "date": "2025-01-15", "type": "expense"}"#,
            Some(&bob_bearer),
        );
        world.send(req).await.unwrap();
        if world.last_status == 201 {
            world.bob_expense_id = world
                .last_body
                .get("id")
                .and_then(|v| v.as_str())
                .and_then(|s| uuid::Uuid::parse_str(s).ok());
        }
    }
}

#[when(
    regex = r#"alice uploads file "([^"]+)" with content type "([^"]+)" to POST /api/v1/expenses/\{bobExpenseId\}/attachments"#
)]
async fn alice_uploads_to_bob_expense(
    world: &mut AppWorld,
    filename: String,
    content_type: String,
) {
    let bearer = world.bearer();
    let expense_id = world
        .bob_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let data = b"file content".to_vec();
    upload_file(world, &expense_id, &filename, &content_type, &bearer, data).await;
}

#[when("alice sends GET /api/v1/expenses/{bobExpenseId}/attachments")]
async fn alice_list_bob_attachments(world: &mut AppWorld) {
    let bearer = world.bearer();
    let expense_id = world
        .bob_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let req = get_req(
        &format!("/api/v1/expenses/{expense_id}/attachments"),
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when("alice sends DELETE /api/v1/expenses/{bobExpenseId}/attachments/{attachmentId}")]
async fn alice_delete_bob_attachment(world: &mut AppWorld) {
    let bearer = world.bearer();
    let expense_id = world
        .bob_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let att_id = world
        .last_attachment_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let req = Request::builder()
        .method("DELETE")
        .uri(&format!(
            "/api/v1/expenses/{expense_id}/attachments/{att_id}"
        ))
        .header("Authorization", &bearer)
        .body(Body::empty())
        .unwrap();
    world.send(req).await.unwrap();
}

#[when("alice sends DELETE /api/v1/expenses/{expenseId}/attachments/{randomAttachmentId}")]
async fn alice_delete_nonexistent_attachment(world: &mut AppWorld) {
    let bearer = world.bearer();
    let expense_id = world
        .last_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let random_id = uuid::Uuid::new_v4();
    let req = Request::builder()
        .method("DELETE")
        .uri(&format!(
            "/api/v1/expenses/{expense_id}/attachments/{random_id}"
        ))
        .header("Authorization", &bearer)
        .body(Body::empty())
        .unwrap();
    world.send(req).await.unwrap();
}
