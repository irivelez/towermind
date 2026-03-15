#!/usr/bin/env python3
"""
=== ROBOT CONTROLLER ===
Tab     — switch mode (DRIVE / ARM)
X       — quit

--- DRIVE mode ---
  A / D  — forward / backward
  W / S  — strafe left / right
  Q / E  — rotate CCW / CW
  Space  — stop
  + / -  — speed adjust

--- ARM mode ---
  Q / A  — base        +/-
  W / S  — shoulder    +/-
  E / D  — elbow       +/-
  R / F  — wrist tilt  +/-
  T / G  — gripper     open/close
  0      — center all
  + / -  — step adjust
"""
import sys, tty, termios, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from scservo_sdk import PortHandler, sms_sts, COMM_SUCCESS

DEVICENAME = '/dev/ttyACM0'
BAUDRATE   = 1000000

# Wheel IDs
ID_LEFT  = 7
ID_BACK  = 8
ID_RIGHT = 9
WHEEL_ACC = 50

# Arm joints
JOINTS = {
    'base':     {'id': 1, 'min': 512, 'max': 3584, 'center': 2048},
    'shoulder': {'id': 2, 'min': 512, 'max': 3584, 'center': 2048},
    'elbow':    {'id': 3, 'min': 512, 'max': 3584, 'center': 2048},
    'wrist':    {'id': 5, 'min': 512, 'max': 3584, 'center': 2048},
    'gripper':  {'id': 6, 'min': 512, 'max': 3584, 'center': 2048},
}
ARM_SPEED = 300
ARM_ACC   = 30

# ---- Init ----
portHandler   = PortHandler(DEVICENAME)
packetHandler = sms_sts(portHandler)

if not portHandler.openPort():
    print("ERROR: Failed to open port"); sys.exit(1)
if not portHandler.setBaudRate(BAUDRATE):
    print("ERROR: Failed to set baudrate"); sys.exit(1)

print("Init wheels (wheel mode + torque)...")
for sid in [ID_LEFT, ID_BACK, ID_RIGHT]:
    packetHandler.unLockEprom(sid)
    packetHandler.WheelMode(sid)
    packetHandler.LockEprom(sid)
    packetHandler.write1ByteTxRx(sid, 40, 1)
    print(f"  ID {sid} OK")

print("Reading arm positions...")
arm_pos = {}
for name, j in JOINTS.items():
    p, result, _ = packetHandler.ReadPos(j['id'])
    arm_pos[name] = p if result == COMM_SUCCESS else j['center']
    print(f"  {name:10s} (ID {j['id']}) = {arm_pos[name]}")

# ---- Wheel functions ----
def wheels_send(l, b, r):
    packetHandler.WriteSpec(ID_LEFT,  l, WHEEL_ACC)
    packetHandler.WriteSpec(ID_BACK,  b, WHEEL_ACC)
    packetHandler.WriteSpec(ID_RIGHT, r, WHEEL_ACC)

def wheels_stop():
    wheels_send(0, 0, 0)

# ---- Arm functions ----
def arm_move(name, direction, step):
    j = JOINTS[name]
    target = arm_pos[name] + direction * step
    target = max(j['min'], min(j['max'], target))
    arm_pos[name] = target
    packetHandler.WritePosEx(j['id'], target, ARM_SPEED, ARM_ACC)
    return target

def arm_center():
    for name, j in JOINTS.items():
        arm_pos[name] = j['center']
        packetHandler.WritePosEx(j['id'], j['center'], ARM_SPEED, ARM_ACC)

# ---- Keyboard ----
def getch():
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)

DRIVE_KEYS = {
    'a': ( 1,  0,  0),
    'd': (-1,  0,  0),
    'w': ( 0, -1,  0),
    's': ( 0,  1,  0),
    'q': ( 0,  0,  1),
    'e': ( 0,  0, -1),
    ' ': ( 0,  0,  0),
}
DRIVE_LABELS = {'a':'FORWARD','d':'BACKWARD','w':'STRAFE L','s':'STRAFE R',
                'q':'ROT CCW','e':'ROT CW',' ':'STOP'}

ARM_KEYS = {
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

mode       = 'DRIVE'
drive_spd  = 800
arm_step   = 50

print(__doc__)
print(f"Mode: {mode}  |  Speed: {drive_spd}  |  Step: {arm_step}\n")

def status():
    if mode == 'DRIVE':
        print(f"  [DRIVE] speed={drive_spd}", end="   \n")
    else:
        print(f"  [ARM]   step={arm_step}", end="   \n")

try:
    while True:
        key = getch().lower()

        if key == 'x':
            break

        elif key == '\t':   # Tab — switch mode
            mode = 'ARM' if mode == 'DRIVE' else 'DRIVE'
            if mode == 'DRIVE':
                wheels_stop()
            print(f"\n  *** MODE: {mode} ***\n")
            continue

        elif key in ('+', '='):
            if mode == 'DRIVE':
                drive_spd = min(drive_spd + 100, 2000)
                print(f"  Speed → {drive_spd}")
            else:
                arm_step = min(arm_step + 25, 500)
                print(f"  Step → {arm_step}")
            continue

        elif key == '-':
            if mode == 'DRIVE':
                drive_spd = max(drive_spd - 100, 100)
                print(f"  Speed → {drive_spd}")
            else:
                arm_step = max(arm_step - 25, 10)
                print(f"  Step → {arm_step}")
            continue

        # --- DRIVE mode ---
        if mode == 'DRIVE':
            if key in DRIVE_KEYS:
                lx, ly, omega = DRIVE_KEYS[key]
                s = drive_spd
                l = lx * s if lx else (ly * s if ly else (omega * s if omega else 0))
                # direct per-wheel mapping based on identified directions
                if key == 'a':   wheels_send( s, -s,  s)
                elif key == 'd': wheels_send(-s,  s, -s)
                elif key == 'w': wheels_send(-s,  0,  s)
                elif key == 's': wheels_send( s,  0, -s)
                elif key == 'q': wheels_send( s,  s,  s)
                elif key == 'e': wheels_send(-s, -s, -s)
                elif key == ' ': wheels_stop()
                print(f"  {DRIVE_LABELS.get(key,''):10s}  spd={drive_spd}")
            else:
                print(f"  Unknown key: {repr(key)}")

        # --- ARM mode ---
        else:
            if key == '0':
                arm_center()
                print("  CENTER ALL")
            elif key in ARM_KEYS:
                joint, direction = ARM_KEYS[key]
                new_pos = arm_move(joint, direction, arm_step)
                print(f"  {joint:10s} → {new_pos}")
            else:
                print(f"  Unknown key: {repr(key)}")

finally:
    wheels_stop()
    portHandler.closePort()
    print("\nStopped. Bye.")
