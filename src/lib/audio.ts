import notifyMp3 from "../assets/notify.mp3";
import { useSettingsStore } from "../stores/settingsStore";

let audioEl: HTMLAudioElement | null = null;

/** 播放新消息提醒音（读取设置开关） */
export function playNotify() {
  if (!useSettingsStore.getState().soundEnabled) return;
  try {
    if (!audioEl) audioEl = new Audio(notifyMp3);
    audioEl.currentTime = 0;
    audioEl.volume = 0.85;
    audioEl.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
