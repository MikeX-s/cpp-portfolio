#include "World.h"

#include <algorithm>

void WorldState::update() {
  scrollSpeed = Physics::BaseSpeed + worldX * Physics::SpeedInc;
  worldX += scrollSpeed;
  score = static_cast<int>(worldX / WorldCfg::ScoreDivisor);
  hiScore = std::max(hiScore, score);

  spawnInterval = std::max(
      WorldCfg::MinSpawnInterval,
      WorldCfg::InitialSpawnInterval - (scrollSpeed - Physics::BaseSpeed) *
                                           WorldCfg::SpawnIntervalSpeedScale);
}

void WorldState::updateGroundTiles() {
  for (auto& tile : groundTiles) {
    tile -= scrollSpeed;
    if (tile < WorldCfg::TileRecycleThreshold) {
      const float maxX =
          *std::max_element(groundTiles.begin(), groundTiles.end());
      tile = maxX + WorldCfg::GroundTileWidth;
    }
  }
}
