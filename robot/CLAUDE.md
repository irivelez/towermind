# Robot Project — AI Context

## Hardware
- **Board**: Raspberry Pi 5
- **Bus Servo Controller**: Waveshare Bus Servo Adapter (A)
  - USB → `/dev/ttyACM0` (QinHeng CH343, stable ID: `usb-1a86_USB_Single_Serial_5A46083434-if00`)
  - Baud rate: 1,000,000
  - Protocol: SCServo/STServo SDK (`scservo_sdk/` in robot_ws)
  - **9x ST/SC series bus servos detected** — IDs 1–9, model 777
  - Joint-to-ID mapping: TBD
- **PCA9685** (I2C 0x40) — ⚠️ NOT functional, wiring unresolved (i2cdetect shows nothing on i2c-1 as of 2026-03-15)
  - Channel 0 → Left wheel, 1 → Right wheel, 2 → Back wheel, 4-7 → Servos 0-3
- **Cameras**: 2x USB cameras (/dev/video0, /dev/video1)

## Software Stack
- **OS**: Raspberry Pi OS (Linux)
- **ROS**: ROS 2 Jazzy (running inside Docker)
- **Docker image**: `robot_ros2` (built from `robot_ws/Dockerfile`)
- **Session manager**: tmux (installed on host)

## ROS 2 Packages (in `src/`)
| Package | Purpose |
|---------|---------|
| `servo_controller` | Controls 4 servos via PCA9685 channels 4-7 |
| `wheel_controller` | Controls 3 wheels via PCA9685 channels 0-2 |
| `robot_bringup` | Launch file that starts cameras + wheels + servos |

## Key Topics
| Topic | Type | Description |
|-------|------|-------------|
| `/cmd_vel` | geometry_msgs/Twist | Drive the robot |
| `/servo/0..3` | std_msgs/Float32 | Servo angle (-90 to 90°) |
| `/camera_front/image_raw` | sensor_msgs/Image | Front camera |
| `/camera_back/image_raw` | sensor_msgs/Image | Back camera |

## I2C Status
- I2C enabled in `/boot/firmware/config.txt` (`dtparam=i2c_arm=on`)
- GPIO I2C bus: `/dev/i2c-1` (Pi 5 also has `/dev/i2c-13` and `/dev/i2c-14` for internal RP1 chip)
- PCA9685 should appear at 0x40 on i2c-1 when wired to GPIO 2 (SDA) / GPIO 3 (SCL)
- **Status**: Wiring under verification — as of 2026-03-14, i2cdetect -y 1 shows no devices

## How to Start the Robot
```bash
# Start everything (from host)
cd ~/robot_ws && ./start_robot.sh

# Inside container manually
sudo docker run -it --rm --name robot_ros2 --network host --privileged \
  -v $(pwd)/src:/robot_ws/src -v /dev:/dev robot_ros2 bash
# Then:
cd /robot_ws && colcon build --symlink-install && source install/setup.bash
ros2 launch robot_bringup robot.launch.py
```

## Quick Diagnostics
```bash
# Scan for bus servos (no ROS needed)
python3 ~/robot_ws/ping_servos.py

# Move all bus servos through center/min/max
python3 ~/robot_ws/move_servos.py

# Stop all bus servos immediately
python3 ~/robot_ws/stop_servos.py

# Check I2C wiring (PCA9685 — currently unresolved)
i2cdetect -y 1

# Direct PCA9685 motor test (requires I2C wiring fix first)
python3 ~/robot_ws/test_motor.py

# Check ROS topics inside container
ros2 topic list
ros2 topic echo /cmd_vel --once
```

## Known Issues / Notes
- `teleop_twist_keyboard` must run inside the same container as the ROS nodes (no xterm, SSH only)
- `start_robot.sh` launches everything in tmux: ros2 nodes + teleop in one container
- Adafruit CircuitPython Blinka does NOT work on Pi 5 — all hardware code uses `smbus2` directly
- `source install/setup.bash` must use `. /robot_ws/install/setup.bash` (full path) inside the container
- `start_robot.sh` uses `bash --login -c` to ensure ROS env is loaded, and `. /robot_ws/install/setup.bash` for workspace
