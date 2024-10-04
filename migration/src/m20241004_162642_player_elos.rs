use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                table_auto_tz(PlayerElos::Table)
                    .col(pk_auto(PlayerElos::Id))
                    .col(integer(PlayerElos::EntryId))
                    .col(integer(PlayerElos::MatchId))
                    .col(string(PlayerElos::PlayerName))
                    .col(integer(PlayerElos::PlayerElos))
                    .col(big_integer(PlayerElos::DiscordId))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(PlayerElos::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum PlayerElos {
    Table,
    Id,
    EntryId,
    MatchId,
    PlayerName,
    PlayerElos,
    DiscordId,
    
}


