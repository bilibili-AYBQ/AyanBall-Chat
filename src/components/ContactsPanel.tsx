import { useState } from "react";
import Modal from "./Modal";
import GroupManageModal from "./GroupManageModal";
import AvatarImg from "./Avatar";
import { client } from "../api/client";
import { useFriendStore } from "../stores/friendStore";
import { useChatStore } from "../stores/chatStore";
import { useToastStore } from "../stores/toastStore";
import { useT } from "../stores/settingsStore";
import type { Friend, Group, User } from "../types";

export default function ContactsPanel() {
  const t = useT();
  const friends = useFriendStore((s) => s.friends);
  const groups = useFriendStore((s) => s.groups);
  const requests = useFriendStore((s) => s.requests);
  const blockedIds = useFriendStore((s) => s.blockedIds);
  const [tab, setTab] = useState<"friends" | "groups" | "blocked">("friends");
  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [settingsUser, setSettingsUser] = useState<Friend | null>(null);

  const pending = requests.filter((r) => r.status === "pending" && r.toId === useAuthId());

  return (
    <div className="flex h-full w-full flex-col bg-app">
      <div className="flex items-center justify-between border-b bd px-5 py-4">
        <h2 className="text-[15px] font-bold text-1">{t("nav.contacts")}</h2>
        <div className="flex gap-2">
          {tab === "friends" && (
            <SmallBtn onClick={() => setAddOpen(true)}>
              <Plus /> {t("contact.addFriend")}
            </SmallBtn>
          )}
          {tab === "groups" && (
            <>
              <SmallBtn onClick={() => setCreateOpen(true)}>
                <Plus /> {t("contact.createGroup")}
              </SmallBtn>
              <SmallBtn onClick={() => setJoinOpen(true)}>{t("contact.joinGroup")}</SmallBtn>
            </>
          )}
        </div>
      </div>

      {/* 子选项卡 */}
      <div className="flex gap-1 px-5 py-2.5">
        {(["friends", "groups", "blocked"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === k ? "bg-blue-500/15 text-blue-400" : "text-3 hv2 hover:text-1"
            }`}
          >
            {t(`contact.${k}`)}
            {k === "friends" && pending.length > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* ---------- 好友 ---------- */}
        {tab === "friends" && (
          <>
            {pending.length > 0 && (
              <div className="mb-3 rounded-xl border border-amber-500/15 bg-amber-500/8 p-3">
                <div className="mb-2 text-xs font-bold text-amber-300">{t("contact.requests")}</div>
                {pending.map((r) => (
                  <div key={r.id} className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-1">{r.fromNickname || r.fromUsername}</span>
                    <div className="flex gap-1.5">
                      <button
                        className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-emerald-300 hover:bg-emerald-500/25"
                        onClick={() => client.acceptRequest(r.id)}
                      >
                        {t("contact.accept")}
                      </button>
                      <button
                        className="rounded-md bg-soft2 px-2.5 py-1 text-2 hover-bg-soft"
                        onClick={() => client.rejectRequest(r.id)}
                      >
                        {t("contact.reject")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {friends.length === 0 && (
              <div className="py-16 text-center text-xs muted">{t("contact.emptyFriends")}</div>
            )}
            {friends.map((f) => (
              <div
                key={f.id}
                className="group mb-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 transition hv"
              >
                <LetterAvatar text={f.nickname || f.username} blocked={f.blocked} value={f.avatar} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-1">{f.nickname || f.username}</div>
                  <div className="text-[11px] text-3">@{f.username}</div>
                </div>
                <button
                  className="rounded-lg bg-soft2 px-3 py-1.5 text-xs text-1 opacity-0 transition group-hover:opacity-100 hv2"
                  onClick={() => setSettingsUser(f)}
                >
                  {t("contact.friendSettings")}
                </button>
              </div>
            ))}
          </>
        )}

        {/* ---------- 群聊 ---------- */}
        {tab === "groups" && (
          <>
            {groups.length === 0 && (
              <div className="py-16 text-center text-xs muted">{t("contact.emptyGroups")}</div>
            )}
            {groups.map((g) => (
              <GroupRow key={g.id} g={g} />
            ))}
          </>
        )}

        {/* ---------- 黑名单 ---------- */}
        {tab === "blocked" && (
          <>
            {blockedIds.length === 0 && (
              <div className="py-16 text-center text-xs muted">{t("contact.emptyBlocked")}</div>
            )}
            {blockedIds.map((id) => {
              const f = friends.find((x) => x.id === id);
              return (
                <div key={id} className="mb-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 transition hv">
                  <LetterAvatar text={f?.nickname || f?.username || id} blocked value={f?.avatar} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-2">{f?.nickname || f?.username || id}</div>
                    <div className="text-[11px] text-red-400/80">{t("contact.blocked")}</div>
                  </div>
                  <button
                    className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/20"
                    onClick={() => client.unblockUser(id)}
                  >
                    {t("contact.unblock")}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      <AddFriendModal open={addOpen} onClose={() => setAddOpen(false)} />
      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinGroupModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      {settingsUser && (
        <FriendSettingsModal friend={settingsUser} onClose={() => setSettingsUser(null)} />
      )}
    </div>
  );
}

// ================= 子组件 =================

function useAuthId() {
  const u = JSON.parse(localStorage.getItem("abc-user") ?? "null") as User | null;
  return u?.id ?? "";
}

function toast(title: string, body: string, kind?: "info" | "success" | "error") {
  useToastStore.getState().push(title, body, kind);
}

function LetterAvatar({ text, blocked, value }: { text: string; blocked?: boolean; value?: string }) {
  if (value && !blocked) {
    return <AvatarImg value={value} size={44} className="rounded-xl!" />;
  }
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
        blocked ? "bg-soft2 text-3" : "bg-blue-500/18 text-blue-300"
      }`}
    >
      {text.slice(0, 1).toUpperCase()}
    </div>
  );
}

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg bg-soft2 px-3 py-1.5 text-xs font-medium text-1 transition hv2 hover:text-blue-400"
    >
      {children}
    </button>
  );
}

