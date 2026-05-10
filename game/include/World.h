#pragma once

#include "Constants.h"

#include <array>

struct WorldState {
  float scrollSpeed = Physics::BaseSpeed;
  float worldX = 0.0f;
  int score = 0;
  int hiScore = 0;
  float spawnTimer = 0.0f;
  float spawnInterval = WorldCfg::InitialSpawnInterval;
  std::array<float, 3> groundTiles = {0.0f, WorldCfg::GroundTileWidth,
                                      WorldCfg::GroundTileWidth * 2.0f};

  void update();
  void updateGroundTiles();
};
