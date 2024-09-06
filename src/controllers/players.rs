#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::prelude::*;
use sea_orm::EntityTrait;

use crate::models::_entities::players::{Entity, Column};

#[debug_handler]
pub async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    format::json(Entity::find().all(&ctx.db).await?)
}

#[debug_handler]
pub async fn get_one(Path(id): Path<i32>, State(ctx): State<AppContext>) -> Result<Response> {
    let player = Entity::find_by_id(id).one(&ctx.db).await?;
    match player {
        Some(p) => format::json(p),
        None => Err(Error::NotFound),
    }
}

#[debug_handler]
pub async fn get_by_discord_id(Path(discord_id): Path<String>, State(ctx): State<AppContext>) -> Result<Response> {
    let player = Entity::find().filter(Column::DiscordId.eq(discord_id)).one(&ctx.db).await?;
    match player {
        Some(p) => format::json(p),
        None => Err(Error::NotFound),
    }
}

#[debug_handler]
pub async fn get_by_name(Path(name): Path<String>, State(ctx): State<AppContext>) -> Result<Response> {
    let player = Entity::find()
        .filter(Column::PlayerName.eq(name))
        .one(&ctx.db)
        .await?;
    match player {
        Some(p) => format::json(p),
        None => Err(Error::NotFound),
    }
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/players")
        .add("/", get(list))
        .add("/:id", get(get_one))
        .add("/discord/:discord_id", get(get_by_discord_id))
        .add("/name/:name", get(get_by_name))
}