function Plus() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ---------- 群聊行（带群管理入口） ----------
function GroupRow({ g }: { g: Group }) {
  const t = useT();
  const [manageOpen, setManageOpen] = useState(false);
  return (
    <>
      <div className="mb-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 transition hv">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/18 text-violet-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM16.5 8.2a3 3 0 100-6M17.5 14.6c2.3.4 4 2.5 4 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-1">{g.name}</div>
          <div className="text-[11px] text-3">
            {g.memberCount} {t("chat.groupMembers")} · {t("contact.code")}: {g.code}
          </div>
        </div>
        <button
          className="rounded-lg bg-blue-500/12 px-2.5 py-1.5 text-xs text-blue-500 transition hover:bg-blue-500/22"
          onClick={() => setManageOpen(true)}
        >
          {t("group.manage")}
        </button>
        <button
          className="rounded-lg bg-soft2 px-2.5 py-1.5 text-xs text-2 transition hv2 hover:text-1"
          onClick={() => {
            navigator.clipboard?.writeText(g.code).catch(() => {});
            toast(t("contact.copyCode"), g.code, "success");
          }}
        >
          {t("contact.copyCode")}
        </button>
        <button
          className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20"
          onClick={() => client.leaveGroup(g.id)}
        >
          {t("contact.leaveGroup")}
        </button>
      </div>
      {manageOpen && <GroupManageModal group={g} onClose={() => setManageOpen(false)} />}
    </>
  );
}

