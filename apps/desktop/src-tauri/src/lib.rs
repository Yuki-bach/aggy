use tauri_plugin_dialog::DialogExt;

/// Open a native file dialog filtered by `extensions`, read the selected file,
/// and return (content, fileName).  The renderer never receives a file path.
#[tauri::command]
fn pick_and_read_text(
    app: tauri::AppHandle,
    extensions: Vec<String>,
) -> Result<Option<(String, String)>, String> {
    let ext_refs: Vec<&str> = extensions.iter().map(|s| s.as_str()).collect();
    let path = app
        .dialog()
        .file()
        .add_filter("File", &ext_refs)
        .blocking_pick_file();

    let Some(path) = path else {
        return Ok(None);
    };

    let path = path
        .into_path()
        .map_err(|e| format!("invalid path: {e}"))?;

    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;

    let file_name = path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();

    Ok(Some((content, file_name)))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![pick_and_read_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
