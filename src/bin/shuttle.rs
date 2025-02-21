use loco_rs::boot::{create_app, StartMode};
use loco_rs::environment::Environment;
use tfpugs_web_app::app::App;
use migration::Migrator;
use shuttle_runtime::DeploymentMetadata;
use loco_rs::config::Config;
use std::path::PathBuf;
use tower_http::services::ServeDir;
use tower_http::trace::TraceLayer;
use tower_http::services::ServeFile;

#[shuttle_runtime::main]
async fn main(
  #[shuttle_runtime::Metadata] meta: DeploymentMetadata,
) -> shuttle_axum::ShuttleAxum {
    // std::env::set_var("DATABASE_URL", conn_str);
    let environment = match meta.env {
        shuttle_runtime::Environment::Local => Environment::Development,
        shuttle_runtime::Environment::Deployment => Environment::Production,
    };
    let config = Config::from_folder(&environment, &PathBuf::from("config")).expect("configuration loading");
    let boot_result = create_app::<App, Migrator>(StartMode::ServerOnly, &environment, config)
        .await
        .unwrap();

    let router = boot_result.router.unwrap();
    
    // Merge the API router with the static file serving
    let app = router  // API routes first
        .layer(TraceLayer::new_for_http())
        .fallback_service(
            ServeDir::new("frontend/dist")
                .append_index_html_on_directories(true)
                .fallback(
                    ServeDir::new("frontend/dist")
                        .append_index_html_on_directories(true)
                        .not_found_service(ServeFile::new("frontend/dist/index.html"))
                )
        );
    
    Ok(app.into())
}
