from setuptools import setup

plugin_identifier = "prettygcode"
plugin_package = "octoprint_prettygcode"
plugin_name = "OctoPrint-PrettyGCode"
plugin_version = "1.3.0a1"
plugin_description = "A fast G-code viewer tab for OctoPrint using Three.js"
plugin_author = "Nic Clift"
plugin_author_email = "your@email.com"  # TODO: use your GitHub/real email
plugin_url = "https://github.com/nicclift/OctoPrint-PrettyGCode"
plugin_license = "MIT"

plugin_requires = ["OctoPrint>=1.9.0"]

setup(
    name=plugin_name,
    version=plugin_version,
    description=plugin_description,
    author=plugin_author,
    author_email=plugin_author_email,
    url=plugin_url,
    license=plugin_license,
    packages=[plugin_package],
    include_package_data=True,
    zip_safe=False,
    install_requires=plugin_requires,
    entry_points={"octoprint.plugin": [f"{plugin_identifier} = {plugin_package}"]},
    classifiers=[
        "Programming Language :: Python :: 3",
        "Framework :: OctoPrint",
        "License :: OSI Approved :: MIT License",
    ],
)
