use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::errors::AppError;
use crate::domain::types::{Currency, EntryType};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expense {
    pub id: Uuid,
    pub user_id: Uuid,
    pub amount: f64,
    pub currency: String,
    pub category: String,
    pub description: String,
    pub date: NaiveDate,
    pub entry_type: String,
    pub quantity: Option<f64>,
    pub unit: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub created_by: String,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub updated_by: String,
    pub deleted_at: Option<chrono::DateTime<chrono::Utc>>,
    pub deleted_by: Option<String>,
}

impl Expense {
    #[must_use]
    pub fn currency(&self) -> Currency {
        Currency::parse_from_str(&self.currency).unwrap_or(Currency::Usd)
    }

    #[must_use]
    pub fn entry_type(&self) -> EntryType {
        EntryType::parse_str(&self.entry_type).unwrap_or(EntryType::Expense)
    }

    #[must_use]
    pub fn display_amount(&self) -> String {
        self.currency().format_amount(self.amount)
    }
}

/// Parse a currency amount string into a float storage value.
/// USD: "10.50" -> 10.5, IDR: "150000" -> 150000.0
pub fn parse_amount(currency: &Currency, input: &str) -> Result<f64, AppError> {
    // Reject negative amounts
    if input.starts_with('-') {
        return Err(AppError::Validation {
            field: "amount".to_string(),
            message: "must not be negative".to_string(),
        });
    }

    let decimal_places = currency.decimal_places();

    match decimal_places {
        0 => {
            // IDR: whole numbers only, no decimal point allowed
            if input.contains('.') {
                return Err(AppError::Validation {
                    field: "amount".to_string(),
                    message: format!("{} does not support decimal places", currency.as_str()),
                });
            }
            input
                .parse::<i64>()
                .map(|v| v as f64)
                .map_err(|_| AppError::Validation {
                    field: "amount".to_string(),
                    message: "invalid amount".to_string(),
                })
        }
        places => {
            // USD: exactly `places` decimal digits
            if let Some(dot_pos) = input.find('.') {
                let frac_part = &input[dot_pos + 1..];
                if frac_part.len() != places as usize {
                    return Err(AppError::Validation {
                        field: "amount".to_string(),
                        message: format!(
                            "{} requires exactly {} decimal places",
                            currency.as_str(),
                            places
                        ),
                    });
                }
                input.parse::<f64>().map_err(|_| AppError::Validation {
                    field: "amount".to_string(),
                    message: "invalid amount".to_string(),
                })
            } else {
                // No decimal point — treat as whole number
                input
                    .parse::<i64>()
                    .map(|v| v as f64)
                    .map_err(|_| AppError::Validation {
                        field: "amount".to_string(),
                        message: "invalid amount".to_string(),
                    })
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_usd_two_decimals() {
        assert_eq!(parse_amount(&Currency::Usd, "10.50").unwrap(), 10.5);
        assert_eq!(parse_amount(&Currency::Usd, "3000.00").unwrap(), 3000.0);
    }

    #[test]
    fn parse_idr_whole_number() {
        assert_eq!(parse_amount(&Currency::Idr, "150000").unwrap(), 150_000.0);
    }

    #[test]
    fn parse_negative_amount() {
        assert!(parse_amount(&Currency::Usd, "-10.00").is_err());
    }

    #[test]
    fn parse_usd_wrong_decimals() {
        assert!(parse_amount(&Currency::Usd, "10.5").is_err());
        assert!(parse_amount(&Currency::Usd, "10.500").is_err());
    }

    #[test]
    fn parse_idr_with_decimal() {
        assert!(parse_amount(&Currency::Idr, "1500.00").is_err());
    }

    #[test]
    fn parse_invalid_string() {
        assert!(parse_amount(&Currency::Usd, "abc").is_err());
    }

    #[test]
    fn parse_usd_no_decimal() {
        // "10" USD -> 10.0
        assert_eq!(parse_amount(&Currency::Usd, "10").unwrap(), 10.0);
    }
}
