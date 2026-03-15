#!/usr/bin/env python3
"""
Scan for all ST/SC bus servos connected via Bus Servo Adapter (A) on /dev/ttyACM0.
Tries IDs 1-20.
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))

from scservo_sdk import PortHandler, sms_sts, COMM_SUCCESS

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)

if not portHandler.openPort():
    print("ERROR: Failed to open port"); sys.exit(1)
if not portHandler.setBaudRate(BAUDRATE):
    print("ERROR: Failed to set baudrate"); sys.exit(1)

print(f"Scanning IDs 1-20 on {DEVICENAME} @ {BAUDRATE} baud...\n")
found = []
for sid in range(1, 21):
    model, result, error = packetHandler.ping(sid)
    if result == COMM_SUCCESS:
        print(f"  [ID {sid:03d}] FOUND — model: {model}, error: {error}")
        found.append(sid)

print(f"\nFound {len(found)} servo(s): {found}")
portHandler.closePort()
