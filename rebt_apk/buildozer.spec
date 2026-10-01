[app]
title = REBT Cuestionados
package.name = rebtcuestionados
package.domain = com.superautoma
source.dir = .
source.include_exts = py,png,jpg,kv,json,db
version = 0.1.0
requirements = python3,kivy
orientation = portrait
fullscreen = 0

# Toolchain Android actual
android.api = 36
android.minapi = 24
android.ndk = 29
android.archs = arm64-v8a
android.accept_sdk_license = True
android.debug_artifact = apk

# python-for-android: rama recomendada para el toolchain actual
p4a.branch = develop
p4a.bootstrap = sdl2

[buildozer]
log_level = 2
warn_on_root = 0
