import { create } from "zustand";
import type { CallKind, CallPhase } from "../types";

interface CallState {
  phase: CallPhase;
  kind: CallKind;
  peerId: string;
  peerName: string;
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incoming: boolean;
  start: (kind: CallKind, peerId: string, peerName: string) => void;
  setIncoming: (kind: CallKind, peerId: string, peerName: string) => void;
  accept: () => void;
  setActive: () => void;
  setStreams: (local: MediaStream | null, remote: MediaStream | null) => void;
  toggleMic: () => void;
  toggleCam: () => void;
  setScreen: (on: boolean) => void;
  end: (why?: string) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  phase: "none",
  kind: "voice",
  peerId: "",
  peerName: "",
  micOn: true,
  camOn: false,
  screenOn: false,
  localStream: null,
  remoteStream: null,
  incoming: false,

  start: (kind, peerId, peerName) =>
    set({
      phase: "outgoing",
      kind,
      peerId,
      peerName,
      incoming: false,
      micOn: true,
      camOn: kind === "video",
      screenOn: false,
    }),

  setIncoming: (kind, peerId, peerName) =>
    set({ phase: "incoming", kind, peerId, peerName, incoming: true }),

  accept: () => set({ phase: "connecting", incoming: false }),
  setActive: () => set({ phase: "active" }),

  setStreams: (local, remote) => set({ localStream: local, remoteStream: remote }),

  toggleMic: () => set({ micOn: !get().micOn }),
  toggleCam: () => set({ camOn: !get().camOn }),
  setScreen: (on) => set({ screenOn: on }),

  end: (why) => {
    const { localStream, remoteStream } = get();
    localStream?.getTracks().forEach((tr) => tr.stop());
    remoteStream?.getTracks().forEach((tr) => tr.stop());
    set({
      phase: why ? "ended" : "none",
      kind: "voice",
      peerId: "",
      peerName: "",
      localStream: null,
      remoteStream: null,
      incoming: false,
      micOn: true,
      camOn: false,
      screenOn: false,
    });
  },
}));
