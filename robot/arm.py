#!/usr/bin/env python3
"""
Keyboard arm control — position mode.

  Q / A  —  base        left / right
  W / S  —  shoulder    up / down
  E / D  —  elbow       up / down
  R / F  —  wrist tilt  up / down
  T / G  —  gripper     open / close
  0      —  center all joints
  + / -  —  step size   up / down
  X      —  quit
"""
import sys, tty, termios, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from scservo_sdk import PortHandler, sms_sts, COMM_SUCCESS

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000

# Joint config: id, min, max, center
JOINTS = {
    'base':     {'id': 1, 'min': 512,  'max': 3584, 'center': 2048},
    'shoulder': {'id': 2, 'min': 512,  'max': 3584, 'center': 2048},
    'elbow':    {'id': 3, 'min': 512,  'max': 3584, 'center': 2048},
    'wrist':    {'id': 5, 'min': 512,  'max': 3584, 'center': 2048},
    'gripper':  {'id': 6, 'min': 512,  'max': 3584, 'center': 2048},
}

SPEED = 300
ACC   = 30
STEP  = 50   # position ticks per keypress

portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)

if not portHandler.openPort():
    print("ERROR: Failed to open port"); sys.exit(1)
if not portHandler.setBaudRate(BAUDRATE):
    print("ERROR: Failed to set baudrate"); sys.exit(1)

# Read current positions
pos = {}
print("Reading current positions...")
for name, j in JOINTS.items():
    p, result, _ = packetHandler.ReadPos(j['id'])
    pos[name] = p if result == COMM_SUCCESS else j['center']
    print(f"  {name:10s} (ID {j['id']}) = {pos[name]}")

def move(name, target):
    j = JOINTS[name]
    target = max(j['min'], min(j['max'], target))
    pos[name] = target
    packetHandler.WritePosEx(j['id'], target, SPEED, ACC)
    return target

def center_all():
    for name, j in JOINTS.items():
        pos[name] = j['center']
        packetHandler.WritePosEx(j['id'], j['center'], SPEED, ACC)

def getch():
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)

# key → (joint, direction)
KEYMAP = {
    'q': ('base',     +1),
    'a': ('base',     -1),
    'w': ('shoulder', +1),
    's': ('shoulder', -1),
    'e': ('elbow',    +1),
    'd': ('elbow',    -1),
    'r': ('wrist',    +1),
    'f': ('wrist',    -1),
    't': ('gripper',  +1),
    'g': ('gripper',  -1),
}

step = STEP
print(__doc__)
print(f"Step: {step}  (use +/- to adjust)\nReady:\n")

try:
    while True:
        key = getch().lower()
        if key == 'x':
            break
        elif key == '0':
            center_all()
            print("  CENTER ALL")
        elif key in ('+', '='):
            step = min(step + 25, 500)
            print(f"  Step → {step}")
        elif key == '-':
            step = max(step - 25, 10)
            print(f"  Step → {step}")
        elif key in KEYMAP:
            joint, direction = KEYMAP[key]
            new_pos = move(joint, pos[joint] + direction * step)
            print(f"  {joint:10s} → {new_pos}")
        else:
            print(f"  Unknown: {repr(key)}")
finally:
    portHandler.closePort()
    print("\nDone.")
