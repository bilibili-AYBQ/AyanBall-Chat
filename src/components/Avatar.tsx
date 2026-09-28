// ================= 头像组件 =================
// 支持：预设矢量头像（p1~p12）或自定义图片（dataURL）
// 用法：<Avatar value={user.avatar} size={40} />

const PRESETS: Record<string, { bg: string; body: React.ReactNode }> = {
  p1: {
    bg: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    body: <><circle cx="50" cy="40" r="16" fill="rgba(255,255,255,.92)" /><ellipse cx="50" cy="72" rx="24" ry="17" fill="rgba(255,255,255,.92)" /></>,
  },
  p2: {
    bg: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    body: <><path d="M50 18l7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2z" fill="rgba(255,255,255,.95)" /></>,
  },
  p3: {
    bg: "linear-gradient(135deg,#22c55e,#15803d)",
    body: <><path d="M50 18c12 10 20 20 18 34-2 16-16 22-18 22s-16-6-18-22c-2-14 6-24 18-34z" fill="rgba(255,255,255,.95)" /><path d="M40 44c-8 6-8 14 0 18" stroke="rgba(255,255,255,.6)" strokeWidth="3" fill="none" strokeLinecap="round" /></>,
  },
  p4: {
    bg: "linear-gradient(135deg,#f97316,#c2410c)",
    body: <><circle cx="50" cy="50" r="20" fill="rgba(255,255,255,.95)" /><g stroke="rgba(255,255,255,.85)" strokeWidth="5" strokeLinecap="round"><path d="M50 16v8M50 76v8M16 50h8M76 50h8M27 27l5 5M68 68l5 5M73 27l-5 5M32 68l-5 5" /></g></>,
  },
  p5: {
    bg: "linear-gradient(135deg,#ec4899,#be185d)",
    body: <><path d="M50 76C38 66 24 56 24 42c0-10 8-18 18-18 5 0 8 2 8 2s3-2 8-2c10 0 18 8 18 18 0 14-14 24-26 34z" fill="rgba(255,255,255,.95)" /></>,
  },
  p6: {
    bg: "linear-gradient(135deg,#06b6d4,#0e7490)",
    body: <><path d="M16 55c8-8 16-8 24 0s16 8 24 0 12-6 20-4v26H16z" fill="rgba(255,255,255,.95)" /><path d="M16 30c8-8 16-8 24 0s16 8 24 0" stroke="rgba(255,255,255,.7)" strokeWidth="4" fill="none" strokeLinecap="round" /></>,
  },
  p7: {
    bg: "linear-gradient(135deg,#ef4444,#b91c1c)",
    body: <><path d="M50 82C34 70 22 58 22 44c0-12 9-20 19-20 6 0 9 3 9 3s3-3 9-3c10 0 19 8 19 20 0 14-12 26-28 38z" fill="rgba(255,255,255,.95)" /><path d="M50 40c-7 8-7 16 0 22" stroke="rgba(239,68,68,.8)" strokeWidth="3" fill="none" strokeLinecap="round" /></>,
  },
  p8: {
    bg: "linear-gradient(135deg,#6366f1,#4338ca)",
    body: <><path d="M66 20c10 8 16 19 16 31 0 15-11 27-26 27S30 66 30 51c0-6 1-11 4-16 3 10 10 18 20 20-1-13 2-27 12-35z" fill="rgba(255,255,255,.95)" /></>,
  },
  p9: {
    bg: "linear-gradient(135deg,#eab308,#a16207)",
    body: <><path d="M22 38h56l-8 40H30z" fill="rgba(255,255,255,.95)" /><circle cx="50" cy="22" r="10" fill="rgba(255,255,255,.95)" /><circle cx="50" cy="16" r="6" fill="#fbbf24" /><circle cx="38" cy="56" r="5" fill="#fbbf24" /><circle cx="62" cy="56" r="5" fill="#fbbf24" /></>,
  },
  p10: {
    bg: "linear-gradient(135deg,#64748b,#334155)",
    body: <><path d="M16 70l18-26 12 14 12-20 26 32z" fill="rgba(255,255,255,.95)" /><circle cx="70" cy="30" r="8" fill="rgba(255,255,255,.7)" /></>,
  },
  p11: {
    bg: "linear-gradient(135deg,#d946ef,#a21caf)",
    body: <><circle cx="36" cy="62" r="9" fill="rgba(255,255,255,.95)" /><circle cx="62" cy="52" r="9" fill="rgba(255,255,255,.95)" /><path d="M45 62V26c14-3 22 2 26 12l-6 2c-3-6-9-6-14-4v18z" fill="rgba(255,255,255,.95)" /></>,
  },
  p12: {
    bg: "linear-gradient(135deg,#0ea5e9,#0369a1)",
    body: <><ellipse cx="34" cy="58" rx="18" ry="10" fill="rgba(255,255,255,.95)" /><ellipse cx="58" cy="50" rx="20" ry="11" fill="rgba(255,255,255,.85)" /><ellipse cx="74" cy="60" rx="14" ry="8" fill="rgba(255,255,255,.7)" /></>,
  },
};

export const AVATAR_IDS = Object.keys(PRESETS);

export function isPresetAvatar(v?: string) {
  return !!v && /^p\d+$/.test(v) && !!PRESETS[v];
}

export default function Avatar({
  value,
  size = 40,
  className = "",
}: {
  value?: string;
  size?: number;
  className?: string;
}) {
  if (value && value.startsWith("data:")) {
    return (
      <img
        src={value}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className={`shrink-0 select-none rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const preset = PRESETS[value || "p1"] || PRESETS.p1;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 select-none rounded-full ${className}`}
      style={{ background: preset.bg, width: size, height: size }}
    >
      {preset.body}
    </svg>
  );
}
