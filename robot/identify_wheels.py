#!/usr/bin/env python3
"""
Wheel identification using SPIN mode.
Tests each servo by spinning it continuously — wheels will visibly spin,
arm servos will just twitch or hit their limit.
Press Enter to stop current servo and move to next.
"""
import sys
import tty
import termios
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))

from scservo_sdk import PortHandler, sms_sts

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000
SERVO_IDS  = [1, 2, 3, 4, 5, 6, 7, 8, 9]
SPIN_SPEED = 500   # slow spin so arm servos don't break anything

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)

portHandler.openPort()
portHandler.setBaudRate(BAUDRATE)

def getch():
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)

def set_wheel_mode(sid):
    packetHandler.unLockEprom(sid)
    packetHandler.WheelMode(sid)
    packetHandler.LockEprom(sid)

def set_position_mode(sid):
    packetHandler.unLockEprom(sid)
    packetHandler.write1ByteTxRx(sid, 33, 0)  # SMS_STS_MODE = 0 → position mode
    packetHandler.LockEprom(sid)

def spin(sid, speed=SPIN_SPEED):
    packetHandler.WriteSpec(sid, speed, 0)

def stop(sid):
    packetHandler.WriteSpec(sid, 0, 0)

labels = {}

print("=== Wheel Identification via Spin ===")
print("Each servo will spin. Watch which one is a WHEEL (it will rotate freely).")
print("Keys: w=wheel  s=skip  r=reverse spin  q=quit\n")

for sid in SERVO_IDS:
    print(f"\n--- Servo ID {sid} ---")
    print(f"  Setting wheel mode and spinning...")
    set_wheel_mode(sid)
    spin(sid, SPIN_SPEED)

    direction = 1
    while True:
        print(f"  Spinning ID {sid} at speed {SPIN_SPEED * direction:+d}  [w=wheel / s=skip / r=reverse / q=quit]", end="\r")
        key = getch().lower()

        if key == 'w':
            label = input(f"\n  Label (left / right / back): ").strip()
            labels[sid] = f"wheel_{label}"
            print(f"  Saved: ID {sid} = wheel_{label}")
            break
        elif key == 's':
            # Restore position mode for non-wheel servos
            stop(sid)
            set_position_mode(sid)
            labels[sid] = "not_a_wheel"
            print(f"\n  Skipped ID {sid} → restored to position mode")
            break
        elif key == 'r':
            direction *= -1
            spin(sid, SPIN_SPEED * direction)
        elif key == 'q':
            stop(sid)
            break

    stop(sid)
    if key == 'q':
        break

print("\n\n=== Results ===")
for sid, label in labels.items():
    print(f"  Servo ID {sid:2d} → {label}")

portHandler.closePort()
