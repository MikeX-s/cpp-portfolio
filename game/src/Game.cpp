#include "Game.h"

#include <exception>

static AppState app;

GameState& getGameState() {
  return app.game;
}

void resetGame() {
  app.game = GameState{};
}

void startGame() {
  resetGame();
  app.game.phase = GamePhase::Running;
}

void jump() {
  if (app.game.phase != GamePhase::Running)
    return;

  try {
    app.game.player.jump(app.game.particles);
  } catch (...) {
    std::terminate();
  }
}

void update() {
  if (app.game.phase != GamePhase::Running)
    return;

  try {
    app.game.world.update();
    app.game.world.updateGroundTiles();
    app.game.player.update(app.game.world);
    app.game.particles.update(app.game.world);
    app.game.obstacles.update(app.game.player, app.game.world,
                              app.game.particles, app.game.phase);
  } catch (...) {
    std::terminate();
  }
}

int main() {
  resetGame();
  // NO_EXIT_RUNTIME is set, so JS is managing the game loop
  return 0;
}