#!/usr/bin/env python3
"""
Move all detected ST/SC bus servos via Bus Servo Adapter (A) on /dev/ttyACM0.
Moves each servo to center (2048), then sweeps to min/max.
"""
import sys
import time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))

from scservo_sdk import PortHandler, sms_sts, COMM_SUCCESS

DEVICENAME  = '/dev/ttyACM0'
BAUDRATE    = 1000000
SERVO_IDS   = [1, 2, 3, 4, 5, 6, 7, 8, 9]

CENTER  = 2048
MIN_POS = 1024
MAX_POS = 3072
SPEED   = 1000   # ticks/sec
ACC     = 50     # acceleration

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)

if not portHandler.openPort():
    print("ERROR: Failed to open port"); sys.exit(1)
if not portHandler.setBaudRate(BAUDRATE):
    print("ERROR: Failed to set baudrate"); sys.exit(1)

def move_all(position, speed=SPEED, acc=ACC):
    for sid in SERVO_IDS:
        result, error = packetHandler.WritePosEx(sid, position, speed, acc)
        if result != COMM_SUCCESS:
            print(f"  [ID {sid}] comm error: {packetHandler.getTxRxResult(result)}")
        elif error:
            print(f"  [ID {sid}] servo error: {packetHandler.getRxPacketError(error)}")

print("=== Moving all servos to CENTER (2048) ===")
move_all(CENTER)
time.sleep(2)

print("=== Moving all servos to MIN (1024) ===")
move_all(MIN_POS)
time.sleep(2)

print("=== Moving all servos to MAX (3072) ===")
move_all(MAX_POS)
time.sleep(2)

print("=== Returning to CENTER ===")
move_all(CENTER)
time.sleep(2)

print("Done.")
portHandler.closePort()
