// Run with Node 24 and werift@0.28.0 available on NODE_PATH.
// For relay-only coverage, set PRAYER_TEST_TURN_URL and PRAYER_TEST_TURN_SECRET
// to a local coturn fixture with TURN REST authentication enabled.
const assert = require("node:assert/strict");
const os = require("node:os");
// A restricted runner may deny interface enumeration while allowing loopback UDP.
try { os.networkInterfaces(); } catch (error) {
  if (error.info?.syscall !== "uv_interface_addresses") throw error;
  os.networkInterfaces = () => ({});
}
const { createHmac } = require("node:crypto");
const { setTimeout: sleep } = require("node:timers/promises");
const { RTCPeerConnection, MediaStreamTrack, RtpHeader, RtpPacket } = require("werift");
const { localAudioDescription, audioTransportStats, usableTurnServers } = require(
  "../src/components/community/prayerAudioTransport.ts",
);

const credentialsPath = process.env.PRAYER_TEST_ICE_FILE;
const managedIce = credentialsPath ? JSON.parse(require("node:fs").readFileSync(credentialsPath, "utf8")) : null;
const turnUrl = process.env.PRAYER_TEST_TURN_URL;
const relayOnly = Boolean(managedIce || turnUrl);
const turnSecret = process.env.PRAYER_TEST_TURN_SECRET;
assert.equal(Boolean(turnUrl), Boolean(turnSecret), "Set both TURN fixture variables");
const expiresAt = Math.floor(Date.now() / 1000) + 3600;

function client(name, frequency) {
  const username = `${expiresAt}:${name}`;
  const iceServers = managedIce ? usableTurnServers(managedIce[name]) : turnUrl ? usableTurnServers({
    expiresAt,
    iceServers: [{ urls: turnUrl, username, credential: createHmac("sha1", turnSecret).update(username).digest("base64") }],
  }) : [];
  const peer = new RTCPeerConnection({
    iceUseIpv6: false,
    ...(managedIce ? {} : {
      iceInterfaceAddresses: { udp4: "127.0.0.1" },
      iceAdditionalHostAddresses: ["127.0.0.1"],
    }),
    iceTransportPolicy: relayOnly ? "relay" : "all",
    iceServers,
  });
  const track = new MediaStreamTrack({ kind: "audio" });
  peer.addTrack(track);
  const received = new Set();
  peer.onTrack.subscribe(remote => remote.onReceiveRtp.subscribe(packet => received.add(packet.payload.toString("hex"))));

  // Both senders use PCMU at 8 kHz, but their tones have different frequencies.
  const tone = Buffer.from(Array.from({ length: 160 }, (_, index) => {
    const sample = Math.round(8000 * Math.sin(2 * Math.PI * frequency * index / 8000));
    const magnitude = Math.min(32635, Math.abs(sample)) + 132;
    const exponent = Math.max(0, Math.floor(Math.log2(magnitude)) - 7);
    const mantissa = (magnitude >> (exponent + 3)) & 15;
    return ~(Number(sample < 0) * 128 | exponent << 4 | mantissa) & 255;
  }));
  return { peer, track, tone, received };
}

async function run({ log = true } = {}) {
  const alice = client("alice", 400);
  const bob = client("bob", 600);
  try {
    if (managedIce) assert.ok(usableTurnServers(managedIce.alice).length && usableTurnServers(managedIce.bob).length, "Missing fresh relay credentials");
    const bareOffer = await alice.peer.createOffer();
    assert.doesNotMatch(bareOffer.sdp, /a=candidate:/);
    const offer = await localAudioDescription(alice.peer, bareOffer);
    assert.match(offer.sdp, /m=audio/);
    assert.match(offer.sdp, /a=fingerprint:/);
    assert.ok(/a=candidate:/.test(offer.sdp), "Missing offer ICE candidates");
    await bob.peer.setRemoteDescription(offer);
    const answer = await localAudioDescription(bob.peer, await bob.peer.createAnswer());
    assert.ok(/a=candidate:/.test(answer.sdp), "Missing answer ICE candidates");
    await alice.peer.setRemoteDescription(answer);

    // Deliberately transmit only SDP to reproduce dropped trickle messages.
    for (let i = 0; i < 150; i++) {
      if (alice.peer.connectionState === "connected" && bob.peer.connectionState === "connected") break;
      await sleep(100);
    }
    assert.equal(alice.peer.connectionState, "connected");
    assert.equal(bob.peer.connectionState, "connected");

    for (let index = 0; index < 64; index++) {
      for (const sender of [alice, bob]) {
        sender.track.writeRtp(new RtpPacket(new RtpHeader({
          payloadType: 0, sequenceNumber: index, timestamp: index * 160,
        }), sender.tone));
      }
      await sleep(20);
    }
    for (const [receiver, sender] of [[alice, bob], [bob, alice]]) {
      const stats = await audioTransportStats(receiver.peer);
      assert.ok(receiver.received.has(sender.tone.toString("hex")), "Received the other client's synthetic tone");
      assert.ok(stats.inboundPackets > 10 && stats.outboundPackets > 10, JSON.stringify(stats));
      assert.equal(stats.dtlsState, "connected");
      assert.equal(stats.selectedPair?.local, relayOnly ? "relay" : "host");
      assert.equal(stats.selectedPair?.remote, relayOnly ? "relay" : "host");
      if (log) console.log(JSON.stringify(stats));
    }
  } finally {
    await Promise.all([alice.peer.close(), bob.peer.close()]);
  }
}
async function main() {
  const links = Number(process.env.PRAYER_TEST_CONCURRENT_LINKS || 1);
  assert.ok(Number.isInteger(links) && links >= 1 && links <= 99, "Expected 1–99 concurrent links");
  if (links === 1) { await run(); return; }
  assert.ok(!relayOnly, "Use the local transport for load tests");
  const started = performance.now();
  const results = await Promise.allSettled(Array.from({ length: links }, () => run({ log: false })));
  const failed = results.filter(result => result.status === "rejected");
  console.log(JSON.stringify({ links, passing: links - failed.length, failed: failed.length, durationMs: Math.round(performance.now() - started) }));
  if (failed.length) throw failed[0].reason;
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