// ---------- 添加好友 ----------
function AddFriendModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const [q, setQ] = useState("");
  const [found, setFound] = useState<User | null>(null);
  const [err, setErr] = useState("");

  const search = async () => {
    if (!q.trim()) return;
    setErr("");
    setFound(null);
    try {
      const res = await client.searchUser(q.trim());
      setFound(res.user);
    } catch {
      setErr(t("contact.noUser"));
    }
  };

  const sendReq = async () => {
    if (!found) return;
    try {
      await client.sendFriendRequest(found.id);
      toast(t("contact.addFriend"), t("contact.requestSent"), "success");
      onClose();
      setFound(null);
      setQ("");
    } catch {
      setErr(t("toast.error"));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("contact.addFriend")}>
      <div className="flex gap-2">
        <input
          className="input-dark flex-1"
          placeholder={t("contact.addFriendPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button className="btn-accent py-2! px-4 text-sm" onClick={search}>
          {t("chat.search")}
        </button>
      </div>
      {err && <div className="mt-3 text-xs text-red-400">{err}</div>}
      {found && (
        <div className="mt-4 rounded-xl bd bg-soft p-3.5">
          <div className="flex items-center gap-3">
            <AvatarImg value={found.avatar} size={44} className="rounded-xl!" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-1">{found.nickname || found.username}</div>
              <div className="text-[11px] text-3">@{found.username}</div>
            </div>
            <button className="btn-accent py-2! px-4 text-sm" onClick={sendReq}>
              +
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---------- 创建群聊 ----------
function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const g = await client.createGroup(name.trim());
      toast(t("contact.groupCreated", { code: g.group.code }), t("contact.inviteHint"), "success");
      onClose();
      setName("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("contact.createGroup")}>
      <input
        className="input-dark"
        placeholder={t("contact.groupName")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
      />
      <button className="btn-accent mt-4 w-full" disabled={busy || !name.trim()} onClick={create}>
        {t("contact.create")}
      </button>
    </Modal>
  );
}

// ---------- 加入群聊 ----------
function JoinGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  const join = async () => {
    if (!code.trim()) return;
    setErr("");
    try {
      await client.joinGroup(code.trim().toUpperCase());
      toast(t("contact.joinGroup"), t("contact.joinedOk"), "success");
      onClose();
      setCode("");
    } catch (e: any) {
      setErr(e?.message === "bad-code" ? t("contact.noUser") : t("toast.error"));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("contact.joinGroup")}>
      <input
        className="input-dark text-center uppercase tracking-[0.3em]"
        placeholder={t("contact.code")}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && join()}
      />
      {err && <div className="mt-3 text-xs text-red-400">{err}</div>}
      <button className="btn-accent mt-4 w-full" disabled={!code.trim()} onClick={join}>
        {t("contact.join")}
      </button>
    </Modal>
  );
}

// ---------- 好友设置 ----------
function FriendSettingsModal({ friend, onClose }: { friend: Friend; onClose: () => void }) {
  const t = useT();
  const toggleBlock = useFriendStore((s) => s.toggleBlock);

  const onBlock = async () => {
    const next = !friend.blocked;
    toggleBlock(friend.id);
    if (next) await client.blockUser(friend.id);
    else await client.unblockUser(friend.id);
    useChatStore.getState().setBlocked(`dm:${friend.id}`, next);
    onClose();
  };

  const onRemove = async () => {
    await client.removeFriend(friend.id);
    useFriendStore.getState().removeFriend(friend.id);
    useChatStore.getState().removeConv(`dm:${friend.id}`);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={t("contact.friendSettings")}>
      <div className="mb-5 flex items-center gap-3">
        <LetterAvatar text={friend.nickname || friend.username} blocked={friend.blocked} value={friend.avatar} />
        <div>
          <div className="text-sm font-semibold text-1">{friend.nickname || friend.username}</div>
          <div className="text-[11px] text-3">@{friend.username}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <button
          className={`w-full rounded-xl py-2.5 text-sm font-medium transition ${
            friend.blocked
              ? "bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/20"
              : "bg-red-500/12 text-red-300 hover:bg-red-500/22"
          }`}
          onClick={onBlock}
        >
          {friend.blocked ? t("contact.unblock") : t("contact.block")}
        </button>
        <button
          className="w-full rounded-xl bg-soft2 py-2.5 text-sm font-medium text-1 transition hv2"
          onClick={onRemove}
        >
          {t("contact.removeFriend")}
        </button>
      </div>
    </Modal>
  );
}
