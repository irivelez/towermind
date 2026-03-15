#!/usr/bin/env python3
"""
Scan all servo IDs on Waveshare Bus Servo Adapter (ttyACM0).
Tries multiple baud rates and both Feetech STS and LewanSoul LX protocols.
"""
import serial
import time

PORT = '/dev/ttyACM0'
BAUDS = [1_000_000, 115200, 500000, 250000, 57600]

def ping_feetech(ser, servo_id):
    """Feetech STS/SMS protocol PING."""
    checksum = (~(servo_id + 0x02 + 0x01)) & 0xFF
    packet = bytes([0xFF, 0xFF, servo_id, 0x02, 0x01, checksum])
    ser.reset_input_buffer()
    ser.write(packet)
    time.sleep(0.008)
    resp = ser.read(6)
    return len(resp) >= 6 and resp[0] == 0xFF and resp[1] == 0xFF and resp[2] == servo_id

found_any = False
for baud in BAUDS:
    print(f"\n--- Trying {baud} baud ---")
    try:
        with serial.Serial(PORT, baud, timeout=0.02) as ser:
            found = []
            for sid in range(1, 20):
                if ping_feetech(ser, sid):
                    print(f"  ✓ Found servo ID {sid} at {baud} baud!")
                    found.append(sid)
                    found_any = True
            if found:
                print(f"  → Servo IDs: {found}")
            else:
                print(f"  No servos found at {baud} baud")
    except Exception as e:
        print(f"  Error: {e}")

if not found_any:
    print("\n=== No servos found at any baud rate ===")
    print("Check:")
    print("  1. Servos powered? (separate power supply needed)")
    print("  2. Signal cable connected to adapter?")
    print("  3. Is the adapter the Bus Servo Adapter (A) or (B)?")
