"""
WebRTC Signaling Server for Telehealth

Provides:
  - WebSocket at /ws/signaling/{client_id}/{role}
  - Manages online doctors list
  - Relays WebRTC offer/answer/ice-candidate between patient <-> doctor
  - REST endpoint GET /api/telehealth/doctors to list online doctors
"""

import json
import logging
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("signaling")
logging.basicConfig(level=logging.INFO)

router = APIRouter(tags=["Telehealth"])

# ── In-Memory State ─────────────────────────────────────────────
connected_clients: Dict[str, WebSocket] = {}
client_info: Dict[str, dict] = {}
online_doctors: Set[str] = set()
active_sessions: Dict[str, str] = {}


@router.get("/api/telehealth/doctors")
async def list_online_doctors():
    """Return list of online doctors available for telehealth."""
    doctors = []
    for doc_id in online_doctors:
        info = client_info.get(doc_id, {})
        doctors.append({
            "id": doc_id,
            "name": info.get("name", f"Dr. {doc_id[:6]}"),
            "status": "available" if doc_id not in active_sessions.values() else "in_session",
        })
    return {"doctors": doctors}


@router.websocket("/ws/signaling/{client_id}/{role}")
async def signaling_ws(websocket: WebSocket, client_id: str, role: str):
    await websocket.accept()
    connected_clients[client_id] = websocket
    client_info[client_id] = {"name": f"User-{client_id[:6]}", "role": role}
    logger.info(f"[CONNECT] {role} {client_id} connected. Total: {len(connected_clients)}")

    if role == "doctor":
        online_doctors.add(client_id)
        await _broadcast_doctor_list()

    try:
        await websocket.send_json({
            "type": "connected",
            "client_id": client_id,
            "role": role,
        })

        # Send current doctor list to newly connected patient immediately
        if role == "patient":
            doctors = []
            for doc_id in online_doctors:
                info = client_info.get(doc_id, {})
                doctors.append({
                    "id": doc_id,
                    "name": info.get("name", f"Dr. {doc_id[:6]}"),
                    "status": "available" if doc_id not in active_sessions.values() else "in_session",
                })
            await websocket.send_json({"type": "doctors_update", "doctors": doctors})
            logger.info(f"[INIT] Sent {len(doctors)} doctors to new patient {client_id}")

        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type")
            logger.info(f"[MSG] from {client_id} ({role}): {msg_type}")

            if msg_type == "register":
                client_info[client_id]["name"] = msg.get("name", client_info[client_id]["name"])
                logger.info(f"[REGISTER] {client_id} as '{client_info[client_id]['name']}'")
                if role == "doctor":
                    await _broadcast_doctor_list()

            elif msg_type == "call_doctor":
                doctor_id = msg.get("doctor_id")
                logger.info(f"[CALL] Patient {client_id} -> Doctor {doctor_id}")
                if doctor_id in connected_clients and doctor_id in online_doctors:
                    active_sessions[client_id] = doctor_id
                    await connected_clients[doctor_id].send_json({
                        "type": "incoming_call",
                        "caller_id": client_id,
                        "caller_name": client_info[client_id]["name"],
                    })
                    logger.info(f"[CALL] incoming_call sent to {doctor_id}")
                    await _broadcast_doctor_list()
                else:
                    logger.warning(f"[CALL] Doctor {doctor_id} NOT available")
                    await websocket.send_json({"type": "error", "message": "Doctor is not available"})

            elif msg_type == "accept_call":
                caller_id = msg.get("caller_id")
                logger.info(f"[ACCEPT] Doctor {client_id} accepts patient {caller_id}")
                if caller_id in connected_clients:
                    active_sessions[caller_id] = client_id
                    await connected_clients[caller_id].send_json({
                        "type": "call_accepted",
                        "doctor_id": client_id,
                        "doctor_name": client_info[client_id]["name"],
                    })
                    logger.info(f"[ACCEPT] call_accepted sent to {caller_id}")
                    await _broadcast_doctor_list()
                else:
                    logger.warning(f"[ACCEPT] Patient {caller_id} not connected!")

            elif msg_type == "reject_call":
                caller_id = msg.get("caller_id")
                logger.info(f"[REJECT] Doctor {client_id} rejects {caller_id}")
                if caller_id in connected_clients:
                    if caller_id in active_sessions:
                        del active_sessions[caller_id]
                    await connected_clients[caller_id].send_json({
                        "type": "call_rejected", "doctor_id": client_id,
                    })
                    await _broadcast_doctor_list()

            elif msg_type in ("offer", "answer", "ice-candidate"):
                target_id = msg.get("target_id")
                logger.info(f"[RELAY] {msg_type}: {client_id} -> {target_id}")
                if target_id in connected_clients:
                    relay = {**msg, "from_id": client_id}
                    await connected_clients[target_id].send_json(relay)
                    logger.info(f"[RELAY] {msg_type} delivered to {target_id}")
                else:
                    logger.warning(f"[RELAY] Target {target_id} NOT connected!")

            elif msg_type == "hang_up":
                target_id = msg.get("target_id")
                logger.info(f"[HANGUP] {client_id} -> {target_id}")
                if client_id in active_sessions:
                    del active_sessions[client_id]
                if target_id and target_id in active_sessions:
                    del active_sessions[target_id]
                if target_id and target_id in connected_clients:
                    await connected_clients[target_id].send_json({
                        "type": "hang_up", "from_id": client_id,
                    })
                await _broadcast_doctor_list()

            elif msg_type == "privacy_mode":
                target_id = msg.get("target_id")
                if target_id in connected_clients:
                    await connected_clients[target_id].send_json({
                        "type": "privacy_mode",
                        "enabled": msg.get("enabled", False),
                        "from_id": client_id,
                    })

    except WebSocketDisconnect:
        logger.info(f"[DISCONNECT] {role} {client_id}")
    except Exception as e:
        logger.error(f"[ERROR] {role} {client_id}: {e}")
    finally:
        connected_clients.pop(client_id, None)
        client_info.pop(client_id, None)
        online_doctors.discard(client_id)
        to_remove = [k for k, v in active_sessions.items() if k == client_id or v == client_id]
        for k in to_remove:
            partner = active_sessions.pop(k)
            other = partner if partner != client_id else k
            if other in connected_clients:
                try:
                    await connected_clients[other].send_json({
                        "type": "peer_disconnected", "peer_id": client_id,
                    })
                except Exception:
                    pass
        await _broadcast_doctor_list()
        logger.info(f"[CLEANUP] {role} {client_id} done. Remaining: {len(connected_clients)}")


async def _broadcast_doctor_list():
    """Send the updated doctor list to all connected patients."""
    doctors = []
    for doc_id in online_doctors:
        info = client_info.get(doc_id, {})
        doctors.append({
            "id": doc_id,
            "name": info.get("name", f"Dr. {doc_id[:6]}"),
            "status": "available" if doc_id not in active_sessions.values() else "in_session",
        })
    msg = json.dumps({"type": "doctors_update", "doctors": doctors})
    logger.info(f"[BROADCAST] {len(doctors)} doctors to patients")
    for cid, ws in list(connected_clients.items()):
        info = client_info.get(cid, {})
        if info.get("role") == "patient":
            try:
                await ws.send_text(msg)
            except Exception:
                pass
