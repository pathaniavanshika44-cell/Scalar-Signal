"use client";

type SettingsModalProps = {
  onClose: () => void;
};

export default function SettingsModal({
  onClose,
}: SettingsModalProps) {
  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    window.location.href = "/auth";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-[#1c1c1e] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold">
            Settings
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Settings */}
        <div className="p-4">
          <div className="rounded-xl px-4 py-4 hover:bg-white/5">
            <p className="font-medium">
              Privacy
            </p>

            <p className="mt-1 text-sm text-white/40">
              Privacy settings
            </p>
          </div>

          <div className="rounded-xl px-4 py-4 hover:bg-white/5">
            <p className="font-medium">
              Notifications
            </p>

            <p className="mt-1 text-sm text-white/40">
              Notification settings
            </p>
          </div>

          <div className="rounded-xl px-4 py-4 hover:bg-white/5">
            <p className="font-medium">
              Appearance
            </p>

            <p className="mt-1 text-sm text-white/40">
              Appearance settings
            </p>
          </div>

          {/* Logout */}
          <div className="mt-3 border-t border-white/10 pt-3">
            <button
              onClick={logout}
              className="w-full rounded-xl px-4 py-4 text-left text-red-400 hover:bg-red-500/10"
            >
              <p className="font-medium">
                Log out
              </p>

              <p className="mt-1 text-sm text-white/40">
                Sign out of this account
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}