use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let table = table_auto_tz(Players::Table)
            .col(pk_auto(Players::Id))
            .col(string_null(Players::DiscordId))
            .col(timestamp_null(Players::DeletedAt))
            .col(string_null(Players::PlayerName))
            .col(integer_null(Players::CurrentElo))
            .col(string_null(Players::VisualRankOverride))
            .col(integer_null(Players::PugWins))
            .col(integer_null(Players::PugLosses))
            .col(integer_null(Players::PugDraws))
            .col(integer_null(Players::DmWins))
            .col(integer_null(Players::DmLosses))
            .col(text_null(Players::Achievements))
            .col(text_null(Players::Dunce))
            .col(text_null(Players::SteamId))
            .to_owned();
        
        manager.create_table(table).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Players::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Players {
    Table,
    Id,
    DiscordId,
    DeletedAt,
    PlayerName,
    CurrentElo,
    VisualRankOverride,
    PugWins,
    PugLosses,
    PugDraws,
    DmWins,
    DmLosses,
    Achievements,
    Dunce,
    SteamId,
}