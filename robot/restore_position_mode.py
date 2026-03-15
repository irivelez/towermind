#!/usr/bin/env python3
"""Restore specific servo IDs back to position mode."""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from scservo_sdk import PortHandler, sms_sts

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000

# IDs to restore to position mode (arm servos wrongly set to wheel mode)
RESTORE_IDS = [1, 2, 7]  # edit this list as needed

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)
portHandler.openPort()
portHandler.setBaudRate(BAUDRATE)

for sid in RESTORE_IDS:
    packetHandler.WriteSpec(sid, 0, 0)           # stop first
    packetHandler.unLockEprom(sid)
    packetHandler.write1ByteTxRx(sid, 33, 0)     # MODE = 0 → position mode
    packetHandler.LockEprom(sid)
    print(f"ID {sid} → position mode restored")

portHandler.closePort()
