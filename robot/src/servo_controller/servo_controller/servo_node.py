#!/usr/bin/env python3
"""
ROS 2 node to control 4 servos via PCA9685 I2C controller.

Topics subscribed:
  /servo/0  (std_msgs/Float32)  - angle in degrees [-90, 90]
  /servo/1  (std_msgs/Float32)
  /servo/2  (std_msgs/Float32)
  /servo/3  (std_msgs/Float32)

PCA9685 channels 4-7 (channels 0-2 used by wheels).
Uses smbus2 directly (Adafruit Blinka does not support Pi 5).
"""

import time
import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32

try:
    import smbus2
    HAS_HW = True
except ImportError:
    HAS_HW = False

# PCA9685 registers
PCA9685_ADDR      = 0x40
MODE1             = 0x00
PRESCALE          = 0xFE
LED0_ON_L         = 0x06
I2C_BUS           = 1
SERVO_START_CH    = 4   # channels 0-2 = wheels, 3 = reserved
NUM_SERVOS        = 4
SERVO_MIN_PULSE   = 500    # µs
SERVO_MAX_PULSE   = 2500   # µs


def _set_pwm_freq(bus, freq_hz=50):
    prescale = int(25_000_000.0 / (4096 * freq_hz) - 1)
    old = bus.read_byte_data(PCA9685_ADDR, MODE1)
    bus.write_byte_data(PCA9685_ADDR, MODE1, (old & 0x7F) | 0x10)
    bus.write_byte_data(PCA9685_ADDR, PRESCALE, prescale)
    bus.write_byte_data(PCA9685_ADDR, MODE1, old)
    time.sleep(0.005)
    bus.write_byte_data(PCA9685_ADDR, MODE1, old | 0xA0)


def _set_pwm(bus, channel, off_ticks):
    reg = LED0_ON_L + 4 * channel
    bus.write_byte_data(PCA9685_ADDR, reg,     0)
    bus.write_byte_data(PCA9685_ADDR, reg + 1, 0)
    bus.write_byte_data(PCA9685_ADDR, reg + 2, off_ticks & 0xFF)
    bus.write_byte_data(PCA9685_ADDR, reg + 3, off_ticks >> 8)


def _angle_to_ticks(angle_deg):
    """angle 0..180 → pulse SERVO_MIN_PULSE..SERVO_MAX_PULSE → ticks at 50 Hz"""
    pulse_us = SERVO_MIN_PULSE + (angle_deg / 180.0) * (SERVO_MAX_PULSE - SERVO_MIN_PULSE)
    return int(pulse_us / 20000.0 * 4096)


class ServoControllerNode(Node):

    def __init__(self):
        super().__init__('servo_controller')
        self.bus = None

        if HAS_HW:
            try:
                self.bus = smbus2.SMBus(I2C_BUS)
                self.bus.write_byte_data(PCA9685_ADDR, MODE1, 0x00)
                time.sleep(0.01)
                _set_pwm_freq(self.bus, 50)
                # Center all servos on startup
                for i in range(NUM_SERVOS):
                    _set_pwm(self.bus, SERVO_START_CH + i, _angle_to_ticks(90))
                self.get_logger().info('PCA9685 servos initialized — hardware mode')
            except Exception as e:
                self.bus = None
                self.get_logger().warn(f'PCA9685 init failed: {e} — simulation mode')
        else:
            self.get_logger().warn('smbus2 not found — simulation mode')

        self.subscriptions_ = [
            self.create_subscription(
                Float32,
                f'/servo/{i}',
                lambda msg, idx=i: self._set_servo(idx, msg.data),
                10,
            )
            for i in range(NUM_SERVOS)
        ]
        self.get_logger().info(f'Servo controller ready — /servo/0 .. /servo/{NUM_SERVOS - 1}')

    def _set_servo(self, index: int, angle_deg: float):
        clamped = max(-90.0, min(90.0, angle_deg))
        mapped  = clamped + 90.0  # [-90,90] → [0,180]
        self.get_logger().info(f'Servo {index} → {angle_deg:.1f}°')
        if self.bus:
            _set_pwm(self.bus, SERVO_START_CH + index, _angle_to_ticks(mapped))


def main(args=None):
    rclpy.init(args=args)
    node = ServoControllerNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
