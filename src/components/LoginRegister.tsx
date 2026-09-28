import { useEffect, useState } from "react";
import appIcon from "../assets/app-icon.png";
import Avatar, { AVATAR_IDS } from "./Avatar";
import { client } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { useT } from "../stores/settingsStore";

export default function LoginRegister() {
  const t = useT();
  const login = useAuthStore((s) => s.login);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("p1");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.connect();
  }, []);

  const submit = async () => {
    if (!username.trim() || !password) {
      setError(t("login.fillAll"));
      return;
    }
    if (mode === "register") {
      if (password !== confirm) {
        setError(t("login.passMismatch"));
        return;
      }
      if (username.trim().length < 2 || password.length < 6) {
        setError(t("login.tooShort"));
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const res =
        mode === "register"
          ? await client.register(username.trim(), password, nickname.trim() || undefined, avatar)
          : await client.login(username.trim(), password);
      login(res.token, res.user);
      // 主动拉取完整会话数据
      client
        .request("auth", { token: res.token })
        .then((s) => client.hydrate(s))
        .catch(() => {});
    } catch (e: any) {
      const msg = e?.message ?? "";
      if (msg.includes("taken")) setError(t("login.usernameTaken"));
      else if (msg.includes("credential")) setError(t("login.wrongCreds"));
      else setError(t("login.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-bg flex h-full items-center justify-center">
      <div className="anim-pop w-[400px] rounded-2xl bd bg-overlay p-8 sh backdrop-blur">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <img src={appIcon} alt="" className="h-16 w-16 rounded-2xl object-cover sh" draggable={false} />
          <h1 className="mt-4 text-xl font-bold tracking-wide text-1">{t("app.name")}</h1>
          <p className="mt-1 text-xs text-3">{t("login.sub")}</p>
        </div>

        {/* 模式切换 */}
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-black/25 p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === m ? "bg-blue-500 text-white shadow" : "text-2 hover:text-1"
              }`}
            >
              {m === "login" ? t("login.login") : t("login.register")}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <input
            className="input-dark"
            placeholder={t("login.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="input-dark"
            type="password"
            placeholder={t("login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {mode === "register" && (
            <>
              <input
                className="input-dark"
                type="password"
                placeholder={t("login.confirm")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <input
                className="input-dark"
                placeholder={t("login.nickname")}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              {/* 头像选择（QQ 风格：12 个矢量头像） */}
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-3">{t("login.avatar")}</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {AVATAR_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAvatar(id)}
                      className={`shrink-0 rounded-full transition ${
                        avatar === id
                          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Avatar value={id} size={38} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        )}

        <button
          className="btn-accent mt-5 w-full py-3 text-base"
          disabled={busy}
          onClick={submit}
        >
          {busy ? t("login.connecting") : mode === "login" ? t("login.login") : t("login.register")}
        </button>

        <button
          className="mt-4 w-full text-center text-xs text-3 transition hover:text-blue-400"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? t("login.noAccount") : t("login.hasAccount")}
        </button>
      </div>
    </div>
  );
}
