#include "Particle.h"
#include "Constants.h"
#include "Random.h"

void ParticleSystem::spawn(float x, float y, int count, Color color) {
  auto& rng = getRng();

  std::uniform_real_distribution<float> offsetX(-ParticleCfg::SpreadX,
                                                ParticleCfg::SpreadX);
  std::uniform_real_distribution<float> offsetY(-ParticleCfg::SpreadY,
                                                ParticleCfg::SpreadY);
  std::uniform_real_distribution<float> vel(-ParticleCfg::MaxSpeed,
                                            ParticleCfg::MaxSpeed);
  std::uniform_real_distribution<float> lifeDist(ParticleCfg::MinLife,
                                                 ParticleCfg::MaxLife);

  items.reserve(items.size() + count);

  for (int i = 0; i < count; ++i) {
    const float life = lifeDist(rng);
    items.push_back(Particle{.x = x + offsetX(rng),
                             .y = y + offsetY(rng),
                             .vx = vel(rng),
                             .vy = vel(rng) - ParticleCfg::UpwardBias,
                             .life = life,
                             .maxLife = life,
                             .color = color});
  }
}

void ParticleSystem::update(const WorldState& world) {
  for (auto& p : items) {
    p.x += p.vx - world.scrollSpeed;
    p.y += p.vy;
    p.vy += ParticleCfg::Weight * Physics::Gravity;
  }

  std::erase_if(items,
                [](const auto& p) { return p.x < WorldCfg::ParticleCullX; });
}