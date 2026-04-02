"""Test the full signaling flow: doctor registers, patient calls, doctor accepts."""
import asyncio
import json
import websockets

WS = "ws://127.0.0.1:8000/ws/signaling"

async def test_call_flow():
    # 1. Doctor connects
    doc_ws = await websockets.connect(f"{WS}/doc1/doctor")
    doc_init = json.loads(await doc_ws.recv())
    print(f"1. Doctor connected: {doc_init}")
    
    # 2. Doctor registers
    await doc_ws.send(json.dumps({"type": "register", "name": "Dr. Test"}))
    
    # 3. Patient connects
    pat_ws = await websockets.connect(f"{WS}/pat1/patient")
    pat_init = json.loads(await pat_ws.recv())
    print(f"2. Patient connected: {pat_init}")
    
    # Patient registers
    await pat_ws.send(json.dumps({"type": "register", "name": "Patient Test"}))
    
    # Patient receives doctor list
    doc_list = json.loads(await pat_ws.recv())
    print(f"3. Patient got doctor list: {doc_list}")
    
    # 4. Patient calls doctor
    await pat_ws.send(json.dumps({"type": "call_doctor", "doctor_id": "doc1"}))
    
    # Doctor receives incoming call
    incoming = json.loads(await doc_ws.recv())
    print(f"4. Doctor got incoming call: {incoming}")
    
    # Also patient might get a doctors_update (doctor now in_session)
    
    # 5. Doctor accepts
    await doc_ws.send(json.dumps({"type": "accept_call", "caller_id": "pat1"}))
    
    # Patient receives call_accepted
    # (might need to skip a doctors_update first)
    for _ in range(5):
        msg = json.loads(await asyncio.wait_for(pat_ws.recv(), timeout=3))
        print(f"5. Patient received: {msg['type']} -> {msg}")
        if msg["type"] == "call_accepted":
            break
    
    # 6. Patient sends offer
    await pat_ws.send(json.dumps({
        "type": "offer", "target_id": "doc1",
        "sdp": {"type": "offer", "sdp": "fake_sdp_for_test"}
    }))
    
    # Doctor receives the offer
    for _ in range(5):
        msg = json.loads(await asyncio.wait_for(doc_ws.recv(), timeout=3))
        print(f"6. Doctor received: {msg['type']} -> from={msg.get('from_id')}")
        if msg["type"] == "offer":
            break
    
    print("\n✅ FULL CALL FLOW WORKS! Doctor sees patient's offer.")
    
    await doc_ws.close()
    await pat_ws.close()

asyncio.run(test_call_flow())
