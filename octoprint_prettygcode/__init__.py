# -*- coding: utf-8 -*-
from __future__ import annotations
import octoprint.plugin


class PrettyGCodePlugin(
    octoprint.plugin.StartupPlugin,
    octoprint.plugin.TemplatePlugin,
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.SettingsPlugin,
):
    def on_after_startup(self):
        self._logger.info("PrettyGCode: plugin started")

    # Tell OctoPrint to add our tab
    def get_template_configs(self):
        return [
            dict(
                type="tab",
                name="PrettyGCode",
                template="prettygcode_tab.jinja2",
                custom_bindings=False,
            )
        ]

    # Tell OctoPrint which static assets to serve (relative to octoprint_prettygcode/static/)
    def get_assets(self):
        return dict(
            js=[
                "js/three.min.js",
                "js/LineGeometry.js",
                "js/LineSegmentsGeometry.js",
                "js/LineMaterial.js",
                "js/Line2.js",
                "js/LineSegments2.js",
                "js/OBJLoader.js",
                "js/camera-controls.js",
                "js/Lut.js",
                "js/dat.gui.js",
                "js/prettygcode.js",
            ],
            css=["css/prettygcode.css"],
        )

    # Default plugin settings (user can override later)
    def get_settings_defaults(self):
        return dict(colorScheme="bySpeed", showAxes=True)


# If you want your plugin to be registered within OctoPrint under a
# different name than what you defined in setup.py ("OctoPrint-PrettyGCode"),
# you may define that here. Same goes for the other metadata derived
# from setup.py – it can be overwritten via __plugin_xyz__ control
# properties. See the documentation for details.

__plugin_name__ = "PrettyGCode"
__plugin_pythoncompat__ = ">=3.8,<4"


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = PrettyGCodePlugin()
