// Native system menu following GitHub Desktop's grouping model
// Adapted for AngKorGit's capabilities and keyboard shortcuts
//
// Shortcut conflicts with AngKorGit (deliberately NOT matching Desktop):
// - Cmd+B: AngKorGit = sidebar toggle; Desktop = branches list
//   → Branches accessible via palette/menu only (no global shortcut)
// - Cmd+Shift+W: AngKorGit = close all tabs; Desktop = new worktree
//   → New Worktree keeps menu entry, no conflicting shortcut
// - Cmd+Shift+O: Desktop = clone; AngKorGit leaves unbound for now
// - Cmd+I: Desktop = create issue; AngKorGit leaves unbound (forge-dependent)
// - Cmd+Alt+W: Desktop = show worktrees; AngKorGit leaves unbound

use tauri::{
    menu::{Menu, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Manager, Runtime, Emitter,
};

const IS_MACOS: bool = cfg!(target_os = "macos");

pub fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let mut builder = MenuBuilder::new(app);

    // macOS Application menu
    if IS_MACOS {
        let app_menu = SubmenuBuilder::new(app, "AngKorGit")
            .text("about", "About AngKorGit")
            .separator()
            .text_with_id("settings", "settings", "Settings…", true, Some("CmdOrCtrl+,"))
            .separator()
            .text("install-cli", "Install Command Line Tool…")
            .separator()
            .item(&PredefinedMenuItem::services(app, None)?)
            .separator()
            .item(&PredefinedMenuItem::hide(app, None)?)
            .item(&PredefinedMenuItem::hide_others(app, None)?)
            .item(&PredefinedMenuItem::show_all(app, None)?)
            .separator()
            .text_with_id("quit", "quit", "Quit AngKorGit", true, Some("CmdOrCtrl+Q"))
            .build()?;
        builder = builder.item(&app_menu);
    }

    // File menu
    let mut file_menu = SubmenuBuilder::new(app, if IS_MACOS { "File" } else { "&File" })
        .text_with_id("open-repo", "open-repo", if IS_MACOS { "Open Repository…" } else { "&Open repository…" }, true, Some("CmdOrCtrl+O"))
        .separator()
        .text_with_id("clone-repo", "clone-repo", if IS_MACOS { "Clone Repository…" } else { "Clo&ne repository…" }, true, None);

    if !IS_MACOS {
        file_menu = file_menu
            .separator()
            .text_with_id("settings", "settings", "&Options…", true, Some("CmdOrCtrl+,"))
            .separator()
            .text_with_id("quit", "quit", "E&xit", true, Some("CmdOrCtrl+Q"));
    }
    builder = builder.item(&file_menu.build()?);

    // Edit menu
    let edit_menu = SubmenuBuilder::new(app, if IS_MACOS { "Edit" } else { "&Edit" })
        .item(&PredefinedMenuItem::undo(app, None)?)
        .item(&PredefinedMenuItem::redo(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, None)?)
        .item(&PredefinedMenuItem::copy(app, None)?)
        .item(&PredefinedMenuItem::paste(app, None)?)
        .item(&PredefinedMenuItem::select_all(app, None)?)
        .separator()
        .text_with_id("find", "find", if IS_MACOS { "Find" } else { "&Find" }, true, Some("CmdOrCtrl+F"))
        .build()?;
    builder = builder.item(&edit_menu);

    // View menu - Desktop-aligned shortcuts
    let view_menu = SubmenuBuilder::new(app, if IS_MACOS { "View" } else { "&View" })
        // Note: Cmd+1/Cmd+2 are reserved for tab switching in AngKorGit (multi-repo feature)
        // Desktop uses these for Changes/History views, but we have tabs instead
        .text_with_id("show-changes", "show-changes", if IS_MACOS { "Show Working Copy" } else { "&Working copy" }, true, None)
        .text_with_id("show-history", "show-history", if IS_MACOS { "Show Commit Graph" } else { "&Commit graph" }, true, None)
        .separator()
        .text_with_id("show-tabs", "show-tabs", if IS_MACOS { "Repository Tabs" } else { "Repository &tabs" }, true, Some("CmdOrCtrl+T"))
        .text_with_id("show-branches", "show-branches", if IS_MACOS { "Show Branches List" } else { "&Branches list" }, true, Some("CmdOrCtrl+B")) // Desktop-aligned: Cmd+B for branches
        .text_with_id("show-worktrees", "show-worktrees", if IS_MACOS { "Show Worktrees List" } else { "Wor&ktrees list" }, true, None)
        .separator()
        .text_with_id("go-summary", "go-summary", if IS_MACOS { "Go to Commit Summary" } else { "Go to commit &summary" }, true, Some("CmdOrCtrl+G"))
        .text_with_id("toggle-sidebar", "toggle-sidebar", if IS_MACOS { "Toggle Sidebar" } else { "Toggle &sidebar" }, true, Some("CmdOrCtrl+L")) // REMAPPED from Cmd+B to Cmd+L
        .text_with_id("toggle-terminal", "toggle-terminal", if IS_MACOS { "Toggle Terminal" } else { "Toggle t&erminal" }, true, Some("CmdOrCtrl+`"))
        .separator()
        .text_with_id("zoom-in", "zoom-in", if IS_MACOS { "Zoom In" } else { "Zoom in" }, true, Some("CmdOrCtrl+="))
        .text_with_id("zoom-out", "zoom-out", if IS_MACOS { "Zoom Out" } else { "Zoom out" }, true, Some("CmdOrCtrl+-"))
        .text_with_id("zoom-reset", "zoom-reset", if IS_MACOS { "Reset Zoom" } else { "Reset zoom" }, true, Some("CmdOrCtrl+0"))
        .separator()
        .item(&PredefinedMenuItem::fullscreen(app, None)?)
        .separator()
        .text_with_id("dev-tools", "dev-tools", if IS_MACOS { "Toggle Developer Tools" } else { "Toggle &developer tools" }, true, Some(if IS_MACOS { "Alt+Cmd+I" } else { "Ctrl+Shift+I" }))
        .build()?;
    builder = builder.item(&view_menu);

    // Repository menu
    let repo_menu = SubmenuBuilder::new(app, if IS_MACOS { "Repository" } else { "&Repository" })
        .text_with_id("push", "push", if IS_MACOS { "Push" } else { "P&ush" }, true, Some("CmdOrCtrl+P"))
        .text_with_id("pull", "pull", if IS_MACOS { "Pull" } else { "Pu&ll" }, true, Some("CmdOrCtrl+Shift+P"))
        .text_with_id("fetch", "fetch", if IS_MACOS { "Fetch" } else { "&Fetch" }, true, Some("CmdOrCtrl+Shift+T"))
        .separator()
        .text_with_id("open-in-terminal", "open-in-terminal", if IS_MACOS { "Open in Terminal" } else { "Open in &terminal" }, true, Some("Ctrl+`"))
        .text_with_id("open-in-finder", "open-in-finder", if IS_MACOS { "Show in Finder" } else { if cfg!(windows) { "Show in E&xplorer" } else { "Show in file manager" } }, true, Some("CmdOrCtrl+Shift+F"))
        .text_with_id("open-in-editor", "open-in-editor", if IS_MACOS { "Open in External Editor" } else { "Open in e&xternal editor" }, true, Some("CmdOrCtrl+Shift+A"))
        .separator()
        .text_with_id("view-on-forge", "view-on-forge", if IS_MACOS { "View on Forge" } else { "&View on forge" }, true, Some("CmdOrCtrl+Shift+G"))
        .separator()
        .text_with_id("new-worktree", "new-worktree", if IS_MACOS { "New Worktree…" } else { "New work&tree…" }, true, None) // NO shortcut (⌘⇧W = close tabs)
        .separator()
        .text_with_id("refresh", "refresh", if IS_MACOS { "Refresh" } else { "&Refresh" }, true, Some("CmdOrCtrl+R"))
        .text_with_id("close-all-tabs", "close-all-tabs", if IS_MACOS { "Close All Tabs" } else { "Close all &tabs" }, true, Some("CmdOrCtrl+Shift+W"))
        .build()?;
    builder = builder.item(&repo_menu);

    // Branch menu
    let branch_menu = SubmenuBuilder::new(app, if IS_MACOS { "Branch" } else { "&Branch" })
        .text_with_id("new-branch", "new-branch", if IS_MACOS { "New Branch…" } else { "New &branch…" }, true, Some("CmdOrCtrl+Shift+N"))
        .text_with_id("rename-branch", "rename-branch", if IS_MACOS { "Rename Branch…" } else { "&Rename branch…" }, true, Some("CmdOrCtrl+Shift+R"))
        .text_with_id("delete-branch", "delete-branch", if IS_MACOS { "Delete Branch…" } else { "&Delete branch…" }, true, Some("CmdOrCtrl+Shift+D"))
        .separator()
        .text_with_id("discard-all", "discard-all", if IS_MACOS { "Discard All Changes…" } else { "Discard all changes…" }, true, None)
        .text_with_id("stash-changes", "stash-changes", if IS_MACOS { "Stash Changes…" } else { "&Stash changes…" }, true, Some("CmdOrCtrl+Shift+S"))
        .separator()
        .text_with_id("merge-branch", "merge-branch", if IS_MACOS { "Merge into Current Branch…" } else { "&Merge into current branch…" }, true, Some("CmdOrCtrl+Shift+M"))
        .text_with_id("rebase-branch", "rebase-branch", if IS_MACOS { "Rebase Current Branch…" } else { "R&ebase current branch…" }, true, None)
        .separator()
        .text_with_id("create-pr", "create-pr", if IS_MACOS { "Create Pull Request" } else { "Create &pull request" }, true, None)
        .build()?;
    builder = builder.item(&branch_menu);

    // Window menu (macOS)
    if IS_MACOS {
        let window_menu = SubmenuBuilder::new(app, "Window")
            .item(&PredefinedMenuItem::minimize(app, None)?)
            .item(&PredefinedMenuItem::maximize(app, None)?)
            .item(&PredefinedMenuItem::close_window(app, None)?)
            .separator()
            .text_with_id("close-all-tabs-win", "close-all-tabs", "Close All Tabs", true, Some("CmdOrCtrl+Shift+W"))
            .build()?;
        builder = builder.item(&window_menu);
    }

    // Help menu
    let mut help_menu = SubmenuBuilder::new(app, if IS_MACOS { "Help" } else { "&Help" })
        .text("show-docs", if IS_MACOS { "Documentation" } else { "&Documentation" })
        .text("show-shortcuts", if IS_MACOS { "Keyboard Shortcuts" } else { "&Keyboard shortcuts" })
        .text("report-issue", if IS_MACOS { "Report Issue…" } else { "Report &issue…" })
        .text("show-logs", if IS_MACOS { "Show Logs in Finder" } else { if cfg!(windows) { "Show logs in Explorer" } else { "Show logs" } });

    if !IS_MACOS {
        help_menu = help_menu
            .separator()
            .text("about", "&About AngKorGit");
    }
    builder = builder.item(&help_menu.build()?);

    builder.build()
}

pub fn handle_menu_event<R: Runtime>(app: &AppHandle<R>, id: &str) {
    // Handle system-level actions directly
    match id {
        "quit" => {
            app.exit(0);
        }
        "dev-tools" => {
            if let Some(window) = app.get_webview_window("main") {
                if window.is_devtools_open() {
                    let _ = window.close_devtools();
                } else {
                    let _ = window.open_devtools();
                }
            }
        }
        // All other events forwarded to frontend via menu-event
        _ => {
            let _ = app.emit("menu-event", id);
        }
    }
}
