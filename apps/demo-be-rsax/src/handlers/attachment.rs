use axum::{
    body::Bytes,
    extract::{Multipart, Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::db::{
    attachment_repo::{self, NewAttachment},
    expense_repo,
};
use crate::domain::{
    attachment::{is_allowed_content_type, MAX_FILE_SIZE},
    errors::AppError,
};
use crate::state::AppState;

fn attachment_to_json(att: &crate::domain::attachment::Attachment) -> Value {
    json!({
        "id": att.id.to_string(),
        "expense_id": att.expense_id.to_string(),
        "filename": att.filename,
        "content_type": att.content_type,
        "size": att.size,
        "url": format!("/api/v1/expenses/{}/attachments/{}", att.expense_id, att.id),
    })
}

pub async fn upload_attachment(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(expense_id): Path<Uuid>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    // Check expense ownership
    let expense = expense_repo::find_by_id(&state.pool, expense_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "expense".to_string(),
        })?;

    if expense.user_id != auth_user.user_id {
        return Err(AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    // Parse multipart fields
    let mut filename: Option<String> = None;
    let mut content_type: Option<String> = None;
    let mut data: Option<Bytes> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        let msg = e.to_string();
        if msg.contains("size") || msg.contains("limit") || msg.contains("too large") {
            AppError::FileTooLarge
        } else {
            AppError::Internal(format!("multipart error: {e}"))
        }
    })? {
        let field_name = field.name().unwrap_or("").to_string();
        let file_name = field.file_name().map(String::from);
        let ct = field
            .content_type()
            .map(String::from)
            .unwrap_or_else(|| "application/octet-stream".to_string());

        let bytes = field.bytes().await.map_err(|e| {
            let msg = e.to_string();
            if msg.contains("size") || msg.contains("limit") || msg.contains("too large") {
                AppError::FileTooLarge
            } else {
                AppError::Internal(format!("field read error: {e}"))
            }
        })?;

        if field_name == "file" || file_name.is_some() {
            filename = file_name.or_else(|| Some("upload".to_string()));
            content_type = Some(ct);
            data = Some(bytes);
        }
    }

    let filename = filename.ok_or_else(|| AppError::Validation {
        field: "file".to_string(),
        message: "no file provided".to_string(),
    })?;
    let content_type = content_type.unwrap_or_else(|| "application/octet-stream".to_string());
    let data = data.unwrap_or_default();

    // Validate content type
    if !is_allowed_content_type(&content_type) {
        return Err(AppError::UnsupportedMediaType);
    }

    // Validate file size
    if data.len() > MAX_FILE_SIZE {
        return Err(AppError::FileTooLarge);
    }

    let att_id = Uuid::new_v4();
    let attachment = attachment_repo::create_attachment(
        &state.pool,
        NewAttachment {
            id: att_id,
            expense_id,
            user_id: auth_user.user_id,
            filename: &filename,
            content_type: &content_type,
            size: data.len() as i64,
            data: &data,
        },
    )
    .await?;

    Ok((StatusCode::CREATED, Json(attachment_to_json(&attachment))))
}

pub async fn list_attachments(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(expense_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    // Check expense ownership
    let expense = expense_repo::find_by_id(&state.pool, expense_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "expense".to_string(),
        })?;

    if expense.user_id != auth_user.user_id {
        return Err(AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    let attachments = attachment_repo::list_for_expense(&state.pool, expense_id).await?;
    let items: Vec<Value> = attachments.iter().map(attachment_to_json).collect();

    Ok(Json(json!({"attachments": items})))
}

pub async fn delete_attachment(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path((expense_id, attachment_id)): Path<(Uuid, Uuid)>,
) -> Result<impl IntoResponse, AppError> {
    // Check expense ownership
    let expense = expense_repo::find_by_id(&state.pool, expense_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "expense".to_string(),
        })?;

    if expense.user_id != auth_user.user_id {
        return Err(AppError::Forbidden {
            message: "Access denied".to_string(),
        });
    }

    // Check attachment exists and belongs to this expense
    let attachment = attachment_repo::find_by_id(&state.pool, attachment_id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "attachment".to_string(),
        })?;

    if attachment.expense_id != expense_id {
        return Err(AppError::NotFound {
            entity: "attachment".to_string(),
        });
    }

    attachment_repo::delete_attachment(&state.pool, attachment_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
