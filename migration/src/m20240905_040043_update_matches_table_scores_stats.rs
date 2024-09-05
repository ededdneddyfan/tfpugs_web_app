use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Matches::Table)
                    .add_column(ColumnDef::new(Matches::WinningScore).integer().null())
                    .add_column(ColumnDef::new(Matches::LosingScore).integer().null())
                    .add_column(ColumnDef::new(Matches::StatsUrl).text().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Matches::Table)
                    .drop_column(Matches::WinningScore)
                    .drop_column(Matches::LosingScore)
                    .drop_column(Matches::StatsUrl)
                    .to_owned(),
            )
            .await
    }
}

#[derive(Iden)]
enum Matches {
    Table,
    WinningScore,
    LosingScore,
    StatsUrl,
}