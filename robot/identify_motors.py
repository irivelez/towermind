#!/usr/bin/env python3
"""
Interactive servo identification.
Moves one servo at a time so you can see which physical motor it controls.
Press Enter to move next, 'w' to label it as a wheel, 's' to skip, 'q' to quit.
"""
import sys
import time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))

from scservo_sdk import PortHandler, sms_sts, COMM_SUCCESS

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000
SERVO_IDS  = [1, 2, 3, 4, 5, 6, 7, 8, 9]

CENTER  = 2048
MOVE_A  = 1800   # small nudge from center
MOVE_B  = 2300   # other direction
SPEED   = 500
ACC     = 30

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)

if not portHandler.openPort():
    print("ERROR: Failed to open port"); sys.exit(1)
if not portHandler.setBaudRate(BAUDRATE):
    print("ERROR: Failed to set baudrate"); sys.exit(1)

def move(sid, pos):
    result, error = packetHandler.WritePosEx(sid, pos, SPEED, ACC)
    if result != COMM_SUCCESS:
        print(f"  comm error: {packetHandler.getTxRxResult(result)}")
    elif error:
        print(f"  servo error: {packetHandler.getRxPacketError(error)}")

def stop(sid):
    packetHandler.WriteSpec(sid, 0, 0)

def center_all():
    for sid in SERVO_IDS:
        move(sid, CENTER)
    time.sleep(1)

labels = {}

print("=== Servo Identification ===")
print("Commands: Enter=next, w=wheel, s=skip/unknown, q=quit\n")
print("Centering all servos first...")
center_all()

for sid in SERVO_IDS:
    print(f"\n--- Testing servo ID {sid} ---")
    print(f"  Moving ID {sid}: {CENTER} → {MOVE_A} → {MOVE_B} → {CENTER}")

    move(sid, MOVE_A)
    time.sleep(1)
    move(sid, MOVE_B)
    time.sleep(1)
    move(sid, CENTER)
    time.sleep(0.5)
    stop(sid)

    ans = input(f"  What is servo {sid}? [w=wheel / s=skip / q=quit]: ").strip().lower()

    if ans == 'q':
        break
    elif ans == 'w':
        label = input(f"  Label it (e.g. left, right, back): ").strip()
        labels[sid] = f"wheel_{label}"
        print(f"  Saved: ID {sid} = wheel_{label}")
    else:
        labels[sid] = "unknown"
        print(f"  Skipped ID {sid}")

print("\n=== Results ===")
for sid, label in labels.items():
    print(f"  Servo ID {sid:2d} → {label}")

unmapped = [sid for sid in SERVO_IDS if sid not in labels]
if unmapped:
    print(f"  Not tested: {unmapped}")

portHandler.closePort()
