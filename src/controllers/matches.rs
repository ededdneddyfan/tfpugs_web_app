#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::prelude::*;
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Condition};
use sea_orm::prelude::Expr;

use crate::models::_entities::matches::{Entity as Matches, Column as MatchesColumn};
use crate::models::_entities::players::{Entity as Players, Column as PlayersColumn};

#[debug_handler]
pub async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    format::json(Matches::find().filter(MatchesColumn::GameType.eq("4v4")).all(&ctx.db).await?)
}

#[debug_handler]
pub async fn get_one(Path(id): Path<i32>, State(ctx): State<AppContext>) -> Result<Response> {
    let match_item = Matches::find_by_id(id).one(&ctx.db).await?;
    match match_item {
        Some(m) => format::json(m),
        None => Err(Error::NotFound),
    }
}

#[debug_handler]
pub async fn get_matches_by_player_name(Path(player_name): Path<String>, State(ctx): State<AppContext>) -> Result<Response> {
    // First, find the player's discord_id
    let player = Players::find()
        .filter(PlayersColumn::PlayerName.eq(&player_name))
        .one(&ctx.db)
        .await?;

    let discord_id = match player {
        Some(p) => p.discord_id.unwrap_or_default(),
        None => return Err(Error::NotFound),
    };

    // Now, find all matches where this discord_id is in either blue_team or red_team
    let matches = Matches::find()
    .filter(
        Condition::any()
            .add(Expr::col(MatchesColumn::BlueTeam).like(format!("%{}%", discord_id)))
            .add(Expr::col(MatchesColumn::RedTeam).like(format!("%{}%", discord_id)))
    )
        .all(&ctx.db)
        .await?;

    format::json(matches)
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
        .add("/player/:player_name", get(get_matches_by_player_name))
}