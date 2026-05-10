#pragma once

#include "Constants.h"
#include "Particle.h"
#include "Rect.h"
#include "World.h"

struct PlayerState {
  float y = Layout::GroundY - Layout::PlayerH;
  float vy = 0.0f;
  bool onGround = true;
  bool jumping = false;
  int jumpCount = 0;       // double-jump counter
  float animTimer = 0.0f;  // leg animation cycle

  void update(const WorldState& world);
  void jump(ParticleSystem& particle);
  Rect bounds() const {
    return {Layout::PlayerX, y, Layout::PlayerW, Layout::PlayerH};
  }
};