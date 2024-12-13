//! `SeaORM` Entity, @generated by sea-orm-codegen 1.0.1

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "players")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: u32,
    pub discord_id: Option<String>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub deleted_at: Option<DateTimeUtc>,
    pub player_name: Option<String>,
    pub current_elo: Option<i32>,
    pub visual_rank_override: Option<String>,
    pub pug_wins: Option<i32>,
    pub pug_losses: Option<i32>,
    pub pug_draws: Option<i32>,
    pub dm_wins: Option<i32>,
    pub dm_losses: Option<i32>,
    #[sea_orm(column_type = "Text", nullable)]
    pub achievements: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub dunce: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub steam_id: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}
