import Modal from "./Modal";
import { useT } from "../stores/settingsStore";
import type { CallKind } from "../types";

interface SafetyModalProps {
  open: boolean;
  kind: CallKind;
  onClose: () => void;
  onConfirm: () => void;
}

/** 发起语音/视频/屏幕共享前的强制安全知识提示（防诈骗） */
export default function SafetyModal({ open, kind, onClose, onConfirm }: SafetyModalProps) {
  const t = useT();

  const kindLabel =
    kind === "voice" ? t("call.voiceCall") : kind === "video" ? t("call.videoCall") : t("call.screenShare");

  return (
    <Modal open={open} onClose={onClose} title={`${kindLabel} · ${t("call.safetyTitle")}`} width={440}>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M12 8v4m0 3v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-bold text-amber-300">{t("call.safetyTitle")}</span>
        </div>
        <ul className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-2">
          <li>{t("call.safetyLine1")}</li>
          <li>{t("call.safetyLine2")}</li>
          <li>{t("call.safetyLine3")}</li>
          <li>{t("call.safetyLine4")}</li>
        </ul>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn-ghost flex-1" onClick={onClose}>
          {t("call.decline")}
        </button>
        <button className="btn-accent flex-1" onClick={onConfirm}>
          {t("call.understand")}
        </button>
      </div>
    </Modal>
  );
}
