#pragma once

#include "Particle.h"
#include "Player.h"
#include "Rect.h"
#include "World.h"

#include <cstdint>
#include <vector>

enum class GamePhase : uint8_t;

enum class ObstacleType : uint8_t {
  TallGroundBlock = 0,
  LowFloatingPlatform,
  HighFloatingPlatform,
  COUNT
};

constexpr int OBSTACLE_TYPE_CNT = static_cast<int>(ObstacleType::COUNT);

struct Obstacle {
  ObstacleType type = ObstacleType::TallGroundBlock;
  bool passed = false;
  Rect bounds;
};

struct ObstacleSystem {
  std::vector<Obstacle> items;

  Obstacle spawn(float x, float speed);
  int count() const { return static_cast<int>(items.size()); }
  void update(const PlayerState& player,
              WorldState& world,
              ParticleSystem& particles,
              GamePhase& phase);
};