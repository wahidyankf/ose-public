use tokio::task;

use crate::domain::errors::AppError;

pub async fn hash_password(password: String) -> Result<String, AppError> {
    task::spawn_blocking(move || {
        bcrypt::hash(&password, bcrypt::DEFAULT_COST)
            .map_err(|e| AppError::Internal(format!("Hashing failed: {e}")))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join failed: {e}")))?
}

pub async fn verify_password(password: String, hash: String) -> Result<bool, AppError> {
    task::spawn_blocking(move || {
        bcrypt::verify(&password, &hash)
            .map_err(|e| AppError::Internal(format!("Verification failed: {e}")))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join failed: {e}")))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn hash_and_verify() {
        let hash = hash_password("Str0ng#Pass1".to_string()).await.unwrap();
        let valid = verify_password("Str0ng#Pass1".to_string(), hash.clone())
            .await
            .unwrap();
        assert!(valid);

        let invalid = verify_password("WrongPass#1".to_string(), hash)
            .await
            .unwrap();
        assert!(!invalid);
    }
}
