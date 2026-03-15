#!/usr/bin/env python3
"""
Keyboard drive — 3-wheel omni robot.
Wheel layout (top view):
        [FRONT]
    L(7)     R(9)
         B(8)

  A/D   — forward / backward
  W/S   — strafe left / right
  Q/E   — rotate CCW / CW
  Space — stop
  X     — quit
  +/-   — speed up / down
"""
import sys, tty, termios
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from scservo_sdk import PortHandler, sms_sts

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000

ID_LEFT  = 7
ID_BACK  = 8
ID_RIGHT = 9

ACC   = 50
speed = 500   # starting speed, adjustable with +/-

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)

if not portHandler.openPort():
    print("ERROR: Failed to open port"); sys.exit(1)
if not portHandler.setBaudRate(BAUDRATE):
    print("ERROR: Failed to set baudrate"); sys.exit(1)

print("Init wheels...")
for sid in [ID_LEFT, ID_BACK, ID_RIGHT]:
    packetHandler.unLockEprom(sid)
    packetHandler.WheelMode(sid)
    packetHandler.LockEprom(sid)
    packetHandler.write1ByteTxRx(sid, 40, 1)  # TORQUE_ENABLE
    print(f"  ID {sid} OK")

def send(l, b, r):
    packetHandler.WriteSpec(ID_LEFT,  l, ACC)
    packetHandler.WriteSpec(ID_BACK,  b, ACC)
    packetHandler.WriteSpec(ID_RIGHT, r, ACC)

def stop():
    send(0, 0, 0)

# Direct speed map: (left, back, right)
# Signs to be tuned based on physical wheel orientation
KEYMAP = {
    'a': ( speed,  -speed,  speed),   # forward
    'd': (-speed,   speed, -speed),   # backward
    'w': (-speed,       0,  speed),   # strafe left
    's': ( speed,       0, -speed),   # strafe right
    'q': ( speed,   speed,  speed),   # rotate CCW
    'e': (-speed,  -speed, -speed),   # rotate CW
    ' ': (0, 0, 0),
}

def getch():
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)

print(__doc__)
print(f"Speed: {speed}  (use +/- to adjust)\nReady:\n")

try:
    while True:
        key = getch().lower()
        if key == 'x':
            break
        elif key in ('+', '='):
            speed = min(speed + 100, 2000)
            print(f"  Speed → {speed}")
        elif key == '-':
            speed = max(speed - 100, 100)
            print(f"  Speed → {speed}")
        elif key in KEYMAP:
            l, b, r = KEYMAP[key]
            # Rescale with current speed if not stop
            if any((l, b, r)):
                s = speed
                l = int(l / abs(l) * s) if l else 0
                b = int(b / abs(b) * s) if b else 0
                r = int(r / abs(r) * s) if r else 0
            send(l, b, r)
            labels = {'a':'FORWARD','d':'BACKWARD','w':'STRAFE L','s':'STRAFE R',
                      'q':'ROT CCW','e':'ROT CW',' ':'STOP'}
            print(f"  {labels.get(key,''):10s}  L={l:+5d}  B={b:+5d}  R={r:+5d}")
        else:
            print(f"  Unknown: {repr(key)}")
finally:
    stop()
    portHandler.closePort()
    print("\nStopped. Bye.")
