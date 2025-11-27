// Template service - manages report templates

use crate::models::{ReportTemplate, TemplateType};
use std::collections::HashMap;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const TEMPLATES_STORE_KEY: &str = "templates";

pub struct TemplateService;

impl TemplateService {
    /// Gets all templates (built-in + custom)
    pub fn list_templates(app: &AppHandle) -> Result<Vec<ReportTemplate>, String> {
        let mut templates = Vec::new();

        // Add built-in templates
        templates.push(Self::get_builtin_weekly());
        templates.push(Self::get_builtin_monthly());

        // Load custom templates from store
        let custom_templates = Self::load_custom_templates(app)?;
        templates.extend(custom_templates);

        // Sort by creation time (newest first)
        templates.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(templates)
    }

    /// Gets a template by ID
    pub fn get_template(app: &AppHandle, id: &str) -> Result<ReportTemplate, String> {
        // Check built-in templates first
        if id == "builtin-weekly" {
            return Ok(Self::get_builtin_weekly());
        }
        if id == "builtin-monthly" {
            return Ok(Self::get_builtin_monthly());
        }

        // Search in custom templates
        let custom_templates = Self::load_custom_templates(app)?;
        custom_templates
            .into_iter()
            .find(|t| t.id == id)
            .ok_or_else(|| format!("Template not found: {}", id))
    }

    /// Creates a new custom template
    pub fn create_template(
        app: &AppHandle,
        name: String,
        content: String,
    ) -> Result<ReportTemplate, String> {
        let template = ReportTemplate::new_custom(name, content);

        // Load existing templates
        let mut templates = Self::load_custom_templates(app)?;
        templates.push(template.clone());

        // Save to store
        Self::save_custom_templates(app, &templates)?;

        Ok(template)
    }

    /// Updates an existing custom template
    pub fn update_template(
        app: &AppHandle,
        id: String,
        name: Option<String>,
        content: Option<String>,
    ) -> Result<ReportTemplate, String> {
        // Cannot update built-in templates
        if id.starts_with("builtin-") {
            return Err("Cannot update built-in templates".to_string());
        }

        // Load templates
        let mut templates = Self::load_custom_templates(app)?;

        // Find and update the template
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

        // Save to store
        Self::save_custom_templates(app, &templates)?;

        Ok(updated_template)
    }

    /// Deletes a custom template
    pub fn delete_template(app: &AppHandle, id: &str) -> Result<(), String> {
        // Cannot delete built-in templates
        if id.starts_with("builtin-") {
            return Err("Cannot delete built-in templates".to_string());
        }

        // Load templates
        let mut templates = Self::load_custom_templates(app)?;

        // Find the template
        let index = templates
            .iter()
            .position(|t| t.id == id)
            .ok_or_else(|| format!("Template not found: {}", id))?;

        // Remove it
        templates.remove(index);

        // Save to store
        Self::save_custom_templates(app, &templates)?;

        Ok(())
    }

    /// Gets the built-in weekly template
    fn get_builtin_weekly() -> ReportTemplate {
        ReportTemplate::new_builtin(
            "builtin-weekly".to_string(),
            "默认周报模板".to_string(),
            TemplateType::Weekly,
            include_str!("../templates/weekly.hbs").to_string(),
        )
    }

    /// Gets the built-in monthly template
    fn get_builtin_monthly() -> ReportTemplate {
        ReportTemplate::new_builtin(
            "builtin-monthly".to_string(),
            "默认月报模板".to_string(),
            TemplateType::Monthly,
            include_str!("../templates/monthly.hbs").to_string(),
        )
    }

    /// Loads custom templates from tauri-plugin-store
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

    /// Saves custom templates to tauri-plugin-store
    fn save_custom_templates(
        app: &AppHandle,
        templates: &[ReportTemplate],
    ) -> Result<(), String> {
        let store = app
            .store("templates.json")
            .map_err(|e| format!("Failed to access store: {}", e))?;

        let value = serde_json::to_value(templates)
            .map_err(|e| format!("Failed to serialize templates: {}", e))?;

        store
            .set(TEMPLATES_STORE_KEY.to_string(), value)
            .map_err(|e| format!("Failed to save templates: {}", e))?;

        store
            .save()
            .map_err(|e| format!("Failed to persist store: {}", e))?;

        Ok(())
    }
}
