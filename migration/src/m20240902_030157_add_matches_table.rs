use loco_rs::schema::table_auto_tz;
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let table = table_auto_tz(Matches::Table)
            .col(pk_auto(Matches::Id))
            .col(integer_null(Matches::MatchId))
            .col(timestamp_null(Matches::DeletedAt))
            .col(float_null(Matches::BlueProbability))
            .col(float_null(Matches::BlueRank))
            .col(text_null(Matches::BlueTeam))
            .col(float_null(Matches::RedProbability))
            .col(float_null(Matches::RedRank))
            .col(text_null(Matches::RedTeam))
            .col(string_null(Matches::Map))
            .col(string_null(Matches::Server))
            .col(string_null(Matches::GameType))
            .col(integer_null(Matches::MatchOutcome))
            .to_owned();
        manager.create_table(table).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Matches::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Matches {
    Table,
    Id,
    MatchId,
    DeletedAt,
    BlueProbability,
    BlueRank,
    BlueTeam,
    RedProbability,
    RedRank,
    RedTeam,
    Map,
    Server,
    GameType,
    MatchOutcome,
}