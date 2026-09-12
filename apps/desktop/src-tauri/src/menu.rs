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
    menu::{Menu, MenuBuilder, MenuItem, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Emitter, Manager, Runtime,
};

const IS_MACOS: bool = cfg!(target_os = "macos");

pub fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let mut builder = MenuBuilder::new(app);

    // macOS Application menu
    if IS_MACOS {
        let settings_item =
            MenuItem::with_id(app, "settings", "Settings…", true, Some("CmdOrCtrl+,"))?;
        let quit_item =
            MenuItem::with_id(app, "quit", "Quit AngKorGit", true, Some("CmdOrCtrl+Q"))?;

        let app_menu = SubmenuBuilder::new(app, "AngKorGit")
            .text("about", "About AngKorGit")
            .separator()
            .item(&settings_item)
            .separator()
            .text("install-cli", "Install Command Line Tool…")
            .separator()
            .item(&PredefinedMenuItem::services(app, None)?)
            .separator()
            .item(&PredefinedMenuItem::hide(app, None)?)
            .item(&PredefinedMenuItem::hide_others(app, None)?)
            .item(&PredefinedMenuItem::show_all(app, None)?)
            .separator()
            .item(&quit_item)
            .build()?;
        builder = builder.item(&app_menu);
    }

    // File menu
    let open_repo = MenuItem::with_id(
        app,
        "open-repo",
        if IS_MACOS {
            "Open Repository…"
        } else {
            "&Open repository…"
        },
        true,
        Some("CmdOrCtrl+O"),
    )?;
    let mut file_menu = SubmenuBuilder::new(app, if IS_MACOS { "File" } else { "&File" })
        .item(&open_repo)
        .separator()
        .text(
            "clone-repo",
            if IS_MACOS {
                "Clone Repository…"
            } else {
                "Clo&ne repository…"
            },
        );

    if !IS_MACOS {
        let settings_item =
            MenuItem::with_id(app, "settings", "&Options…", true, Some("CmdOrCtrl+,"))?;
        let quit_item = MenuItem::with_id(app, "quit", "E&xit", true, Some("CmdOrCtrl+Q"))?;
        file_menu = file_menu
            .separator()
            .item(&settings_item)
            .separator()
            .item(&quit_item);
    }
    builder = builder.item(&file_menu.build()?);

    // Edit menu
    let find_item = MenuItem::with_id(
        app,
        "find",
        if IS_MACOS { "Find" } else { "&Find" },
        true,
        Some("CmdOrCtrl+F"),
    )?;
    let edit_menu = SubmenuBuilder::new(app, if IS_MACOS { "Edit" } else { "&Edit" })
        .item(&PredefinedMenuItem::undo(app, None)?)
        .item(&PredefinedMenuItem::redo(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, None)?)
        .item(&PredefinedMenuItem::copy(app, None)?)
        .item(&PredefinedMenuItem::paste(app, None)?)
        .item(&PredefinedMenuItem::select_all(app, None)?)
        .separator()
        .item(&find_item)
        .build()?;
    builder = builder.item(&edit_menu);

    // View menu - Desktop-aligned shortcuts
    let show_tabs = MenuItem::with_id(
        app,
        "show-tabs",
        if IS_MACOS {
            "Repository Tabs"
        } else {
            "Repository &tabs"
        },
        true,
        Some("CmdOrCtrl+T"),
    )?;
    let show_branches = MenuItem::with_id(
        app,
        "show-branches",
        if IS_MACOS {
            "Switch Branch…"
        } else {
            "Switch &branch…"
        },
        true,
        Some("CmdOrCtrl+B"),
    )?;
    let go_summary = MenuItem::with_id(
        app,
        "go-summary",
        if IS_MACOS {
            "Go to Commit Summary"
        } else {
            "Go to commit &summary"
        },
        true,
        Some("CmdOrCtrl+G"),
    )?;
    let toggle_sidebar = MenuItem::with_id(
        app,
        "toggle-sidebar",
        if IS_MACOS {
            "Toggle Sidebar"
        } else {
            "Toggle &sidebar"
        },
        true,
        Some("CmdOrCtrl+L"),
    )?;
    let toggle_terminal = MenuItem::with_id(
        app,
        "toggle-terminal",
        if IS_MACOS {
            "Toggle Terminal"
        } else {
            "Toggle t&erminal"
        },
        true,
        Some("Ctrl+`"),
    )?;
    let zoom_in = MenuItem::with_id(
        app,
        "zoom-in",
        if IS_MACOS { "Zoom In" } else { "Zoom in" },
        true,
        Some("CmdOrCtrl+="),
    )?;
    let zoom_out = MenuItem::with_id(
        app,
        "zoom-out",
        if IS_MACOS { "Zoom Out" } else { "Zoom out" },
        true,
        Some("CmdOrCtrl+-"),
    )?;
    let zoom_reset = MenuItem::with_id(
        app,
        "zoom-reset",
        if IS_MACOS { "Reset Zoom" } else { "Reset zoom" },
        true,
        Some("CmdOrCtrl+0"),
    )?;
    let dev_tools = MenuItem::with_id(
        app,
        "dev-tools",
        if IS_MACOS {
            "Toggle Developer Tools"
        } else {
            "Toggle &developer tools"
        },
        true,
        Some(if IS_MACOS {
            "Alt+Cmd+I"
        } else {
            "Ctrl+Shift+I"
        }),
    )?;

    let view_menu = SubmenuBuilder::new(app, if IS_MACOS { "View" } else { "&View" })
        // Note: Cmd+1/Cmd+2 are reserved for tab switching in AngKorGit (multi-repo feature)
        // Desktop uses these for Changes/History views, but we have tabs instead
        .text(
            "show-changes",
            if IS_MACOS {
                "Show Working Copy"
            } else {
                "&Working copy"
            },
        )
        .text(
            "show-history",
            if IS_MACOS {
                "Show Commit Graph"
            } else {
                "&Commit graph"
            },
        )
        .separator()
        .item(&show_tabs)
        .item(&show_branches)
        .text(
            "show-worktrees",
            if IS_MACOS {
                "Show Worktrees List"
            } else {
                "Wor&ktrees list"
            },
        )
        .separator()
        .item(&go_summary)
        .item(&toggle_sidebar)
        .item(&toggle_terminal)
        .separator()
        .item(&zoom_in)
        .item(&zoom_out)
        .item(&zoom_reset)
        .separator()
        .item(&PredefinedMenuItem::fullscreen(app, None)?)
        .separator()
        .item(&dev_tools)
        .build()?;
    builder = builder.item(&view_menu);

    // Repository menu
    // NOTE: No accelerators for Push/Pull/Fetch - frontend keyboard shortcuts handle these
    // to avoid double-firing (native accelerator + frontend handler both triggering on the same key).
    // This matches GitHub Desktop's approach where keyboard shortcuts are handled by a single layer.
    let push_item = MenuItem::with_id(
        app,
        "push",
        if IS_MACOS { "Push" } else { "P&ush" },
        true,
        None::<&str>,
    )?;
    let pull_item = MenuItem::with_id(
        app,
        "pull",
        if IS_MACOS { "Pull" } else { "Pu&ll" },
        true,
        None::<&str>,
    )?;
    let fetch_item = MenuItem::with_id(
        app,
        "fetch",
        if IS_MACOS { "Fetch" } else { "&Fetch" },
        true,
        None::<&str>,
    )?;
    let open_terminal = MenuItem::with_id(
        app,
        "open-in-terminal",
        if IS_MACOS {
            "Open in Terminal"
        } else {
            "Open in &terminal"
        },
        true,
        None::<&str>,
    )?;
    let open_finder = MenuItem::with_id(
        app,
        "open-in-finder",
        if IS_MACOS {
            "Show in Finder"
        } else {
            if cfg!(windows) {
                "Show in E&xplorer"
            } else {
                "Show in file manager"
            }
        },
        true,
        Some("CmdOrCtrl+Shift+F"),
    )?;
    let open_editor = MenuItem::with_id(
        app,
        "open-in-editor",
        if IS_MACOS {
            "Open in External Editor"
        } else {
            "Open in e&xternal editor"
        },
        true,
        Some("CmdOrCtrl+Shift+A"),
    )?;
    let view_forge = MenuItem::with_id(
        app,
        "view-on-forge",
        if IS_MACOS {
            "View on Remote"
        } else {
            "View on &remote"
        },
        true,
        Some("CmdOrCtrl+Shift+G"),
    )?;
    let refresh_item = MenuItem::with_id(
        app,
        "refresh",
        if IS_MACOS { "Refresh" } else { "&Refresh" },
        true,
        Some("CmdOrCtrl+R"),
    )?;
    let close_all_tabs = MenuItem::with_id(
        app,
        "close-all-tabs",
        if IS_MACOS {
            "Close All Tabs"
        } else {
            "Close all &tabs"
        },
        true,
        Some("CmdOrCtrl+Shift+W"),
    )?;

    let repo_menu = SubmenuBuilder::new(
        app,
        if IS_MACOS {
            "Repository"
        } else {
            "&Repository"
        },
    )
    .item(&push_item)
    .item(&pull_item)
    .item(&fetch_item)
    .separator()
    .item(&open_terminal)
    .item(&open_finder)
    .item(&open_editor)
    .separator()
    .item(&view_forge)
    .separator()
    .text(
        "new-worktree",
        if IS_MACOS {
            "New Worktree…"
        } else {
            "New work&tree…"
        },
    )
    .separator()
    .item(&refresh_item)
    .item(&close_all_tabs)
    .build()?;
    builder = builder.item(&repo_menu);

    // Branch menu
    let new_branch = MenuItem::with_id(
        app,
        "new-branch",
        if IS_MACOS {
            "New Branch…"
        } else {
            "New &branch…"
        },
        true,
        Some("CmdOrCtrl+Shift+N"),
    )?;
    let rename_branch = MenuItem::with_id(
        app,
        "rename-branch",
        if IS_MACOS {
            "Rename Branch…"
        } else {
            "&Rename branch…"
        },
        true,
        Some("CmdOrCtrl+Shift+R"),
    )?;
    let delete_branch = MenuItem::with_id(
        app,
        "delete-branch",
        if IS_MACOS {
            "Delete Branch…"
        } else {
            "&Delete branch…"
        },
        true,
        Some("CmdOrCtrl+Shift+D"),
    )?;
    let stash_changes = MenuItem::with_id(
        app,
        "stash-changes",
        if IS_MACOS {
            "Stash Changes…"
        } else {
            "&Stash changes…"
        },
        true,
        Some("CmdOrCtrl+Shift+S"),
    )?;
    let merge_branch = MenuItem::with_id(
        app,
        "merge-branch",
        if IS_MACOS {
            "Merge into Current Branch…"
        } else {
            "&Merge into current branch…"
        },
        true,
        Some("CmdOrCtrl+Shift+M"),
    )?;

    let branch_menu = SubmenuBuilder::new(app, if IS_MACOS { "Branch" } else { "&Branch" })
        .item(&new_branch)
        .item(&rename_branch)
        .item(&delete_branch)
        .separator()
        .text(
            "discard-all",
            if IS_MACOS {
                "Discard All Changes…"
            } else {
                "Discard all changes…"
            },
        )
        .item(&stash_changes)
        .separator()
        .item(&merge_branch)
        .text(
            "rebase-branch",
            if IS_MACOS {
                "Rebase Current Branch…"
            } else {
                "R&ebase current branch…"
            },
        )
        .separator()
        .text(
            "create-pr",
            if IS_MACOS {
                "Create Pull Request"
            } else {
                "Create &pull request"
            },
        )
        .build()?;
    builder = builder.item(&branch_menu);

    // Window menu (macOS)
    if IS_MACOS {
        let close_all_tabs_win = MenuItem::with_id(
            app,
            "close-all-tabs",
            "Close All Tabs",
            true,
            Some("CmdOrCtrl+Shift+W"),
        )?;
        let window_menu = SubmenuBuilder::new(app, "Window")
            .item(&PredefinedMenuItem::minimize(app, None)?)
            .item(&PredefinedMenuItem::maximize(app, None)?)
            .item(&PredefinedMenuItem::close_window(app, None)?)
            .separator()
            .item(&close_all_tabs_win)
            .build()?;
        builder = builder.item(&window_menu);
    }

    // Help menu
    let mut help_menu = SubmenuBuilder::new(app, if IS_MACOS { "Help" } else { "&Help" })
        .text(
            "show-docs",
            if IS_MACOS {
                "Documentation"
            } else {
                "&Documentation"
            },
        )
        .text(
            "show-shortcuts",
            if IS_MACOS {
                "Keyboard Shortcuts"
            } else {
                "&Keyboard shortcuts"
            },
        )
        .separator()
        .text(
            "open-today-log",
            if IS_MACOS {
                "Open Today's Log"
            } else {
                "Open today's &log"
            },
        )
        .text(
            "open-logs-folder",
            if IS_MACOS {
                "Show Logs Folder"
            } else {
                "Show &logs folder"
            },
        )
        .separator()
        .text(
            "report-issue",
            if IS_MACOS {
                "Report Issue…"
            } else {
                "Report &issue…"
            },
        );

    if !IS_MACOS {
        help_menu = help_menu.separator().text("about", "&About AngKorGit");
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
        "open-today-log" => {
            if let Err(e) = crate::logger::open_today_log() {
                eprintln!("Failed to open today's log: {}", e);
            }
        }
        "open-logs-folder" => {
            if let Err(e) = crate::logger::open_logs_folder() {
                eprintln!("Failed to open logs folder: {}", e);
            }
        }
        "dev-tools" => {
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_devtools_open() {
                        window.close_devtools();
                    } else {
                        window.open_devtools();
                    }
                }
            }
        }
        // All other events forwarded to frontend via menu-event
        _ => {
            let _ = app.emit("menu-event", id);
        }
    }
}
