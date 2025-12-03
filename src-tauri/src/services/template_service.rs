// 模板服务：负责管理报告模板

use crate::models::{ReportTemplate, TemplateType};
use std::collections::HashMap;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const TEMPLATES_STORE_KEY: &str = "templates";

pub struct TemplateService;

impl TemplateService {
    /// 获取所有模板（包含内置与自定义）
    pub fn list_templates(app: &AppHandle) -> Result<Vec<ReportTemplate>, String> {
        let mut templates = Vec::new();

        // 添加内置模板
        templates.push(Self::get_builtin_weekly());
        templates.push(Self::get_builtin_monthly());

        // 从存储中加载自定义模板
        let custom_templates = Self::load_custom_templates(app)?;
        templates.extend(custom_templates);

        // 按创建时间排序（最新在前）
        templates.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(templates)
    }

    /// 通过 ID 获取模板
    pub fn get_template(app: &AppHandle, id: &str) -> Result<ReportTemplate, String> {
        // 先检查内置模板
        if id == "builtin-weekly" {
            return Ok(Self::get_builtin_weekly());
        }
        if id == "builtin-monthly" {
            return Ok(Self::get_builtin_monthly());
        }

        // 在自定义模板中查找
        let custom_templates = Self::load_custom_templates(app)?;
        custom_templates
            .into_iter()
            .find(|t| t.id == id)
            .ok_or_else(|| format!("Template not found: {}", id))
    }

    /// 创建新的自定义模板
    pub fn create_template(
        app: &AppHandle,
        name: String,
        template_type: TemplateType,
        content: String,
    ) -> Result<ReportTemplate, String> {
        let template = ReportTemplate::new_user_template(name, template_type, content);

        // 载入已有模板
        let mut templates = Self::load_custom_templates(app)?;
        templates.push(template.clone());

        // 保存到存储
        Self::save_custom_templates(app, &templates)?;

        Ok(template)
    }

    /// 更新已有的自定义模板
    pub fn update_template(
        app: &AppHandle,
        id: String,
        name: Option<String>,
        content: Option<String>,
) -> Result<ReportTemplate, String> {
        // 禁止修改内置模板
        if id.starts_with("builtin-") {
            return Err("Cannot update built-in templates".to_string());
        }

        // 加载模板列表
        let mut templates = Self::load_custom_templates(app)?;

        // 查找并更新目标模板
        let template = templates
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or_else(|| format!("Template not found: {}", id))?;

        if let Some(new_name) = name {
            template.update_name(new_name);
        }
        if let Some(new_content) = content {
            template.update_content(new_content);
        }

        let updated_template = template.clone();

        // 保存到存储
        Self::save_custom_templates(app, &templates)?;

        Ok(updated_template)
    }

    /// 删除自定义模板
    pub fn delete_template(app: &AppHandle, id: &str) -> Result<(), String> {
        // 禁止删除内置模板
        if id.starts_with("builtin-") {
            return Err("Cannot delete built-in templates".to_string());
        }

        // 加载模板列表
        let mut templates = Self::load_custom_templates(app)?;

        // 定位目标模板
        let index = templates
            .iter()
            .position(|t| t.id == id)
            .ok_or_else(|| format!("Template not found: {}", id))?;

        // 删除该模板
        templates.remove(index);

        // 保存到存储
        Self::save_custom_templates(app, &templates)?;

        Ok(())
    }

    /// 将模板标记为对应类型的默认值
    /// 若某模板成为默认，同类型其他模板会被取消默认状态
    pub fn set_default_template(app: &AppHandle, id: String) -> Result<(), String> {
        // 先获取模板以确认类型
        let template = Self::get_template(app, &id)?;
        let template_type = template.template_type.clone();

        // 处理内置模板场景
        if id.starts_with("builtin-") {
            // 内置模板始终为默认，只需清除其他模板的默认标记
            let mut custom_templates = Self::load_custom_templates(app)?;
            for t in custom_templates.iter_mut() {
                if t.template_type == template_type {
                    t.is_default = false;
                }
            }
            Self::save_custom_templates(app, &custom_templates)?;
            return Ok(());
        }

        // 针对自定义模板，更新同类型所有条目
        let mut custom_templates = Self::load_custom_templates(app)?;
        let mut found = false;

        for t in custom_templates.iter_mut() {
            if t.template_type == template_type {
                if t.id == id {
                    t.is_default = true;
                    found = true;
                } else {
                    t.is_default = false;
                }
            }
        }

        if !found {
            return Err(format!("Template not found: {}", id));
        }

        Self::save_custom_templates(app, &custom_templates)?;
        Ok(())
    }

    /// 获取指定类型的默认模板
    pub fn get_default_template(
        app: &AppHandle,
        template_type: TemplateType,
    ) -> Result<ReportTemplate, String> {
        // 加载全部模板
        let custom_templates = Self::load_custom_templates(app)?;

        // 优先查找自定义模板中的默认项
        if let Some(default_template) = custom_templates
            .iter()
            .find(|t| t.template_type == template_type && t.is_default)
        {
            return Ok(default_template.clone());
        }

        // 否则退回内置模板
        match template_type {
            TemplateType::Weekly => Ok(Self::get_builtin_weekly()),
            TemplateType::Monthly => Ok(Self::get_builtin_monthly()),
            TemplateType::Custom => {
                Err("No default template found for custom type".to_string())
            }
        }
    }

    /// 获取内置周报模板
    fn get_builtin_weekly() -> ReportTemplate {
        ReportTemplate::new_builtin(
            "builtin-weekly".to_string(),
            "默认周报模板".to_string(),
            TemplateType::Weekly,
            include_str!("../templates/weekly.hbs").to_string(),
        )
    }

    /// 获取内置月报模板
    fn get_builtin_monthly() -> ReportTemplate {
        ReportTemplate::new_builtin(
            "builtin-monthly".to_string(),
            "默认月报模板".to_string(),
            TemplateType::Monthly,
            include_str!("../templates/monthly.hbs").to_string(),
        )
    }

    /// 从 tauri-plugin-store 载入自定义模板
    fn load_custom_templates(app: &AppHandle) -> Result<Vec<ReportTemplate>, String> {
        let store = app
            .store("templates.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;

        match store.get(TEMPLATES_STORE_KEY) {
            Some(value) => {
                serde_json::from_value(value.clone())
                    .map_err(|e| format!("Failed to deserialize templates: {}", e))
            }
            None => Ok(Vec::new()),
        }
    }

    /// 将自定义模板保存到 tauri-plugin-store
    fn save_custom_templates(
        app: &AppHandle,
        templates: &[ReportTemplate],
    ) -> Result<(), String> {
        let store = app
            .store("templates.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;

        let value = serde_json::to_value(templates)
            .map_err(|e| format!("Failed to serialize templates: {}", e))?;

        store.set(TEMPLATES_STORE_KEY.to_string(), value);

        store
            .save()
            .map_err(|e| format!("Failed to persist store: {}", e))?;

        Ok(())
    }
}
