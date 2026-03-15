#!/usr/bin/env python3
"""Direct wheel servo test — shows errors and reads back speed."""
import sys, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from scservo_sdk import PortHandler, sms_sts, COMM_SUCCESS

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000
WHEELS     = [7, 8, 9]   # left, back, right
TEST_SPEED = 500

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)
portHandler.openPort()
portHandler.setBaudRate(BAUDRATE)

print("=== Step 1: Set wheel mode + enable torque ===")
for sid in WHEELS:
    packetHandler.unLockEprom(sid)
    r, e = packetHandler.WheelMode(sid)
    print(f"  ID {sid} WheelMode → result={r} error={e}")
    packetHandler.LockEprom(sid)
    # Explicitly enable torque
    r, e = packetHandler.write1ByteTxRx(sid, 40, 1)  # SMS_STS_TORQUE_ENABLE
    print(f"  ID {sid} TorqueEnable → result={r} error={e}")

time.sleep(0.5)

print(f"\n=== Step 2: Spin all wheels at speed {TEST_SPEED} for 3 sec ===")
for sid in WHEELS:
    r, e = packetHandler.WriteSpec(sid, TEST_SPEED, 50)
    print(f"  ID {sid} WriteSpec({TEST_SPEED}) → result={r} error={e}")

time.sleep(3)

print("\n=== Step 3: Read back present speed ===")
for sid in WHEELS:
    speed, r, e = packetHandler.ReadSpeed(sid)
    print(f"  ID {sid} present speed = {speed}  result={r} error={e}")

print("\n=== Step 4: Stop ===")
for sid in WHEELS:
    packetHandler.WriteSpec(sid, 0, 0)

portHandler.closePort()
print("Done.")
