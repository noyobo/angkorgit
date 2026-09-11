// Comprehensive audit logging to daily files
use std::fs::{File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use chrono::{Local, Datelike};
use serde::{Deserialize, Serialize};
use once_cell::sync::Lazy;

static LOG_DIR: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub category: String,
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

pub fn write_log(entry: LogEntry) -> Result<(), String> {
    let path = today_log_path().ok_or("Logger not initialized")?;
    
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;
    
    let json = serde_json::to_string(&entry)
        .map_err(|e| format!("Failed to serialize log entry: {}", e))?;
    
    writeln!(file, "{}", json)
        .map_err(|e| format!("Failed to write log entry: {}", e))?;
    
    Ok(())
}

pub fn open_logs_folder() -> Result<(), String> {
    let dir = LOG_DIR.lock().unwrap();
    let dir = dir.as_ref().ok_or("Logger not initialized")?;
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open logs folder: {}", e))?;
    }
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("Failed to open logs folder: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
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
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open log file: {}", e))?;
    }
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("notepad")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open log file: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open log file: {}", e))?;
    }
    
    Ok(())
}
