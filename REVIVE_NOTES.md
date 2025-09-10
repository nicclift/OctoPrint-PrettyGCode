# PrettyGCode revival – MVP plan (1.3.0)
- Add get_template_configs(custom_bindings=True) in __init__.py (tab + mount point)
- Use OCTOPRINT_BASEURL for downloads (no hardcoded /downloads/…)
- Wire printerState (currentJobData + events: FileSelected, PrintStarted) to updateJob()
- Replace cookies with localStorage (saveOpt/loadOpt helpers)
- Fix CSS selectors: prefer `.pgc-tab` or ensure `#tab_plugin_PrettyGCode`
- Pin three.min.js + Line2/* to same release; load order: three → helpers → prettygcode.js
- Lazy init renderer on tab open; add/remove `.pgfullscreen` on body for fullscreen
- Keep Python 3 only: __plugin_pythoncompat__ = ">=3.7,<4"
- No external CDNs; rely on OctoPrint assets/CSP
