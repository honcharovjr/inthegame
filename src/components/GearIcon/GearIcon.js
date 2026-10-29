// A line drawing of one gear slot: hat, earrings, amulet, gloves, ring or
// weapon. Takes the colour of the text.
const SHAPES = {
  hat: (
    <>
      <path d="M2.5 17.5h19" />
      <path d="M6 17.5c0-6.5 2.7-11.5 6-11.5s6 5 6 11.5" />
      <path d="M7.5 13.5h9" />
    </>
  ),
  earrings: (
    <>
      <path d="M7 3v5M17 3v5" />
      <circle cx="7" cy="11.5" r="3.5" />
      <circle cx="17" cy="11.5" r="3.5" />
      <path d="M7 15v3.5M17 15v3.5" />
      <circle cx="7" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </>
  ),
  amulet: (
    <>
      <path d="M4.5 3c0 6 3.4 9 7.5 9s7.5-3 7.5-9" />
      <path d="M12 12v1.5" />
      <path d="M12 13.5l4 4-4 4-4-4z" />
    </>
  ),
  gloves: (
    <path d="M8 21v-6.5L5.3 10.8a1.6 1.6 0 0 1 2.5-2L9 10V4.6a1.5 1.5 0 0 1 3 0V10V3.6a1.5 1.5 0 0 1 3 0V10V5a1.5 1.5 0 0 1 3 0v10c0 3.3-2.2 6-5.5 6z" />
  ),
  ring: (
    <>
      <circle cx="12" cy="15" r="6" />
      <path d="M9.5 6.5L12 3l2.5 3.5L12 9z" />
    </>
  ),
  weapon: (
    <>
      <path d="M20 4l-1 5-9.5 9.5-3-3L16 6z" />
      <path d="M5 14.5l4.5 4.5M3.5 20.5l3-3" />
    </>
  ),
};

export default function GearIcon({ slot, size = 24, strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {SHAPES[slot]}
    </svg>
  );
}
