#!/usr/bin/env python3
"""
Arm servo identification — moves one servo at a time in position mode.
Watch which joint moves and label it.
Keys: Enter=next  l=label it  s=skip  q=quit
"""
import sys, tty, termios, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from scservo_sdk import PortHandler, sms_sts, COMM_SUCCESS

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000

# Suspected arm servo IDs (not wheels)
ARM_IDS = [1, 2, 3, 4, 5, 6]

CENTER   = 2048
NUDGE_A  = 1700
NUDGE_B  = 2400
SPEED    = 300
ACC      = 30

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)
portHandler.openPort()
portHandler.setBaudRate(BAUDRATE)

def move(sid, pos):
    packetHandler.WritePosEx(sid, pos, SPEED, ACC)

def getch():
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)

labels = {}

print("=== Arm Servo Identification ===")
print("Each servo nudges back and forth. Watch which joint moves.")
print("Keys: l=label  s=skip  q=quit\n")

for sid in ARM_IDS:
    print(f"\n--- Servo ID {sid} ---")
    move(sid, NUDGE_A); time.sleep(1.0)
    move(sid, NUDGE_B); time.sleep(1.0)
    move(sid, CENTER);  time.sleep(0.8)

    while True:
        key = getch().lower()
        if key == 'l':
            name = input(f"\n  Label for ID {sid} (e.g. base, shoulder, elbow, wrist, gripper): ").strip()
            labels[sid] = name
            print(f"  Saved: ID {sid} = {name}")
            break
        elif key == 's':
            labels[sid] = "unknown"
            print(f"\n  Skipped ID {sid}")
            break
        elif key == 'q':
            break
    if key == 'q':
        break

print("\n=== Results ===")
for sid, label in labels.items():
    print(f"  Servo ID {sid:2d} → {label}")

portHandler.closePort()
