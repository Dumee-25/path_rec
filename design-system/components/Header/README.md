# Header

The app's only navigation: logo, "Faculty of Computing" and the theme toggle, 64px tall on `surface` with a `border` bottom rule.

Provide `logo` as the official NSBM Green University `<img>` sized by width (150px desktop, 120px mobile, set by the component); without it the header shows "NSBM Green University" in plain type. Pass `theme` and `onThemeChange` to drive the built-in `ThemeToggle`, or replace it through `end`.

`links` is optional and limited to Home and About This Tool. Never rebuild the corporate NSBM menu. On mobile the title and links hide, leaving logo and toggle.
