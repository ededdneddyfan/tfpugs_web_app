//! `SeaORM` Entity, @generated by sea-orm-codegen 1.0.1

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "matches")]
pub struct Model {
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    #[sea_orm(primary_key)]
    pub id: i32,
    pub match_id: Option<i32>,
    pub deleted_at: Option<DateTime>,
    #[sea_orm(column_type = "Float", nullable)]
    pub blue_probability: Option<f32>,
    #[sea_orm(column_type = "Float", nullable)]
    pub blue_rank: Option<f32>,
    #[sea_orm(column_type = "Text", nullable)]
    pub blue_team: Option<String>,
    #[sea_orm(column_type = "Float", nullable)]
    pub red_probability: Option<f32>,
    #[sea_orm(column_type = "Float", nullable)]
    pub red_rank: Option<f32>,
    #[sea_orm(column_type = "Text", nullable)]
    pub red_team: Option<String>,
    pub map: Option<String>,
    pub server: Option<String>,
    pub game_type: Option<String>,
    pub match_outcome: Option<i32>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}
