add_executable(game
    src/Bindings.cpp
    src/Game.cpp
    src/Obstacle.cpp
    src/Particle.cpp
    src/Player.cpp
    src/World.cpp
)

target_include_directories(game PRIVATE include)

target_compile_options(game PRIVATE
    -Wall -Wextra -Wpedantic
    -Wswitch -Wshadow -Wnon-virtual-dtor
    $<$<CONFIG:Release>:-O3>
    $<$<CONFIG:Debug>:-O0 -g>
)

if(EMSCRIPTEN)
    target_compile_options(game PRIVATE
        $<$<CONFIG:Release>:-flto>
        $<$<CONFIG:Debug>:-gsource-map>
    )

    target_link_options(game PRIVATE
        --bind
        -sMODULARIZE=1
        -sEXPORT_NAME=GameModule
        -sALLOW_MEMORY_GROWTH=1
        -sNO_EXIT_RUNTIME=1
        -sENVIRONMENT=web
        -sSINGLE_FILE=0
        -sDYNAMIC_EXECUTION=0 
        $<$<CONFIG:Debug>:
            -sASSERTIONS=2
            -sSAFE_HEAP=1>
        $<$<CONFIG:Release>:
            -flto
            --closure=1>
    )

    set_target_properties(game PROPERTIES SUFFIX ".js")
endif()
