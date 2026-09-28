// ================= WebRTC 通话管理器（语音 / 视频 / 屏幕共享） =================
import { client } from "../api/client";
import { useCallStore } from "../stores/callStore";
import type { CallKind } from "../types";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

class WebrtcManager {
  private pc: RTCPeerConnection | null = null;
  private kind: CallKind = "voice";
  private peerId = "";
  private pendingOffer: RTCSessionDescriptionInit | null = null;
  private iceQueue: RTCIceCandidateInit[] = [];
  private remoteStream: MediaStream | null = null;
  private localStream: MediaStream | null = null;

  private makePC() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate && this.pc === pc) {
        client
          .request("call.ice", { to: this.peerId, candidate: e.candidate.toJSON() })
          .catch(() => {});
      }
    };
    pc.ontrack = (e) => {
      if (!this.remoteStream) this.remoteStream = new MediaStream();
      this.remoteStream.addTrack(e.track);
      useCallStore
        .getState()
        .setStreams(this.localStream, this.remoteStream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        this.hangup("ended");
      }
    };
    return pc;
  }

  private async acquireMedia(kind: CallKind): Promise<MediaStream | null> {
    if (kind === "screen") {
      // 屏幕共享：先提示安全知识（由 UI 层弹窗），这里直接捕获屏幕
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      // 用户点“停止共享”时自动结束共享状态
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        useCallStore.getState().setScreen(false);
      });
      return stream;
    }
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: kind === "video",
    });
  }

  /** 主叫：发起通话 */
  async startCall(kind: CallKind, peerId: string, peerName: string) {
    this.kind = kind;
    this.peerId = peerId;
    this.remoteStream = null;
    try {
      const local = await this.acquireMedia(kind);
      if (!local) throw new Error("no-media");
      this.localStream = local;
      this.pc = this.makePC();
      local.getTracks().forEach((tr) => this.pc!.addTrack(tr, local));
      useCallStore.getState().setStreams(local, null);

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      const res = await client.request("call.offer", {
        to: peerId,
        kind,
        sdp: this.pc.localDescription,
      });
      if (res && res.error) {
        this.cleanup();
        useCallStore.getState().end();
        return;
      }
    } catch (e: any) {
      this.cleanup();
      useCallStore.getState().end();
      if (e?.name === "NotAllowedError" || e?.name === "NotFoundError") {
        // 权限被拒绝
      }
    }
  }

  /** 被叫：接收来电 */
  async acceptCall() {
    if (!this.pendingOffer) return;
    const kind = this.kind;
    try {
      const local = await this.acquireMedia(kind);
      if (!local) throw new Error("no-media");
      this.localStream = local;
      this.pc = this.makePC();
      local.getTracks().forEach((tr) => this.pc!.addTrack(tr, local));
      useCallStore.getState().setStreams(local, null);
      await this.pc.setRemoteDescription(this.pendingOffer);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      await client.request("call.answer", {
        to: this.peerId,
        sdp: this.pc.localDescription,
      });
      this.drainIceQueue();
      useCallStore.getState().setActive();
    } catch {
      this.hangup("ended");
    }
  }

  /** 被叫：挂起 offer 等待用户决定 */
  onInvite(from: string, kind: CallKind, sdp: RTCSessionDescriptionInit) {
    this.peerId = from;
    this.kind = kind;
    this.pendingOffer = sdp;
    this.iceQueue = [];
    this.remoteStream = null;
  }

  /** 主叫：收到 answer */
  async onAnswer(sdp: RTCSessionDescriptionInit) {
    if (!this.pc) return;
    try {
      await this.pc.setRemoteDescription(sdp);
      this.drainIceQueue();
      useCallStore.getState().setActive();
    } catch {
      /* ignore */
    }
  }

  async onIce(candidate: RTCIceCandidateInit) {
    if (!this.pc || !this.pc.remoteDescription) {
      this.iceQueue.push(candidate);
      return;
    }
    try {
      await this.pc.addIceCandidate(candidate);
    } catch {
      /* ignore */
    }
  }

  private drainIceQueue() {
    if (!this.pc) return;
    for (const c of this.iceQueue.splice(0)) {
      this.pc.addIceCandidate(c).catch(() => {});
    }
  }

  /** 通话中追加屏幕共享轨道 */
  async addScreenTrack() {
    if (!this.pc) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        useCallStore.getState().setScreen(false);
      });
      stream.getTracks().forEach((tr) => this.pc!.addTrack(tr, stream));
      useCallStore.getState().setScreen(true);
    } catch {
      /* 用户取消 */
    }
  }

  async hangup(reason: "ended" | "rejected" | "busy" | "declined" = "ended") {
    if (this.pc) {
      try {
        await client.request("call.hangup", { to: this.peerId, reason });
      } catch {
        /* ignore */
      }
    }
    this.cleanup();
    useCallStore.getState().end(reason);
  }

  /** 对方挂断时本地清理 */
  remoteHangup(reason: string) {
    this.cleanup();
    useCallStore.getState().end(reason === "rejected" ? "rejected" : "ended");
  }

  private cleanup() {
    try {
      this.pc?.close();
    } catch {
      /* ignore */
    }
    this.pc = null;
    this.pendingOffer = null;
    this.iceQueue = [];
    this.localStream?.getTracks().forEach((tr) => tr.stop());
    this.localStream = null;
    this.remoteStream = null;
  }
}

export const webrtc = new WebrtcManager();
