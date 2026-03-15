#!/usr/bin/env python3
"""Stop all bus servos immediately."""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))

from scservo_sdk import PortHandler, sms_sts

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000
SERVO_IDS  = [1, 2, 3, 4, 5, 6, 7, 8, 9]

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)

portHandler.openPort()
portHandler.setBaudRate(BAUDRATE)

for sid in SERVO_IDS:
    packetHandler.WriteSpec(sid, 0, 0)

print("All servos stopped.")
portHandler.closePort()
