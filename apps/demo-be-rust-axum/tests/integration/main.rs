mod steps;
mod world;

use cucumber::World as _;
use world::AppWorld;

#[tokio::main]
async fn main() {
    AppWorld::cucumber()
        .max_concurrent_scenarios(Some(1))
        .run("/specs/apps/demo/be/gherkin")
        .await;
}
