// Report-related data models

use serde::{Deserialize, Serialize};
use super::commit::Commit;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ReportType {
    Weekly,
    Monthly,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report {
    pub id: String,
    #[serde(rename = "type")]
    pub report_type: ReportType,
    #[serde(rename = "generatedAt")]
    pub generated_at: i64,
    pub content: String,
    pub commits: Vec<Commit>,
}
