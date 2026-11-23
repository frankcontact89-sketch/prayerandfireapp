/** Ship candidates gathered so far with the SDP. Later candidates still use trickle ICE. */
export async function localAudioDescription(
  peer: RTCPeerConnection,
  description: RTCSessionDescriptionInit,
  gatherTimeout = 2500,
): Promise<RTCSessionDescriptionInit> {
  await peer.setLocalDescription(description);
  if (peer.iceGatheringState !== "complete") {
    await new Promise<void>(resolve => {
      const finish = () => {
        clearTimeout(timer);
        peer.removeEventListener("icegatheringstatechange", check);
        resolve();
      };
      const check = () => {
        if (peer.iceGatheringState === "complete" || peer.signalingState === "closed") finish();
      };
      const timer = setTimeout(finish, gatherTimeout);
      peer.addEventListener("icegatheringstatechange", check);
      check();
    });
  }
  const local = peer.localDescription;
  if (!local || peer.signalingState === "closed") throw new Error("Local audio description unavailable");
  return { type: local.type, sdp: local.sdp };
}

export async function audioTransportStats(peer: RTCPeerConnection) {
  const stats = await peer.getStats();
  let inboundPackets = 0;
  let outboundPackets = 0;
  let audioEnergy = 0;
  let dtlsState: string | undefined;
  let selectedPair: { local?: string; remote?: string; protocol?: string } | undefined;
  const candidateTypes = { local: new Set<string>(), remote: new Set<string>() };
  for (const entry of stats.values()) {
    if (entry.type === "local-candidate" && entry.candidateType) candidateTypes.local.add(entry.candidateType);
    if (entry.type === "remote-candidate" && entry.candidateType) candidateTypes.remote.add(entry.candidateType);
    if (entry.type === "transport") {
      dtlsState = entry.dtlsState ?? dtlsState;
      const pair = stats.get(entry.selectedCandidatePairId);
      if (pair) {
        const local = stats.get(pair.localCandidateId);
        selectedPair = {
          local: local?.candidateType,
          remote: stats.get(pair.remoteCandidateId)?.candidateType,
          protocol: local?.relayProtocol ?? local?.protocol,
        };
      }
    }
    if ((entry.kind ?? entry.mediaType) !== "audio") continue;
    if (entry.type === "inbound-rtp") {
      inboundPackets += entry.packetsReceived ?? 0;
      audioEnergy += entry.totalAudioEnergy ?? 0;
    }
    if (entry.type === "outbound-rtp") outboundPackets += entry.packetsSent ?? 0;
  }
  return {
    ice: peer.iceConnectionState, gathering: peer.iceGatheringState, signaling: peer.signalingState,
    dtlsState, selectedPair, inboundPackets, outboundPackets, audioEnergy,
    localCandidateTypes: [...candidateTypes.local], remoteCandidateTypes: [...candidateTypes.remote],
  };
}

export type PrayerIceCredentials = { iceServers?: RTCIceServer[]; expiresAt?: number | string };

export function iceExpiryMs(expiresAt: PrayerIceCredentials["expiresAt"]): number {
  if (typeof expiresAt === "number") return expiresAt * 1000;
  return typeof expiresAt === "string" ? Date.parse(expiresAt) : NaN;
}

export function usableTurnServers(response: PrayerIceCredentials | null | undefined) {
  if (!Array.isArray(response?.iceServers)) return [];
  if (response.expiresAt !== undefined && !(iceExpiryMs(response.expiresAt) > Date.now() + 60_000)) return [];
  return response.iceServers.flatMap(server => {
    if (!server || !server.username || typeof server.credential !== "string" || !server.credential) return [];
    const urls = [server.urls].flat().filter(url => typeof url === "string" && /^turns?:[^\s]+$/i.test(url));
    return urls.length ? [{ ...server, urls }] : [];
  });
}
