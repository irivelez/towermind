#!/bin/bash
# Starts everything inside ONE docker container using tmux

SESSION="robot"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

tmux kill-session -t $SESSION 2>/dev/null
tmux new-session -d -s $SESSION -x 220 -y 50

tmux send-keys -t $SESSION "sudo docker run -it --rm \
  --name robot_ros2 \
  --network host \
  --privileged \
  -v ${SCRIPT_DIR}/src:/robot_ws/src \
  -v /dev:/dev \
  robot_ros2 \
  bash --login -c '
    set -e
    cd /robot_ws
    echo \"=== Building...\"
    colcon build --symlink-install
    . /robot_ws/install/setup.bash
    echo \"=== Starting robot nodes...\"
    ros2 launch robot_bringup robot.launch.py &
    LAUNCH_PID=\$!
    sleep 4
    echo \"=== Ready! Use keys to move the robot ===\"
    ros2 run teleop_twist_keyboard teleop_twist_keyboard
    wait \$LAUNCH_PID
  '" Enter

tmux attach -t $SESSION
