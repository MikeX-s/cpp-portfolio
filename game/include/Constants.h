#pragma once

namespace Physics {
inline constexpr float Gravity = 0.55f;
inline constexpr float JumpForce = -13.0f;  // negative = upward
inline constexpr float BaseSpeed = 4.5f;
inline constexpr float SpeedInc = 0.0008f;  // per frame
}  // namespace Physics

namespace Layout {
inline constexpr float GroundY = 300.0f;  // logical canvas anchor
inline constexpr float PlayerX = 120.0f;
inline constexpr float PlayerW = 32.0f;
inline constexpr float PlayerH = 40.0f;
}  // namespace Layout

namespace WorldCfg {
inline constexpr float InitialSpawnInterval = 90.0f;  // frames
inline constexpr float MinSpawnInterval = 55.0f;
inline constexpr float SpawnIntervalSpeedScale = 10.0f;
inline constexpr float GroundTileWidth = 600.0f;
inline constexpr float ScoreDivisor = 10.0f;
inline constexpr float TileRecycleThreshold = -620.0f;
inline constexpr float ObstacleSpawnX = 700.0f;
inline constexpr float ObstacleCullX = -50.0f;
inline constexpr float ParticleCullX = -50.0f;
}  // namespace WorldCfg

namespace PlayerCfg {
inline constexpr int MaxJumps = 2;
inline constexpr int JumpBurstCount = 8;
inline constexpr float AnimSpeedScale = 0.05f;
inline constexpr float DoubleJumpDamping = 0.8f;

}  // namespace PlayerCfg

namespace ParticleCfg {
inline constexpr int ScoreBurstCount = 6;
inline constexpr int DeathBurstCount = 24;
inline constexpr float SpreadX = 15.0f;
inline constexpr float SpreadY = 10.0f;
inline constexpr float MaxSpeed = 2.5f;
inline constexpr float UpwardBias = 2.0f;
inline constexpr float MinLife = 30.0f;
inline constexpr float MaxLife = 50.0f;
inline constexpr float Weight = 0.5f;

}  // namespace ParticleCfg

namespace ObstacleCfg {
inline constexpr int GroundBiasRollLimit = 7;
inline constexpr float SpeedBiasThreshold = 6.5f;
inline constexpr float GroundBlockMinW = 28.0f;
inline constexpr float GroundBlockWRange = 16.0f;
inline constexpr float GroundBlockMinH = 48.0f;
inline constexpr float GroundBlockHRange = 32.0f;
inline constexpr float PlatformW_Low = 80.0f;
inline constexpr float PlatformW_High = 60.0f;
inline constexpr float PlatformH = 18.0f;
inline constexpr float PlatformOffsetY_Low = 64.0f;
inline constexpr float PlatformOffsetY_High = 130.0f;
inline constexpr float CollisionMargin = 4.0f;
}  // namespace ObstacleCfg
