#pragma once

#include "Obstacle.h"
#include "Particle.h"
#include "Player.h"
#include "World.h"

enum class GamePhase : uint8_t {
  WaitingToStart,
  Running,
  Dead
};

struct GameState {
  PlayerState player;
  WorldState world;
  ObstacleSystem obstacles;
  ParticleSystem particles;
  GamePhase phase = GamePhase::WaitingToStart;
  int deathFrame = 0;  // valid only when phase == Dead
};

struct AppState {
  GameState game;
  int hiScore = 0;  // survives resets
};