// Comprehensive audit logging to daily files
use chrono::Local;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

static LOG_DIR: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub layer: String, // ui|menu|ipc|git|rust|system
    #[serde(rename = "type")]
    pub log_type: String, // key|click|cmd|stdout|stderr|push|lifecycle
    pub level: String, // debug|info|warn|error
    pub message: String,
    pub meta: Option<serde_json::Value>,
}

pub fn init_logger(config_dir: PathBuf) {
    let log_dir = config_dir.join("logs");
    if let Err(e) = std::fs::create_dir_all(&log_dir) {
        eprintln!("Failed to create logs directory: {}", e);
        return;
    }
    *LOG_DIR.lock().unwrap() = Some(log_dir);
}

fn today_log_path() -> Option<PathBuf> {
    let dir = LOG_DIR.lock().unwrap();
    let dir = dir.as_ref()?;
    let today = Local::now().format("%Y-%m-%d").to_string();
    Some(dir.join(format!("{}.log", today)))
}

fn format_meta_as_kv(meta: &Option<serde_json::Value>) -> String {
    match meta {
        None => String::new(),
        Some(serde_json::Value::Object(map)) => {
            let pairs: Vec<String> = map.iter().map(|(k, v)| format!("{}={}", k, v)).collect();
            if pairs.is_empty() {
                String::new()
            } else {
                format!(" {}", pairs.join(" "))
            }
        }
        _ => String::new(),
    }
}

pub fn write_log(entry: LogEntry) -> Result<(), String> {
    let path = today_log_path().ok_or("Logger not initialized")?;

    // Format: [timestamp] [layer] [type] [level] message key=value…
    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    let kv = format_meta_as_kv(&entry.meta);
    let line = format!(
        "[{}] [{}] [{}] [{}] {}{}",
        timestamp, entry.layer, entry.log_type, entry.level, entry.message, kv
    );

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;

    writeln!(file, "{}", line).map_err(|e| format!("Failed to write log entry: {}", e))?;

    Ok(())
}

pub fn open_logs_folder() -> Result<(), String> {
    let dir = LOG_DIR.lock().unwrap();
    let dir = dir.as_ref().ok_or("Logger not initialized")?;

    #[cfg(target_os = "macos")]
    {
        crate::proc::hidden("open")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open logs folder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        crate::proc::hidden("explorer")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open logs folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        crate::proc::hidden("xdg-open")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open logs folder: {}", e))?;
    }

    Ok(())
}

pub fn open_today_log() -> Result<(), String> {
    let path = today_log_path().ok_or("Logger not initialized")?;

    if !path.exists() {
        return Err("No log file for today yet".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        crate::proc::hidden("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open log file: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        crate::proc::hidden("notepad")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open log file: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        crate::proc::hidden("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open log file: {}", e))?;
    }

    Ok(())
}
