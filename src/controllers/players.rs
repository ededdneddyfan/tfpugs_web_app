#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::prelude::*;
use sea_orm::{DbBackend, EntityTrait, QueryOrder, Statement};

use crate::models::_entities::players::{Entity, Column};

#[debug_handler]
pub async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    format::json(Entity::find().all(&ctx.db).await?)
}

#[debug_handler]
pub async fn get_one(Path(id): Path<u32>, State(ctx): State<AppContext>) -> Result<Response> {
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
    let statement = Statement::from_sql_and_values(
        DbBackend::MySql,
        r#"SELECT * FROM players WHERE LOWER(player_name) = LOWER(?)"#,
        [name.clone().into()]
    );
    
    println!("SQL Query: {}, Parameters: {:?}", statement.sql, statement.values);
    
    let player = Entity::find()
        .from_raw_sql(statement)
        .one(&ctx.db)
        .await?;
    match player {
        Some(p) => format::json(p),
        None => Err(Error::NotFound),
    }
}

#[debug_handler]
pub async fn list_by_elo(State(ctx): State<AppContext>) -> Result<Response> {
    format::json(Entity::find()
        .filter(Column::DeletedAt.is_null())
        .order_by_desc(Column::CurrentElo)
        .all(&ctx.db)
        .await?)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/players")
        .add("/", get(list))
        .add("/by-elo", get(list_by_elo))
        .add("/:id", get(get_one))
        .add("/discord/:discord_id", get(get_by_discord_id))
        .add("/name/:name", get(get_by_name))
}