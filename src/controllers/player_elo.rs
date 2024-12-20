#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use sea_orm::{DbBackend, EntityTrait, Statement};
use axum::debug_handler;
use axum::extract::Path;

use crate::models::_entities::player_elo::Entity;

#[debug_handler]
pub async fn echo(req_body: String) -> String {
    req_body
}

#[debug_handler]
pub async fn hello(State(_ctx): State<AppContext>) -> Result<Response> {
    // do something with context (database, etc)
    format::text("hello")
}

#[debug_handler]
pub async fn get_player_elo_by_player_name(
    Path(player_name): Path<String>,
    State(ctx): State<AppContext>
) -> Result<Response> {
    println!("Received player_name: {}", player_name);
    
    let statement = Statement::from_sql_and_values(
        DbBackend::MySql,
        r#"SELECT * FROM player_elo WHERE LOWER(player_name) = LOWER(?) ORDER BY created_at ASC"#,
        [player_name.clone().into()]
    );
    
    println!("SQL Query: {}, Parameters: {:?}", statement.sql, statement.values);
    
    let player_elo = Entity::find()
        .from_raw_sql(statement)
        .all(&ctx.db)
        .await?;
        
    println!("Query result: {:?}", player_elo);
    
    format::json(player_elo)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/player_elo")
        .add("/", get(hello))
        .add("/echo", post(echo))
        .add("/:player_name", get(get_player_elo_by_player_name))
}
