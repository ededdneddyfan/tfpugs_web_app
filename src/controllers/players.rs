#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::prelude::*;
use sea_orm::{DbBackend, EntityTrait, QueryOrder, Statement};
use serde::Serialize;

use crate::models::_entities::players::{Entity, Column};
use crate::models::_entities::{matches, player_elo};

#[derive(Serialize)]
struct PlayerCombinedData {
    player: Option<crate::models::_entities::players::Model>,
    matches: Vec<matches::Model>,
    elo_history: Vec<player_elo::Model>,
}

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

#[debug_handler]
pub async fn get_player_combined_data(
    Path(name): Path<String>, 
    State(ctx): State<AppContext>
) -> Result<Response> {
    // Get player data
    let player_statement = Statement::from_sql_and_values(
        DbBackend::MySql,
        r#"SELECT * FROM players WHERE LOWER(player_name) = LOWER(?)"#,
        [name.clone().into()]
    );
    
    let player = Entity::find()
        .from_raw_sql(player_statement.clone())
        .one(&ctx.db)
        .await?;

    // Get matches data
    let player_discord_id = player
        .as_ref()
        .map(|p| p.discord_id.clone())
        .ok_or(Error::NotFound)?;

    let matches_statement = Statement::from_sql_and_values(
        DbBackend::MySql,
        r#"SELECT * FROM matches WHERE 
           FIND_IN_SET(?, blue_team) > 0 OR 
           FIND_IN_SET(?, red_team) > 0 
           ORDER BY created_at DESC"#,
        [player_discord_id.clone().into(), player_discord_id.into()]
    );

    let matches = matches::Entity::find()
        .from_raw_sql(matches_statement)
        .all(&ctx.db)
        .await?;

    // Get ELO history
    let elo_statement = Statement::from_sql_and_values(
        DbBackend::MySql,
        r#"SELECT * FROM player_elo 
           WHERE LOWER(player_name) = LOWER(?) 
           ORDER BY created_at ASC"#,
        [name.clone().into()]
    );

    let elo_history = player_elo::Entity::find()
        .from_raw_sql(elo_statement)
        .all(&ctx.db)
        .await?;

    // Combine all data
    let combined_data = PlayerCombinedData {
        player,
        matches,
        elo_history,
    };

    format::json(combined_data)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/players")
        .add("/", get(list))
        .add("/by-elo", get(list_by_elo))
        .add("/:id", get(get_one))
        .add("/discord/:discord_id", get(get_by_discord_id))
        .add("/name/:name", get(get_by_name))
        .add("/combined/:name", get(get_player_combined_data))
}