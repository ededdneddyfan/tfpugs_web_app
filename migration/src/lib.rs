#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;

mod m20220101_000001_users;
mod m20231103_114510_notes;

mod m20240902_030157_add_matches_table;
mod m20240905_040043_update_matches_table_scores_stats;
mod m20240906_042943_add_players_table;
mod m20241004_162642_player_elos;
mod m20241007_163422_rename_player_elos_to_player_elo;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_users::Migration),
            Box::new(m20231103_114510_notes::Migration),
            Box::new(m20240902_030157_add_matches_table::Migration),
            Box::new(m20240905_040043_update_matches_table_scores_stats::Migration),
            Box::new(m20240906_042943_add_players_table::Migration),
            Box::new(m20241004_162642_player_elos::Migration),
            Box::new(m20241007_163422_rename_player_elos_to_player_elo::Migration),
        ]
    }
}