// 报告模板数据模型

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
    pub content: String, // Handlebars 模板内容
    #[serde(rename = "isBuiltin")]
    pub is_builtin: bool, // 内置模板不可删除
    #[serde(rename = "isDefault", default)]
    pub is_default: bool, // 该类型的默认模板
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

impl ReportTemplate {
    /// 创建自定义模板（已弃用，请改用 new_user_template）
    pub fn new_custom(name: String, content: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            template_type: TemplateType::Custom,
            content,
            is_builtin: false,
            is_default: false,
            created_at: now,
            updated_at: now,
        }
    }

    /// 创建指定类型的用户自定义模板
    pub fn new_user_template(name: String, template_type: TemplateType, content: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            template_type,
            content,
            is_builtin: false,
            is_default: false,
            created_at: now,
            updated_at: now,
        }
    }

    /// 创建内置模板（用于周报/月报默认模板）
    pub fn new_builtin(id: String, name: String, template_type: TemplateType, content: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id,
            name,
            template_type,
            content,
            is_builtin: true,
            is_default: true, // 内置模板默认视为该类型的默认模板
            created_at: now,
            updated_at: now,
        }
    }

    /// 更新模板内容及时间戳
    pub fn update_content(&mut self, new_content: String) {
        self.content = new_content;
        self.updated_at = chrono::Utc::now().timestamp();
    }

    /// 更新模板名称及时间戳
    pub fn update_name(&mut self, new_name: String) {
        self.name = new_name;
        self.updated_at = chrono::Utc::now().timestamp();
    }
}
