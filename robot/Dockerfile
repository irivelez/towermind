FROM ros:jazzy

# Install dependencies
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-colcon-common-extensions \
    ros-jazzy-usb-cam \
    ros-jazzy-v4l2-camera \
    ros-jazzy-image-transport \
    ros-jazzy-teleop-twist-keyboard \
    ros-jazzy-joy \
    i2c-tools \
    python3-smbus2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /robot_ws

# Source ROS on every shell
RUN echo "source /opt/ros/jazzy/setup.bash" >> /root/.bashrc
RUN echo "[ -f /robot_ws/install/setup.bash ] && source /robot_ws/install/setup.bash" >> /root/.bashrc

CMD ["bash"]
