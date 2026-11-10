---
name: mobile
description: Build and verify iOS and Android apps, including React Native, Expo, Flutter, Swift and Kotlin projects: running on simulators and emulators, inspecting real screens, and handling device-specific behaviour. Use when the work targets a phone or tablet app.
---

# Mobile apps

- Find the project's stack and how it runs (Expo, Xcode scheme, Gradle task) from its files and scripts before running anything.
- Verify on a simulator or emulator, not only by building, and look at the actual screen after each change.
- Inside T3 Code, drive the simulator or emulator through its device tools: `device_list` to find it, `device_open` for the `agent-device` command bound to it (use that command for launches, deep links, taps, text and screenshots), and `device_screenshot` to look. The user watches the device panel, and input sent another way bypasses it. `xcrun simctl` and `adb` stay fine there for builds, installs, logs, and what the device tools cannot do, such as `simctl addmedia`. Outside T3, use the harness's own device tools or the `agent-device` CLI when present, otherwise `xcrun simctl` and `adb`.
- Check the states phones add: small and large screens, safe areas and notches, keyboard covering inputs, dark mode, dynamic type or font scaling, rotation if supported, slow and offline network, and permission prompts denied.
- Touch targets at least 44pt (iOS) or 48dp (Android). Use platform components and navigation patterns unless the app already does otherwise.
- Native builds are slow: change one thing per rebuild cycle and prefer hot reload where the stack has it.
- Store releases need the right account, bundle ID and signing setup: if the user hasn't named them, ask.
