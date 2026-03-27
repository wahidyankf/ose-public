use async_trait::async_trait;
use sqlx::AnyPool;
use uuid::Uuid;

use crate::db::attachment_repo;
use crate::domain::attachment::Attachment;
use crate::domain::errors::AppError;
use crate::repositories::{AttachmentRepository, NewAttachment};

pub struct SqlxAttachmentRepository {
    pool: AnyPool,
}

impl SqlxAttachmentRepository {
    #[must_use]
    pub fn new(pool: AnyPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl AttachmentRepository for SqlxAttachmentRepository {
    async fn create(&self, new: NewAttachment) -> Result<Attachment, AppError> {
        attachment_repo::create_attachment(
            &self.pool,
            attachment_repo::NewAttachment {
                id: new.id,
                expense_id: new.expense_id,
                filename: &new.filename.clone(),
                content_type: &new.content_type.clone(),
                size: new.size,
                data: &new.data.clone(),
            },
        )
        .await
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Attachment>, AppError> {
        attachment_repo::find_by_id(&self.pool, id).await
    }

    async fn list_for_expense(&self, expense_id: Uuid) -> Result<Vec<Attachment>, AppError> {
        attachment_repo::list_for_expense(&self.pool, expense_id).await
    }

    async fn delete(&self, id: Uuid) -> Result<(), AppError> {
        attachment_repo::delete_attachment(&self.pool, id).await
    }
}
