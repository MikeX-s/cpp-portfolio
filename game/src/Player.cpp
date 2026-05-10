#include "Player.h"

void PlayerState::update(const WorldState& world) {
  vy += Physics::Gravity;
  y += vy;
  animTimer += world.scrollSpeed * PlayerCfg::AnimSpeedScale;

  const float groundContact = Layout::GroundY - Layout::PlayerH;
  if (y >= groundContact) {
    y = groundContact;
    vy = 0.0f;
    onGround = true;
    jumpCount = 0;
  } else {
    onGround = false;
  }
}

void PlayerState::jump(ParticleSystem& particles) {
    if (jumpCount >= PlayerCfg::MaxJumps) return;

    vy = Physics::JumpForce
        * (jumpCount == 1 ? PlayerCfg::DoubleJumpDamping : 1.0f);
    jumpCount++;
    onGround = false;

    particles.spawn(
        Layout::PlayerX + Layout::PlayerW * 0.5f,
        y + Layout::PlayerH,
        PlayerCfg::JumpBurstCount,
        Colors::JumpBurst);
}