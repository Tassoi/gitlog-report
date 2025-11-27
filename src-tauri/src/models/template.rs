// Report template data model

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TemplateType {
    Weekly,
    Monthly,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportTemplate {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub template_type: TemplateType,
    pub content: String, // Handlebars template content
    #[serde(rename = "isBuiltin")]
    pub is_builtin: bool, // Built-in templates cannot be deleted
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

impl ReportTemplate {
    /// Creates a new custom template
    pub fn new_custom(name: String, content: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            template_type: TemplateType::Custom,
            content,
            is_builtin: false,
            created_at: now,
            updated_at: now,
        }
    }

    /// Creates a built-in template (used for weekly/monthly defaults)
    pub fn new_builtin(id: String, name: String, template_type: TemplateType, content: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id,
            name,
            template_type,
            content,
            is_builtin: true,
            created_at: now,
            updated_at: now,
        }
    }

    /// Updates the template content and timestamp
    pub fn update_content(&mut self, new_content: String) {
        self.content = new_content;
        self.updated_at = chrono::Utc::now().timestamp();
    }

    /// Updates the template name and timestamp
    pub fn update_name(&mut self, new_name: String) {
        self.name = new_name;
        self.updated_at = chrono::Utc::now().timestamp();
    }
}
