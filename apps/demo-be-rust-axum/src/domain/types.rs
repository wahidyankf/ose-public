use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Currency {
    Usd,
    Idr,
}

impl Currency {
    /// Returns the number of decimal places for display.
    #[must_use]
    pub fn decimal_places(&self) -> u32 {
        match self {
            Currency::Usd => 2,
            Currency::Idr => 0,
        }
    }

    /// Format a float amount as a display string.
    #[must_use]
    pub fn format_amount(&self, stored: f64) -> String {
        match self {
            Currency::Usd => format!("{:.2}", stored),
            Currency::Idr => format!("{:.0}", stored),
        }
    }

    pub fn parse_from_str(s: &str) -> Option<Currency> {
        match s {
            "USD" => Some(Currency::Usd),
            "IDR" => Some(Currency::Idr),
            _ => None,
        }
    }

    #[must_use]
    pub fn as_str(&self) -> &'static str {
        match self {
            Currency::Usd => "USD",
            Currency::Idr => "IDR",
        }
    }
}

impl fmt::Display for Currency {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Role {
    User,
    Admin,
}

impl fmt::Display for Role {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Role::User => write!(f, "USER"),
            Role::Admin => write!(f, "ADMIN"),
        }
    }
}

impl Role {
    pub fn parse_str(s: &str) -> Option<Role> {
        match s {
            "USER" => Some(Role::User),
            "ADMIN" => Some(Role::Admin),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserStatus {
    Active,
    Inactive,
    Disabled,
    Locked,
}

impl fmt::Display for UserStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            UserStatus::Active => write!(f, "ACTIVE"),
            UserStatus::Inactive => write!(f, "INACTIVE"),
            UserStatus::Disabled => write!(f, "DISABLED"),
            UserStatus::Locked => write!(f, "LOCKED"),
        }
    }
}

impl UserStatus {
    pub fn parse_str(s: &str) -> Option<UserStatus> {
        match s {
            "ACTIVE" => Some(UserStatus::Active),
            "INACTIVE" => Some(UserStatus::Inactive),
            "DISABLED" => Some(UserStatus::Disabled),
            "LOCKED" => Some(UserStatus::Locked),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EntryType {
    Expense,
    Income,
}

impl fmt::Display for EntryType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EntryType::Expense => write!(f, "expense"),
            EntryType::Income => write!(f, "income"),
        }
    }
}

impl EntryType {
    pub fn parse_str(s: &str) -> Option<EntryType> {
        match s {
            "expense" => Some(EntryType::Expense),
            "income" => Some(EntryType::Income),
            _ => None,
        }
    }
}

/// Supported units of measure.
pub const SUPPORTED_UNITS: &[&str] = &[
    "liter", "ml", "kg", "g", "km", "meter", "gallon", "lb", "oz", "mile", "piece", "hour",
];

pub fn is_supported_unit(unit: &str) -> bool {
    SUPPORTED_UNITS.contains(&unit)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn currency_usd_decimal_places() {
        assert_eq!(Currency::Usd.decimal_places(), 2);
    }

    #[test]
    fn currency_idr_decimal_places() {
        assert_eq!(Currency::Idr.decimal_places(), 0);
    }

    #[test]
    fn currency_format_usd() {
        assert_eq!(Currency::Usd.format_amount(10.50), "10.50");
        assert_eq!(Currency::Usd.format_amount(3000.00), "3000.00");
    }

    #[test]
    fn currency_format_idr() {
        assert_eq!(Currency::Idr.format_amount(150000.0), "150000");
    }

    #[test]
    fn currency_parse_from_str() {
        assert_eq!(Currency::parse_from_str("USD"), Some(Currency::Usd));
        assert_eq!(Currency::parse_from_str("IDR"), Some(Currency::Idr));
        assert_eq!(Currency::parse_from_str("EUR"), None);
        assert_eq!(Currency::parse_from_str("US"), None);
    }

    #[test]
    fn supported_units() {
        assert!(is_supported_unit("liter"));
        assert!(is_supported_unit("gallon"));
        assert!(!is_supported_unit("fathom"));
    }

    #[test]
    fn role_display() {
        assert_eq!(Role::User.to_string(), "USER");
        assert_eq!(Role::Admin.to_string(), "ADMIN");
    }

    #[test]
    fn user_status_display() {
        assert_eq!(UserStatus::Active.to_string(), "ACTIVE");
        assert_eq!(UserStatus::Locked.to_string(), "LOCKED");
    }

    #[test]
    fn entry_type_display() {
        assert_eq!(EntryType::Expense.to_string(), "expense");
        assert_eq!(EntryType::Income.to_string(), "income");
    }
}
