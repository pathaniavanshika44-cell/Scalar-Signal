"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

type Member = {
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
};

type User = {
  id: number;
  username: string;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_online: boolean;
};

type GroupMembersModalProps = {
  conversationId: number;
  onClose: () => void;
};

export default function GroupMembersModal({
  conversationId,
  onClose,
}: GroupMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] = useState<number | null>(
    null
  );

  const [removingUserId, setRemovingUserId] = useState<number | null>(
    null
  );

  const [showAddMember, setShowAddMember] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<number | null>(null);

  async function loadMembers() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/conversations/${conversationId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load members");
      }

      const data = await response.json();

      setMembers(data);
    } catch (error) {
      console.error(error);
      setError("Could not load group members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login again.");
        setLoading(false);
        return;
      }

      try {
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to load current user");
        }

        const userData = await userResponse.json();

        setCurrentUserId(userData.id);

        await loadMembers();
      } catch (error) {
        console.error(error);
        setError("Could not load group members.");
        setLoading(false);
      }
    }

    loadData();
  }, [conversationId]);

  const currentUser = members.find(
    (member) => member.user_id === currentUserId
  );

  const isAdmin = currentUser?.is_admin === true;

  async function searchUsers(value: string) {
    setSearch(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    setSearchLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/contacts/search?q=${encodeURIComponent(value)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      setSearchResults(data);
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function addMember(userId: number) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    setAddingUserId(userId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/conversations/${conversationId}/members`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not add member"
        );
      }

      await loadMembers();

      setSearch("");
      setSearchResults([]);
      setShowAddMember(false);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not add member.");
      }
    } finally {
      setAddingUserId(null);
    }
  }

  async function removeMember(userId: number) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    setRemovingUserId(userId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/conversations/${conversationId}/members/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not remove member"
        );
      }

      setMembers((currentMembers) =>
        currentMembers.filter(
          (member) => member.user_id !== userId
        )
      );
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not remove member.");
      }
    } finally {
      setRemovingUserId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-[#1c1c1e] text-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              Group Members
            </h2>

            <p className="mt-1 text-xs text-white/40">
              {members.length} members
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-2xl text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Add member button */}
        {isAdmin && (
          <div className="border-b border-white/10 p-4">
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="w-full rounded-xl bg-[#6c5dd3] px-4 py-3 text-sm font-semibold hover:bg-[#7b68ee]"
            >
              {showAddMember ? "Cancel" : "Add Member"}
            </button>
          </div>
        )}

        {/* Add member search */}
        {showAddMember && isAdmin && (
          <div className="border-b border-white/10 p-4">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                searchUsers(event.target.value)
              }
              placeholder="Search users..."
              className="w-full rounded-xl bg-[#2b2b2e] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
            />

            <div className="mt-3 max-h-48 overflow-y-auto">
              {searchLoading && (
                <p className="py-3 text-center text-sm text-white/40">
                  Searching...
                </p>
              )}

              {!searchLoading &&
                searchResults.map((user) => {
                  const alreadyMember = members.some(
                    (member) => member.user_id === user.id
                  );

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6c5dd3] font-semibold">
                          {user.display_name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {user.display_name}
                          </p>

                          <p className="text-xs text-white/40">
                            @{user.username}
                          </p>
                        </div>
                      </div>

                      {alreadyMember ? (
                        <span className="text-xs text-white/30">
                          Already added
                        </span>
                      ) : (
                        <button
                          onClick={() => addMember(user.id)}
                          disabled={
                            addingUserId === user.id
                          }
                          className="rounded-lg bg-[#6c5dd3]/20 px-3 py-1.5 text-xs text-[#9b8cff] hover:bg-[#6c5dd3]/30 disabled:opacity-50"
                        >
                          {addingUserId === user.id
                            ? "Adding..."
                            : "Add"}
                        </button>
                      )}
                    </div>
                  );
                })}

              {!searchLoading &&
                search.trim() &&
                searchResults.length === 0 && (
                  <p className="py-3 text-center text-sm text-white/40">
                    No users found
                  </p>
                )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-h-[500px] overflow-y-auto p-3">
          {loading && (
            <p className="py-8 text-center text-white/50">
              Loading members...
            </p>
          )}

          {error && (
            <p className="mb-3 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6c5dd3] text-lg font-semibold">
                    {member.display_name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="font-medium">
                      {member.display_name}
                    </p>

                    <p className="text-sm text-white/50">
                      @{member.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.is_admin && (
                    <span className="rounded-full bg-[#6c5dd3]/20 px-2.5 py-1 text-xs text-[#9b8cff]">
                      Admin
                    </span>
                  )}

                  {isAdmin &&
                    !member.is_admin &&
                    member.user_id !== currentUserId && (
                      <button
                        onClick={() =>
                          removeMember(member.user_id)
                        }
                        disabled={
                          removingUserId === member.user_id
                        }
                        className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {removingUserId === member.user_id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    )}
                </div>
              </div>
            ))}
        </div>

        {/* Admin information */}
        {isAdmin && (
          <div className="border-t border-white/10 p-4">
            <p className="text-center text-xs text-white/40">
              You are a group admin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}