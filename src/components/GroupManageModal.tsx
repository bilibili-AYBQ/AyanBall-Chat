import { useState } from "react";
import Modal from "./Modal";
import AvatarImg from "./Avatar";
import { client } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { useFriendStore } from "../stores/friendStore";
import { useToastStore } from "../stores/toastStore";
import { useT } from "../stores/settingsStore";
import type { Group } from "../types";

type Role = "owner" | "admin" | "member" | "none";

function roleOf(g: Group, id: string): Role {
  if (g.ownerId === id) return "owner";
  if ((g.adminIds || []).includes(id)) return "admin";
  if (g.members.some((m) => m.id === id)) return "member";
  return "none";
}

/** 群管理：成员列表 / 设管理员 / 踢人 / 邀请 / 解散 / 转让 / 退出 */
export default function GroupManageModal({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const t = useT();
  const me = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const [inviteName, setInviteName] = useState("");
  const [busy, setBusy] = useState(false);
  // 内联确认：{ kind: 'kick'|'dissolve'|'transfer', target?: member }
  const [confirm, setConfirm] = useState<{
    kind: "kick" | "dissolve" | "transfer";
    target?: { id: string; name: string };
  } | null>(null);

  const myRole: Role = me ? roleOf(group, me.id) : "none";
  const canManage = myRole === "owner" || myRole === "admin";

  const doAction = async (fn: () => Promise<any>, okKey: string, errKey: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      push(t("group.title"), t(okKey), "success");
      if (okKey === "group.dissolveOk") onClose();
    } catch (e: any) {
      const msg = e?.message ?? "";
      const key =
        msg === "group-full" || msg === "group-full"
          ? "group.full"
          : msg === "already-in-group"
            ? "group.alreadyIn"
            : msg === "not-found"
              ? "group.notFound"
              : msg === "owner-only"
                ? "group.ownerOnly"
                : msg === "forbidden" || msg === "cannot-kick-admin" || msg === "cannot-modify-owner"
                  ? "group.forbidden"
                  : msg === "cannot-kick-self" || msg === "cannot-transfer-self"
                    ? "group.cannotSelf"
                    : errKey;
      push(t("group.title"), t(key), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(group.code).catch(() => {});
    push(t("group.title"), `${t("contact.code")}: ${group.code}`, "success");
  };

  return (
    <Modal open onClose={onClose} title={`${t("group.title")} · ${group.name}`} width={480}>
      {/* 邀请码 */}
      <div className="mb-4 flex items-center justify-between rounded-xl bd bg-soft px-4 py-3">
        <div>
          <div className="text-[11px] text-3">{t("contact.code")}</div>
          <div className="font-mono text-sm font-bold tracking-[0.2em] text-1">{group.code}</div>
        </div>
        <button className="rounded-lg bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/25" onClick={copyCode}>
          {t("contact.copyCode")}
        </button>
      </div>

      {/* 邀请成员（群主/管理员） */}
      {canManage && (
        <div className="mb-4 flex gap-2">
          <input
            className="input-dark flex-1 text-xs"
            placeholder={t("group.invitePh")}
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inviteName.trim()) {
                void doAction(
                  () => client.inviteToGroup(group.id, inviteName.trim()),
                  "group.inviteOk",
                  "toast.error",
                ).then(() => setInviteName(""));
              }
            }}
          />
          <button
            className="btn-accent py-2! px-4 text-xs"
            disabled={!inviteName.trim() || busy}
            onClick={() => {
              void doAction(
                () => client.inviteToGroup(group.id, inviteName.trim()),
                "group.inviteOk",
                "toast.error",
              ).then(() => setInviteName(""));
            }}
          >
            {t("group.invite")}
          </button>
        </div>
      )}

      {/* 成员列表 */}
      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-3">
        {t("group.members")} · {group.memberCount}/100
      </div>
      <div className="flex max-h-[300px] flex-col gap-1 overflow-y-auto">
        {group.members.length === 0 && (
          <div className="py-10 text-center text-xs muted">{t("group.empty")}</div>
        )}
        {group.members.map((m) => {
          const r = roleOf(group, m.id);
          const isMe = me?.id === m.id;
          const label =
            r === "owner"
              ? `👑 ${t("group.owner")}`
              : r === "admin"
                ? `⚙ ${t("group.admin")}`
                : "";
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2 transition hv"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                <AvatarImg value={m.avatar} size={36} className="rounded-lg!" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-1">
                  <span className="truncate">{m.nickname || m.username}</span>
                  {isMe && (
                    <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] text-blue-400">
                      {t("group.you")}
                    </span>
                  )}
                  {label && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        r === "owner"
                          ? "bg-amber-400/15 text-amber-400"
                          : "bg-violet-500/15 text-violet-400"
                      }`}
                    >
                      {label}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-3">@{m.username}</div>
              </div>

              {/* 操作按钮 */}
              {me && !isMe && canManage && (
                <div className="flex shrink-0 gap-1">
                  {r !== "owner" &&
                    (myRole === "owner" || r === "member") && (
                      <button
                        className={`rounded-lg px-2 py-1 text-[11px] transition ${
                          r === "admin"
                            ? "bg-soft2 text-2 hover:text-1"
                            : "bg-violet-500/15 text-violet-400 hover:bg-violet-500/25"
                        }`}
                        onClick={() =>
                          void doAction(
                            () => client.setGroupAdmin(group.id, m.id, r !== "admin"),
                            "group.adminOk",
                            "group.forbidden",
                          )
                        }
                      >
                        {r === "admin" ? t("group.removeAdmin") : t("group.setAdmin")}
                      </button>
                    )}
                  {r !== "owner" && (myRole === "owner" || r === "member") && (
                    <button
                      className="rounded-lg bg-red-500/10 px-2 py-1 text-[11px] text-red-300 transition hover:bg-red-500/20"
                      onClick={() => setConfirm({ kind: "kick", target: { id: m.id, name: m.nickname || m.username } })}
                    >
                      {t("group.kick")}
                    </button>
                  )}
                  {myRole === "owner" && r !== "owner" && (
                    <button
                      className="rounded-lg bg-amber-400/12 px-2 py-1 text-[11px] text-amber-300 transition hover:bg-amber-400/22"
                      onClick={() => setConfirm({ kind: "transfer", target: { id: m.id, name: m.nickname || m.username } })}
                    >
                      {t("group.transfer")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部：解散 / 退出 */}
      <div className="mt-4 border-t bd pt-4">
        {myRole === "owner" ? (
          <button
            className="w-full rounded-xl bg-red-500/12 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/22"
            onClick={() => setConfirm({ kind: "dissolve" })}
          >
            {t("group.dissolve")}
          </button>
        ) : (
          <button
            className="w-full rounded-xl bg-soft2 py-2.5 text-sm font-medium text-2 transition hv2"
            onClick={() =>
              void doAction(() => client.leaveGroup(group.id), "contact.leaveOk", "toast.error").then(() =>
                onClose(),
              )
            }
          >
            {t("contact.leaveGroup")}
          </button>
        )}
        {myRole === "owner" && (
          <p className="mt-2 text-center text-[11px] text-3">{t("group.memberHint")}</p>
        )}
      </div>

      {/* 内联确认 */}
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm anim-fade">
          <div className="anim-pop w-[340px] rounded-2xl bd bg-overlay p-6 sh">
            <h4 className="mb-2 text-sm font-semibold text-1">
              {confirm.kind === "kick"
                ? t("group.kickConfirm", { name: confirm.target?.name ?? "" })
                : confirm.kind === "transfer"
                  ? t("group.transferConfirm", { name: confirm.target?.name ?? "" })
                  : t("group.dissolveConfirm")}
            </h4>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg bg-soft2 px-4 py-2 text-xs font-medium text-2 hv2" onClick={() => setConfirm(null)}>
                {t("call.decline")}
              </button>
              <button
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
                disabled={busy}
                onClick={() => {
                  if (confirm.kind === "kick" && confirm.target) {
                    void doAction(
                      () => client.kickGroupMember(group.id, confirm.target!.id),
                      "group.kickSuccess",
                      "group.forbidden",
                    );
                  } else if (confirm.kind === "transfer" && confirm.target) {
                    void doAction(
                      () => client.transferGroup(group.id, confirm.target!.id),
                      "group.transferOk",
                      "group.forbidden",
                    );
                  } else if (confirm.kind === "dissolve") {
                    void doAction(() => client.dissolveGroup(group.id), "group.dissolveOk", "group.ownerOnly");
                  }
                }}
              >
                {t("call.accept")}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
