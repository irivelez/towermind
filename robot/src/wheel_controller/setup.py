from setuptools import setup

package_name = 'wheel_controller'

setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    install_requires=['setuptools'],
    zip_safe=True,
    entry_points={
        'console_scripts': [
            'wheel_node = wheel_controller.wheel_node:main',
        ],
    },
)
