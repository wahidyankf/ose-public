mod steps;
mod world;

use cucumber::World as _;
use world::AppWorld;

#[tokio::main]
async fn main() {
    AppWorld::run("../../specs/apps/demo-be/gherkin").await;
}
