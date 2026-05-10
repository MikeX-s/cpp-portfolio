#include "Game.h"
#include "GameState.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
#endif

#include <concepts>
#include <functional>
#include <optional>
#include <type_traits>

template <typename Container>
concept IndexableContainer = requires(const Container& c, size_t i) {
  { c.size() } -> std::convertible_to<size_t>;
  { c[i] } -> std::convertible_to<const typename Container::value_type&>;
};

template <IndexableContainer Container>
auto safeGet(const Container& c, int i) -> std::optional<
    std::reference_wrapper<const typename Container::value_type>> {
  if (i < 0 or i >= static_cast<int>(c.size()))
    return std::nullopt;
  return std::cref(c[static_cast<size_t>(i)]);
}

// ── Player ──────────────────────────────────────────────────────────────────
float getPlayerY() {
  return getGameState().player.y;
}
float getPlayerX() {
  return Layout::PlayerX;
}
float getPlayerW() {
  return Layout::PlayerW;
}
float getPlayerH() {
  return Layout::PlayerH;
}
float getWorldX() {
  return getGameState().world.worldX;
}
float getGroundY() {
  return Layout::GroundY;
}
float getAnimTimer() {
  return getGameState().player.animTimer;
}
bool isOnGround() {
  return getGameState().player.onGround;
}

// ── World ───────────────────────────────────────────────────────────────────
int getScore() {
  return getGameState().world.score;
}
int getHiScore() {
  return getGameState().world.hiScore;
}
float getScrollSpeed() {
  return getGameState().world.scrollSpeed;
}
bool isAlive() {
  return getGameState().phase != GamePhase::Dead;
}
bool isStarted() {
  return getGameState().phase != GamePhase::WaitingToStart;
}
float getGroundTile(int i) {
  return safeGet(getGameState().world.groundTiles, i)
      .transform([](const auto& ref) { return ref.get(); })
      .value_or(0.0f);
}

// ── Obstacles ───────────────────────────────────────────────────────────────

int getObstacleCount() {
  return getGameState().obstacles.count();
}
float getObstacleX(int i) {
  return safeGet(getGameState().obstacles.items, i)
      .transform([](const auto& ref) { return ref.get().bounds.x; })
      .value_or(0.0f);
}
float getObstacleY(int i) {
  return safeGet(getGameState().obstacles.items, i)
      .transform([](const auto& ref) { return ref.get().bounds.y; })
      .value_or(0.0f);
}
float getObstacleW(int i) {
  return safeGet(getGameState().obstacles.items, i)
      .transform([](const auto& ref) { return ref.get().bounds.w; })
      .value_or(0.0f);
}
float getObstacleH(int i) {
  return safeGet(getGameState().obstacles.items, i)
      .transform([](const auto& ref) { return ref.get().bounds.h; })
      .value_or(0.0f);
}
int getObstacleType(int i) {
  return static_cast<int>(safeGet(getGameState().obstacles.items, i)
      .transform([](const auto& ref) { return ref.get().type; })
      .value_or(ObstacleType::TallGroundBlock));
}

// ── Particles ───────────────────────────────────────────────────────────────

int getParticleCount() {
  return getGameState().particles.count();
}
float getParticleX(int i) {
  return safeGet(getGameState().particles.items, i)
      .transform([](const auto& ref) { return ref.get().x; })
      .value_or(0.0f);
}
float getParticleY(int i) {
  return safeGet(getGameState().particles.items, i)
      .transform([](const auto& ref) { return ref.get().y; })
      .value_or(0.0f);
}
float getParticleLife(int i) {
  return safeGet(getGameState().particles.items, i)
      .transform(
          [](const auto& ref) { return ref.get().life / ref.get().maxLife; })
      .value_or(0.0f);
}
int getParticleR(int i) {
  return safeGet(getGameState().particles.items, i)
      .transform([](const auto& ref) { return ref.get().color.r; })
      .value_or(0);
}
int getParticleG(int i) {
  return safeGet(getGameState().particles.items, i)
      .transform([](const auto& ref) { return ref.get().color.g; })
      .value_or(0);
}
int getParticleB(int i) {
  return safeGet(getGameState().particles.items, i)
      .transform([](const auto& ref) { return ref.get().color.b; })
      .value_or(0);
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_BINDINGS(game) {
  // Lifecycle
  emscripten::function("resetGame", &resetGame);
  emscripten::function("startGame", &startGame);
  emscripten::function("update", &update);
  emscripten::function("jump", &jump);

  // Player
  emscripten::function("getPlayerX", &getPlayerX);
  emscripten::function("getPlayerY", &getPlayerY);
  emscripten::function("getPlayerW", &getPlayerW);
  emscripten::function("getPlayerH", &getPlayerH);
  emscripten::function("getWorldX", &getWorldX);
  emscripten::function("getGroundY", &getGroundY);
  emscripten::function("getAnimTimer", &getAnimTimer);
  emscripten::function("isOnGround", &isOnGround);

  // World
  emscripten::function("getScore", &getScore);
  emscripten::function("getHiScore", &getHiScore);
  emscripten::function("isAlive", &isAlive);
  emscripten::function("isStarted", &isStarted);
  emscripten::function("getScrollSpeed", &getScrollSpeed);
  emscripten::function("getGroundTile", &getGroundTile);

  // Obstacles
  emscripten::function("getObstacleCount", &getObstacleCount);
  emscripten::function("getObstacleX", &getObstacleX);
  emscripten::function("getObstacleY", &getObstacleY);
  emscripten::function("getObstacleW", &getObstacleW);
  emscripten::function("getObstacleH", &getObstacleH);
  emscripten::function("getObstacleType", &getObstacleType);

  // Particles
  emscripten::function("getParticleCount", &getParticleCount);
  emscripten::function("getParticleX", &getParticleX);
  emscripten::function("getParticleY", &getParticleY);
  emscripten::function("getParticleLife", &getParticleLife);
  emscripten::function("getParticleR", &getParticleR);
  emscripten::function("getParticleG", &getParticleG);
  emscripten::function("getParticleB", &getParticleB);
}
#endif
