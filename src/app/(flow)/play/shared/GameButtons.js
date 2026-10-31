"use client";

import { useEffect, useState } from "react";
import { BookIcon, SoundIcon, SoundOffIcon } from "@/components/icons";
import { setSoundOn, useSoundOn } from "./feedback";
import ui from "./play.module.css";

// Round icon buttons for a game's top bar. The name shows on hover and is
// what screen readers read.
export function IconAction({ icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={ui.iconAction}
      aria-label={label}
      data-tip={label}
      data-tip-pos="below"
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export function SoundButton() {
  const on = useSoundOn();
  return (
    <IconAction
      icon={on ? <SoundIcon size={18} /> : <SoundOffIcon size={18} />}
      label={on ? "Sound on" : "Sound off"}
      onClick={() => setSoundOn(!on)}
    />
  );
}

// The rules of a game in a pop-up, any game can use it.
// tabs: [{ label, content }]; the first one opens.
export function RulesButton({ title, tabs }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!open) return;
    const close = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <>
      <IconAction icon={<BookIcon size={18} />} label="Rules" onClick={() => setOpen(true)} />
      {open && (
        <div className={ui.dialog} onClick={(event) => event.target === event.currentTarget && setOpen(false)}>
          <div className={ui.dialogPanel} role="dialog" aria-modal="true" aria-labelledby="rules-title">
            <div className={ui.dialogHead}>
              <h2 id="rules-title">{title}</h2>
              <button type="button" className={ui.dialogClose} onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            {tabs.length > 1 && (
              <div className={ui.chips} role="tablist">
                {tabs.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    role="tab"
                    aria-selected={tab === index}
                    className={`${ui.dialogTab} ${tab === index ? ui.dialogTabOn : ""}`}
                    onClick={() => setTab(index)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <div className={ui.dialogBody} role="tabpanel">
              {tabs[tab]?.content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
