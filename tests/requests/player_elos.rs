use tfpugs_web_app::app::App;
use loco_rs::testing;
use serial_test::serial;

#[tokio::test]
#[serial]
async fn can_get_echo() {
    testing::request::<App, _, _>(|request, _ctx| async move {
        let payload = serde_json::json!({
            "foo": "bar",
        });

        let res = request.post("/player_elo/echo").json(&payload).await;
        assert_eq!(res.status_code(), 200);
        assert_eq!(res.text(), serde_json::to_string(&payload).unwrap());
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_request_root() {
    testing::request::<App, _, _>(|request, _ctx| async move {
        let res = request.get("/player_elo").await;
        assert_eq!(res.status_code(), 200);
        assert_eq!(res.text(), "hello");
    })
    .await;
}
