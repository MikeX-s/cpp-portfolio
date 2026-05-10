#pragma once

struct Color {
  int r, g, b;
};

namespace Colors {
inline constexpr Color White = {255, 255, 255};
inline constexpr Color Yellow = {255, 220, 50};
inline constexpr Color Orange = {255, 140, 0};
inline constexpr Color DeathBurst = {255, 80, 20};
inline constexpr Color ScoreBurst = {0, 255, 200};
inline constexpr Color JumpBurst = {100, 200, 255};
}  // namespace Colors