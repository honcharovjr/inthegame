"use client";

import { useSyncExternalStore } from "react";

// Sounds and vibration in play mode, made with Web Audio so no sound files
// are loaded. Off when the player turns them off; the choice is kept in the
// browser. Browsers allow sound only after the player has tapped something,
// so an early sound may stay silent.

const KEY = "itg.sound";
const listeners = new Set();
let audio = null;

function read() {
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function useSoundOn() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => true,
  );
}

export function setSoundOn(on) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Without storage the switch lasts until the page closes.
  }
  listeners.forEach((listener) => listener());
}

function context() {
  if (!read()) return null;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") audio.resume();
    return audio;
  } catch {
    return null;
  }
}

// One short tone. start and length in seconds from now.
function tone(ctx, { freq, start = 0, length = 0.12, type = "sine", gain = 0.12 }) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const at = ctx.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  amp.gain.setValueAtTime(gain, at);
  amp.gain.exponentialRampToValueAtTime(0.001, at + length);
  osc.connect(amp).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + length);
}

// Dice hitting the table: a few quick clicks.
export function playRoll() {
  const ctx = context();
  if (!ctx) return;
  [0, 0.05, 0.11, 0.16].forEach((start, index) =>
    tone(ctx, { freq: 180 + index * 40, start, length: 0.05, type: "square", gain: 0.05 }),
  );
}

// A rising fanfare for a Yahtzee.
export function playYahtzee() {
  const ctx = context();
  if (!ctx) return;
  [523, 659, 784, 1047].forEach((freq, index) =>
    tone(ctx, { freq, start: index * 0.11, length: 0.25, type: "triangle", gain: 0.1 }),
  );
}

// Your turn: a soft double ping and a short buzz on phones that can.
export function playYourTurn() {
  if (!read()) return;
  const ctx = context();
  if (ctx) {
    tone(ctx, { freq: 880, length: 0.1 });
    tone(ctx, { freq: 1175, start: 0.12, length: 0.14 });
  }
  try {
    navigator.vibrate?.(120);
  } catch {
    // Not every device can vibrate.
  }
}
