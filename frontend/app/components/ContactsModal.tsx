"use client";

import { useEffect, useState } from "react";

const API_URL = "https://scalar-signal-backend.onrender.com";

type Contact = {
  id: number;
  username: string;
  display_name: string;
  phone: string;
  avatar_url?: string | null;
};

type SearchUser = {
  id: number;
  username: string;
  display_name: string;
  phone: string;
  avatar_url?: string | null;
};

type ContactsModalProps = {
  onClose: () => void;
  onConversationCreated: (conversationId: number) => void;
};

export default function ContactsModal({
  onClose,
  onConversationCreated,
}: ContactsModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchText, setSearchText] = useState("");

  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [error, setError] = useState("");

  const loadContacts = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/contacts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load contacts");
      }

      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error(error);
      setError("Could not load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const searchUsers = async () => {
    const token = localStorage.getItem("access_token");

    if (!token || !searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/contacts/search?q=${encodeURIComponent(
          searchText.trim()
        )}`,
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
      setError("Could not search users.");
    } finally {
      setSearching(false);
    }
  };

  const openConversation = async (contactUserId: number) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    setOpeningChat(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/conversations/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contact_user_id: contactUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not open conversation"
        );
      }

      onConversationCreated(data.conversation.id);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not open conversation.");
      }
    } finally {
      setOpeningChat(false);
    }
  };

  const addContact = async (contactUserId: number) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/contacts/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contact_user_id: contactUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add contact");
      }

      await loadContacts();

      setSearchText("");
      setSearchResults([]);

      await openConversation(contactUserId);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not add contact.");
      }
    }
  };

  const toggleMember = (userId: number) => {
    setSelectedMembers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const createGroup = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    if (!groupName.trim()) {
      setError("Please enter a group name.");
      return;
    }

    if (selectedMembers.length === 0) {
      setError("Please select at least one member.");
      return;
    }

    setOpeningChat(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/conversations/group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName.trim(),
          member_ids: selectedMembers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not create group"
        );
      }

      onConversationCreated(data.conversation.id);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not create group.");
      }
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-[#1c1c1e] text-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold">
            {groupMode ? "Create Group" : "Contacts"}
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>

        {!groupMode ? (
          <>
            {/* Search */}
            <div className="border-b border-white/10 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchUsers();
                    }
                  }}
                  placeholder="Search username or phone"
                  className="flex-1 rounded-lg bg-[#2c2c2e] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                />

                <button
                  onClick={searchUsers}
                  className="rounded-lg bg-[#6c5dd3] px-4 py-2 text-sm font-medium hover:bg-[#7b68ee]"
                >
                  Search
                </button>
              </div>

              <button
                onClick={() => {
                  setGroupMode(true);
                  setError("");
                }}
                className="mt-3 w-full rounded-lg border border-white/10 py-2 text-sm hover:bg-white/5"
              >
                Create Group
              </button>
            </div>

            {/* Contacts */}
            <div className="max-h-[500px] overflow-y-auto p-3">
              {error && (
                <p className="mb-3 rounded-lg bg-red-500/10 p-2 text-center text-sm text-red-400">
                  {error}
                </p>
              )}

              {searchText && (
                <div className="mb-4">
                  <p className="mb-2 px-2 text-xs font-semibold uppercase text-white/40">
                    Search Results
                  </p>

                  {searching && (
                    <p className="py-4 text-center text-white/50">
                      Searching...
                    </p>
                  )}

                  {!searching &&
                    searchResults.length === 0 && (
                      <p className="py-4 text-center text-sm text-white/50">
                        No users found.
                      </p>
                    )}

                  {!searching &&
                    searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6c5dd3] text-lg font-semibold">
                            {user.display_name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-medium">
                              {user.display_name}
                            </p>

                            <p className="text-sm text-white/50">
                              @{user.username}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => addContact(user.id)}
                          disabled={openingChat}
                          className="rounded-lg bg-[#6c5dd3] px-3 py-1.5 text-xs font-medium hover:bg-[#7b68ee] disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                </div>
              )}

              <p className="mb-2 px-2 text-xs font-semibold uppercase text-white/40">
                My Contacts
              </p>

              {loading && (
                <p className="py-8 text-center text-white/50">
                  Loading contacts...
                </p>
              )}

              {!loading && contacts.length === 0 && (
                <p className="py-8 text-center text-white/50">
                  No contacts yet.
                </p>
              )}

              {!loading &&
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => openConversation(contact.id)}
                    disabled={openingChat}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/5 disabled:opacity-50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6c5dd3] text-lg font-semibold">
                      {contact.display_name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="font-medium">
                        {contact.display_name}
                      </p>

                      <p className="text-sm text-white/50">
                        @{contact.username}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </>
        ) : (
          <>
            {/* Group name */}
            <div className="p-4">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded-lg bg-[#2c2c2e] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
              />
            </div>

            {error && (
              <p className="mx-4 mb-3 rounded-lg bg-red-500/10 p-2 text-center text-sm text-red-400">
                {error}
              </p>
            )}

            {/* Select members */}
            <div className="max-h-[350px] overflow-y-auto px-3">
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-white/40">
                Select Members
              </p>

              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => toggleMember(contact.id)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6c5dd3] font-semibold">
                      {contact.display_name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="font-medium">
                        {contact.display_name}
                      </p>

                      <p className="text-sm text-white/50">
                        @{contact.username}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      selectedMembers.includes(contact.id)
                        ? "border-[#6c5dd3] bg-[#6c5dd3]"
                        : "border-white/30"
                    }`}
                  >
                    {selectedMembers.includes(contact.id) && "✓"}
                  </div>
                </button>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 border-t border-white/10 p-4">
              <button
                onClick={() => {
                  setGroupMode(false);
                  setGroupName("");
                  setSelectedMembers([]);
                  setError("");
                }}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm hover:bg-white/5"
              >
                Back
              </button>

              <button
                onClick={createGroup}
                disabled={openingChat}
                className="flex-1 rounded-lg bg-[#6c5dd3] py-2 text-sm font-medium hover:bg-[#7b68ee] disabled:opacity-50"
              >
                {openingChat ? "Creating..." : "Create Group"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}