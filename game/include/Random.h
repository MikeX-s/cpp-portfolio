#include <random>

static std::mt19937& getRng() {
  static std::mt19937 rng{std::random_device{}()};
  return rng;
}