#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use sea_orm::{EntityTrait, QueryOrder};
use axum::debug_handler;
use axum::extract::Path;

use crate::models::_entities::player_elo::{Entity, Column};

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
    let player_elo = Entity::find()
        .filter(Column::PlayerName.eq(player_name))
        .order_by_asc(Column::CreatedAt)
        .all(&ctx.db)
        .await?;
    format::json(player_elo)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/player_elo")
        .add("/", get(hello))
        .add("/echo", post(echo))
        .add("/:player_name", get(get_player_elo_by_player_name))
}
