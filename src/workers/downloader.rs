use std::time::Duration;

use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use tokio::time::sleep;

pub struct DownloadWorker {
    pub ctx: AppContext,
}

#[derive(Deserialize, Debug, Serialize)]
pub struct DownloadWorkerArgs {
    pub user_guid: String,
}

impl worker::AppWorker<DownloadWorkerArgs> for DownloadWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }
}

#[async_trait]
impl worker::Worker<DownloadWorkerArgs> for DownloadWorker {
    async fn perform(&self, args: DownloadWorkerArgs) -> worker::Result<()> {
        // TODO: Some actual work goes here...
        println!("================================================");
        println!("Sending payment report to user {}", args.user_guid);

        sleep(Duration::from_millis(2000)).await;


        println!("================================================");
        Ok(())
    }
}
