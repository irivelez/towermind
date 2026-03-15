#!/usr/bin/env python3
"""
ROS 2 node — 3-wheel robot drive controller via PCA9685 continuous rotation servos.

Wheel layout (top view):
         [FRONT]
    L(0)       R(1)
          B(2)
        [BACK]

Subscribes:
  /cmd_vel  (geometry_msgs/Twist)
    linear.x  → forward / backward
    angular.z → turn left / right

PCA9685 channels:
  0 = left wheel
  1 = right wheel
  2 = back wheel

Uses smbus2 directly (Adafruit Blinka does not support Pi 5).
"""

import time
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist

try:
    import smbus2
    HAS_HW = True
except ImportError:
    HAS_HW = False

# PCA9685 registers
PCA9685_ADDR = 0x40
MODE1        = 0x00
PRESCALE     = 0xFE
LED0_ON_L    = 0x06
I2C_BUS      = 1  # GPIO I2C bus

# Wheel channels
CH_LEFT  = 0
CH_RIGHT = 1
CH_BACK  = 2


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


def _throttle_to_ticks(throttle):
    """throttle -1..1 → pulse 1000..2000 µs → ticks at 50 Hz (4096 ticks/period)"""
    pulse_us = 1500 + throttle * 500
    return int(pulse_us / 20000.0 * 4096)


class WheelControllerNode(Node):

    def __init__(self):
        super().__init__('wheel_controller')
        self.bus = None

        if HAS_HW:
            try:
                self.bus = smbus2.SMBus(I2C_BUS)
                self.bus.write_byte_data(PCA9685_ADDR, MODE1, 0x00)
                time.sleep(0.01)
                _set_pwm_freq(self.bus, 50)
                self._stop_all()
                self.get_logger().info('PCA9685 wheels initialized — hardware mode')
            except Exception as e:
                self.bus = None
                self.get_logger().warn(f'PCA9685 init failed: {e} — simulation mode')
        else:
            self.get_logger().warn('smbus2 not found — simulation mode')

        self.create_subscription(Twist, '/cmd_vel', self._on_cmd_vel, 10)
        self.get_logger().info('Wheel controller ready — listening on /cmd_vel')

    def _stop_all(self):
        for ch in (CH_LEFT, CH_RIGHT, CH_BACK):
            _set_pwm(self.bus, ch, _throttle_to_ticks(0.0))

    def _set_wheel(self, channel, throttle):
        if self.bus:
            t = max(-1.0, min(1.0, throttle))
            _set_pwm(self.bus, channel, _throttle_to_ticks(t))

    def _on_cmd_vel(self, msg: Twist):
        linear  = msg.linear.x
        angular = msg.angular.z

        left_speed  = linear - angular
        right_speed = linear + angular
        back_speed  = linear

        scale = max(abs(left_speed), abs(right_speed), 1.0)
        left_speed  /= scale
        right_speed /= scale
        back_speed   = max(-1.0, min(1.0, back_speed))

        self.get_logger().info(
            f'cmd_vel → L:{left_speed:+.2f}  R:{right_speed:+.2f}  B:{back_speed:+.2f}'
        )

        self._set_wheel(CH_LEFT,  left_speed)
        self._set_wheel(CH_RIGHT, -right_speed)  # right wheel is mirrored
        self._set_wheel(CH_BACK,  back_speed)


def main(args=None):
    rclpy.init(args=args)
    node = WheelControllerNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        if node.bus:
            node._stop_all()
            node.bus.close()
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
