use std::path::{Path, PathBuf};
use std::process::Command;

use git2::Repository;

use crate::error::{AppError, AppResult};

fn hook_path(repo: &Repository, name: &str) -> Option<PathBuf> {
    let git_dir = repo.path();
    let hook = git_dir.join("hooks").join(name);
    if hook.exists() && is_executable(&hook) {
        Some(hook)
    } else {
        None
    }
}

#[cfg(unix)]
fn is_executable(path: &Path) -> bool {
    use std::os::unix::fs::PermissionsExt;
    path.metadata()
        .ok()
        .map(|m| m.permissions().mode() & 0o111 != 0)
        .unwrap_or(false)
}

#[cfg(not(unix))]
fn is_executable(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| matches!(e, "exe" | "bat" | "cmd"))
        .unwrap_or(false)
        || !path.extension().is_some()
}

pub fn run_pre_commit(repo: &Repository) -> AppResult<()> {
    if let Some(hook) = hook_path(repo, "pre-commit") {
        let workdir = repo
            .workdir()
            .ok_or_else(|| AppError::other("cannot run pre-commit in a bare repository"))?;
        let output = crate::proc::hidden(&hook)
            .current_dir(workdir)
            .env("GIT_INDEX_FILE", repo.path().join("index"))
            .output()
            .map_err(|e| AppError::other(format!("could not run pre-commit hook: {e}")))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::other(format!(
                "pre-commit hook failed:\n{}",
                stderr.trim()
            )));
        }
    }
    Ok(())
}

pub fn run_commit_msg(repo: &Repository, message_file: &Path) -> AppResult<()> {
    if let Some(hook) = hook_path(repo, "commit-msg") {
        let workdir = repo
            .workdir()
            .ok_or_else(|| AppError::other("cannot run commit-msg in a bare repository"))?;
        let output = crate::proc::hidden(&hook)
            .arg(message_file)
            .current_dir(workdir)
            .output()
            .map_err(|e| AppError::other(format!("could not run commit-msg hook: {e}")))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::other(format!(
                "commit-msg hook failed:\n{}",
                stderr.trim()
            )));
        }
    }
    Ok(())
}

pub fn run_pre_push(
    repo: &Repository,
    remote_name: &str,
    remote_url: &str,
    refspecs: &[String],
) -> AppResult<()> {
    if let Some(hook) = hook_path(repo, "pre-push") {
        let workdir = repo
            .workdir()
            .ok_or_else(|| AppError::other("cannot run pre-push in a bare repository"))?;
        
        let stdin_content = refspecs
            .iter()
            .filter_map(|spec| {
                if spec.starts_with(':') {
                    return None;
                }
                let parts: Vec<&str> = spec.trim_start_matches('+').split(':').collect();
                if parts.len() == 2 {
                    let local_ref = parts[0];
                    let remote_ref = parts[1];
                    if let Ok(local_obj) = repo.revparse_single(local_ref) {
                        let local_sha = local_obj.id();
                        let remote_sha = repo
                            .find_reference(remote_ref)
                            .ok()
                            .and_then(|r| r.target())
                            .unwrap_or_else(git2::Oid::zero);
                        return Some(format!(
                            "{} {} {} {}\n",
                            local_ref, local_sha, remote_ref, remote_sha
                        ));
                    }
                }
                None
            })
            .collect::<String>();

        let mut child = crate::proc::hidden(&hook)
            .args([remote_name, remote_url])
            .current_dir(workdir)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| AppError::other(format!("could not run pre-push hook: {e}")))?;

        if let Some(mut stdin) = child.stdin.take() {
            use std::io::Write;
            let _ = stdin.write_all(stdin_content.as_bytes());
        }

        let output = child
            .wait_with_output()
            .map_err(|e| AppError::other(format!("pre-push hook failed: {e}")))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::other(format!(
                "pre-push hook failed:\n{}",
                stderr.trim()
            )));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(unix)]
    #[test]
    fn executable_check_requires_exec_bit_on_unix() {
        let temp = std::env::temp_dir().join("hook-test");
        std::fs::write(&temp, "#!/bin/sh\necho test").ok();
        assert!(!is_executable(&temp));
        std::fs::remove_file(&temp).ok();
    }

    #[cfg(windows)]
    #[test]
    fn executable_check_recognizes_windows_extensions() {
        assert!(is_executable(Path::new("hook.exe")));
        assert!(is_executable(Path::new("hook.bat")));
        assert!(is_executable(Path::new("hook.cmd")));
        assert!(!is_executable(Path::new("hook.txt")));
    }
}
