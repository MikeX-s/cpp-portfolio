#pragma once

#include "Color.h"
#include "World.h"

#include <vector>

struct Particle {
  float x, y, vx, vy;
  float life, maxLife;
  Color color;
};

struct ParticleSystem {
  std::vector<Particle> items;

  void spawn(float x, float y, int count, Color color);
  int count() const { return static_cast<int>(items.size()); }
  void update(const WorldState& world);
};
