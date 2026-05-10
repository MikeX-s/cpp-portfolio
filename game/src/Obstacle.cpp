#include "Obstacle.h"
#include "Constants.h"
#include "GameState.h"
#include "Random.h"

#include <cassert>

static ObstacleType selectObstacleType(float speed, std::mt19937& rng) {
  if (speed < ObstacleCfg::SpeedBiasThreshold) {
    std::uniform_int_distribution<int> biasedRoll{0, 9};

    return (biasedRoll(rng) < ObstacleCfg::GroundBiasRollLimit)
               ? ObstacleType::TallGroundBlock
               : ObstacleType::LowFloatingPlatform;
  }

  std::uniform_int_distribution<int> fullRoll{0, OBSTACLE_TYPE_CNT - 1};
  return static_cast<ObstacleType>(fullRoll(rng));
}

static bool aabbOverlap(Rect a,
                        Rect b,
                        float margin = ObstacleCfg::CollisionMargin) {
  const float ax1 = a.x + margin;
  const float ay1 = a.y + margin;
  const float ax2 = a.x + a.w - margin;
  const float ay2 = a.y + a.h - margin;
  const float bx1 = b.x + margin;
  const float by1 = b.y + margin;
  const float bx2 = b.x + b.w - margin;
  const float by2 = b.y + b.h - margin;

  return (ax1 < bx2) and  //
         (ax2 > bx1) and  //
         (ay1 < by2) and  //
         (ay2 > by1);
}

[[nodiscard]] Obstacle ObstacleSystem::spawn(float x, float speed) {
  auto& rng = getRng();
  const auto type = selectObstacleType(speed, rng);

  std::uniform_real_distribution<float> wDist{
      ObstacleCfg::GroundBlockMinW,
      ObstacleCfg::GroundBlockMinW + ObstacleCfg::GroundBlockWRange};
  std::uniform_real_distribution<float> hDist{
      ObstacleCfg::GroundBlockMinH,
      ObstacleCfg::GroundBlockMinH + ObstacleCfg::GroundBlockHRange};

  switch (type) {
    case ObstacleType::TallGroundBlock: {
      const float w = wDist(rng);
      const float h = hDist(rng);
      return Obstacle{.type = type,
                      .passed = false,
                      .bounds = {.x = x,                    //
                                 .y = Layout::GroundY - h,  //
                                 .w = w,                    //
                                 .h = h}};
    }
    case ObstacleType::LowFloatingPlatform: {
      return Obstacle{.type = type,
                      .passed = false,
                      .bounds = {.x = x,  //
                                 .y = Layout::GroundY -
                                      ObstacleCfg::PlatformOffsetY_Low,  //
                                 .w = ObstacleCfg::PlatformW_Low,        //
                                 .h = ObstacleCfg::PlatformH}};
    }
    case ObstacleType::HighFloatingPlatform: {
      return Obstacle{.type = type,
                      .passed = false,
                      .bounds = {.x = x,  //
                                 .y = Layout::GroundY -
                                      ObstacleCfg::PlatformOffsetY_Low,  //
                                 .w = ObstacleCfg::PlatformW_High,       //
                                 .h = ObstacleCfg::PlatformH}};
    }
    default: {
      assert(false and "unhandled ObstacleType");
    }
  }

  return {};
}

void ObstacleSystem::update(const PlayerState& player,
                            WorldState& world,
                            ParticleSystem& particles,
                            GamePhase& phase) {
  ++world.spawnTimer;
  if (world.spawnTimer >= world.spawnInterval) {
    world.spawnTimer = 0;
    items.push_back(this->spawn(WorldCfg::ObstacleSpawnX, world.scrollSpeed));
  }

  for (auto& o : items) {
    o.bounds.x -= world.scrollSpeed;
    if (!o.passed && o.bounds.x + o.bounds.w < Layout::PlayerX) {
      o.passed = true;
      particles.spawn(Layout::PlayerX + Layout::PlayerW, player.y,
                      ParticleCfg::ScoreBurstCount, Colors::ScoreBurst);
    }
  }

  for (const auto& o : items) {
    if (aabbOverlap(player.bounds(), o.bounds)) {
      phase = GamePhase::Dead;
      particles.spawn(Layout::PlayerX + Layout::PlayerW * 0.5f,
                      player.y + Layout::PlayerH * 0.5f,
                      ParticleCfg::DeathBurstCount, Colors::DeathBurst);
    }
  }

  std::erase_if(items, [](const Obstacle& o) {
    return o.bounds.x + o.bounds.w < WorldCfg::ObstacleCullX;
  });
}