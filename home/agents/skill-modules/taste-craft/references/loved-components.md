# Building components people love: the Sonner principles

Lessons from building Sonner (13M+ weekly npm downloads) that apply to any component.

1. **Developer experience is key.** No hooks, no context, no complex setup: insert `<Toaster />` once and call `toast()` from anywhere. The less friction to adopt, the more people use it.

2. **Good defaults matter more than options.** Ship it beautiful out of the box; most users never customize. The default easing, timing, and visual design should be excellent.

3. **Naming creates identity.** "Sonner" (French for "to ring") feels more elegant than "react-toast". Trade discoverability for memorability when it fits.

4. **Handle edge cases invisibly.** Pause toast timers when the tab is hidden. Fill gaps between stacked toasts with pseudo-elements so hover holds. Capture pointer events during drag. Users never notice these, which is the point.

5. **Use transitions, not keyframes, for dynamic UI.** Toasts arrive rapidly. Keyframes restart from zero when interrupted; transitions retarget smoothly.

6. **Build a great documentation site.** Let people touch and play with the component before they adopt it. Interactive examples with ready-to-use snippets lower the barrier.

## Cohesion

Sonner's animation satisfies partly because the whole experience agrees with itself. It sits toward the slow end of the toast range and uses `ease` rather than a sharp ease-out to feel elegant, and that motion matches the toast design, the page, and the name.

When choosing values, consider the component's personality: a playful component can be bouncier, a professional dashboard should be crisp and fast. Personality moves values within the ranges in `~/.agents/skills/motion/SKILL.md`; it does not justify leaving them.

## Opacity with height

When items enter and leave a list (like Family's drawer), the opacity change has to work with the height animation. This is the one common case where animating a layout property is the point, and it is trial and error: adjust until it feels right, then check it for jank.
