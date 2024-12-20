#![allow(clippy::unused_async)]
use axum::debug_handler;
use loco_rs::prelude::*;
use sea_orm::{DbBackend, EntityTrait, QueryFilter, ColumnTrait, Condition, Statement};
use sea_orm::prelude::Expr;
use serde::Serialize;
use crate::models::_entities::matches::{Entity as Matches, Column as MatchesColumn};
use crate::models::_entities::players::{Entity as Players, Column as PlayersColumn, Model as PlayerModel};

#[debug_handler]
pub async fn list(State(ctx): State<AppContext>) -> Result<Response> {
    format::json(Matches::find().filter(MatchesColumn::GameType.eq("4v4")).filter(MatchesColumn::DeletedAt.is_null()).all(&ctx.db).await?)
}

#[debug_handler]
pub async fn get_one(Path(id): Path<u32>, State(ctx): State<AppContext>) -> Result<Response> {
    let match_item = Matches::find_by_id(id).one(&ctx.db).await?;
    match match_item {
        Some(m) => format::json(m),
        None => Err(Error::NotFound),
    }
}

#[debug_handler]
pub async fn get_matches_by_player_name(Path(player_name): Path<String>, State(ctx): State<AppContext>) -> Result<Response> {
    // First, find the player's discord_id
    let statement = Statement::from_sql_and_values(
        DbBackend::MySql,
        r#"SELECT * FROM players WHERE LOWER(player_name) = LOWER(?)"#,
        [player_name.clone().into()]
    );
    let player = Players::find()
        .from_raw_sql(statement)
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
    ).filter(MatchesColumn::DeletedAt.is_null())
        .all(&ctx.db)
        .await?;

    format::json(matches)
}

#[debug_handler]
pub async fn echo(req_body: String) -> String {
    req_body
}

#[derive(Serialize)]
struct WinrateResponse {
    games_played: usize,
    wins: usize,
    losses: usize,
    winrate: f64,
}


#[debug_handler]
pub async fn get_same_team_winrate(
    Path((player1_name, player2_name)): Path<(String, String)>,
    State(ctx): State<AppContext>
) -> Result<Response> {

    let player = Players::find()
        .filter(PlayersColumn::PlayerName.eq(&player1_name))
        .one(&ctx.db)
        .await?;

    let player1_discord_id = match player {
        Some(p) => p.discord_id.unwrap_or_default(),
        None => return Err(Error::NotFound),
    };

    let player_2 = Players::find()
        .filter(PlayersColumn::PlayerName.eq(&player2_name))
        .one(&ctx.db)
        .await?;

    let player2_discord_id = match player_2 {
        Some(p) => p.discord_id.unwrap_or_default(),
        None => return Err(Error::NotFound),
    };

    let matches = Matches::find()
    .filter(
        Condition::any()
            .add(
                Condition::all()
                .add(Expr::col(MatchesColumn::BlueTeam).like(format!("%{}%", player1_discord_id)))
                .add(Expr::col(MatchesColumn::BlueTeam).like(format!("%{}%", player2_discord_id)))
            )
            .add(
                Condition::all()
                .add(Expr::col(MatchesColumn::RedTeam).like(format!("%{}%", player1_discord_id)))
                .add(Expr::col(MatchesColumn::RedTeam).like(format!("%{}%", player2_discord_id)))
            )
    ).filter(MatchesColumn::DeletedAt.is_null())
        .all(&ctx.db)
        .await?;

    let (wins, losses) = matches.iter().fold((0, 0), |(w, l), m| {
        let is_blue_team = m.blue_team.as_ref().unwrap().contains(&player1_discord_id) && m.blue_team.as_ref().unwrap().contains(&player2_discord_id);
        let is_winner = (is_blue_team && m.match_outcome.unwrap_or_default() == 1) || (!is_blue_team && m.match_outcome.unwrap_or_default() == 2);
        if is_winner { (w + 1, l) } else { (w, l + 1) }
    });

    let games_played = wins + losses;
    let winrate = if games_played > 0 { (wins as f64) / (games_played as f64) } else { 0.0 };

    format::json(WinrateResponse {
        games_played,
        wins,
        losses,
        winrate,
    })
}

/*#[debug_handler]
pub async fn get_versus_winrate(
    Path((player1_name, player2_name)): Path<(String, String)>,
    State(ctx): State<AppContext>
) -> Result<Response> {
    let (player1, player2) = get_players(&ctx, &player1_name, &player2_name).await?;

    let matches = get_matches_with_players(&ctx, &player1.discord_id, &player2.discord_id).await?;

    let (player1_wins, player2_wins) = count_versus_wins(&matches, &player1.discord_id, &player2.discord_id);

    let games_played = player1_wins + player2_wins;
    let player1_winrate = if games_played > 0 { (player1_wins as f64) / (games_played as f64) } else { 0.0 };
    let player2_winrate = if games_played > 0 { (player2_wins as f64) / (games_played as f64) } else { 0.0 };

    format::json(json!({
        "games_played": games_played,
        "player1": {
            "name": player1_name,
            "wins": player1_wins,
            "winrate": player1_winrate,
        },
        "player2": {
            "name": player2_name,
            "wins": player2_wins,
            "winrate": player2_winrate,
        },
    }))
}*/

#[derive(Serialize)]
struct MatchWithPlayers {
    match_data: crate::models::_entities::matches::Model,
    blue_team_players: Vec<PlayerModel>,
    red_team_players: Vec<PlayerModel>,
}

#[debug_handler]
pub async fn list_with_players(State(ctx): State<AppContext>) -> Result<Response> {
    // Get all matches
    let matches = Matches::find()
        .filter(MatchesColumn::GameType.eq("4v4"))
        .filter(MatchesColumn::DeletedAt.is_null())
        .all(&ctx.db)
        .await?;

    // Get all players
    let players = Players::find()
        .all(&ctx.db)
        .await?;

    // Create a map of discord_id to player for quick lookups
    let player_map: std::collections::HashMap<String, PlayerModel> = players
        .into_iter()
        .filter_map(|p| {
            p.discord_id.clone().map(|id| (id, p))
        })
        .collect();

    // Combine match data with player data
    let matches_with_players: Vec<MatchWithPlayers> = matches
        .into_iter()
        .map(|match_data| {
            let blue_team_ids = match_data.blue_team
                .clone()
                .unwrap_or_default()
                .split(',')
                .map(|s| s.trim().to_string())
                .collect::<Vec<String>>();

            let red_team_ids = match_data.red_team
                .clone()
                .unwrap_or_default()
                .split(',')
                .map(|s| s.trim().to_string())
                .collect::<Vec<String>>();

            let blue_team_players = blue_team_ids
                .iter()
                .filter_map(|id| player_map.get(id).cloned())
                .collect();

            let red_team_players = red_team_ids
                .iter()
                .filter_map(|id| player_map.get(id).cloned())
                .collect();

            MatchWithPlayers {
                match_data,
                blue_team_players,
                red_team_players,
            }
        })
        .collect();

    format::json(matches_with_players)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/matches")
        .add("/", get(list))
        .add("/with-players", get(list_with_players))
        .add("/:id", get(get_one))
        .add("/echo", post(echo))
        .add("/player/:player_name", get(get_matches_by_player_name))
        .add("/same-team-winrate/:player1_name/:player2_name", get(get_same_team_winrate))
        //.add("/versus-winrate/:player1_name/:player2_name", get(get_versus_winrate))
}
