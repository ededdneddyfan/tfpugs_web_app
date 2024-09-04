#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::prelude::*;
use sea_orm::EntityTrait;

use crate::models::_entities::matches::{Entity};

#[debug_handler]
pub async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    format::json(Entity::find().all(&ctx.db).await?)
}

#[debug_handler]
pub async fn get_one(Path(id): Path<i32>, State(ctx): State<AppContext>) -> Result<Response> {
    let match_item = Entity::find_by_id(id).one(&ctx.db).await?;
    match match_item {
        Some(m) => format::json(m),
        None => Err(Error::NotFound),
    }
}

#[debug_handler]
pub async fn echo(req_body: String) -> String {
    req_body
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/matches")
        .add("/", get(list))
        .add("/:id", get(get_one))
        .add("/echo", post(echo))
}