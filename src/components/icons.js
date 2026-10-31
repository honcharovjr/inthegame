// Small stroke icons. They inherit the text colour.
function Icon({ size = 14, children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      {children}
    </svg>
  );
}

export function UsersIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17 14a5.5 5.5 0 0 1 3.5 5" />
    </Icon>
  );
}

export function ClockIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />
    </Icon>
  );
}

export function SearchIcon(props) {
  return (
    <Icon {...props}>
      <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
    </Icon>
  );
}

export function PlusIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function TrashIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />
    </Icon>
  );
}

export function ChevronDownIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  );
}

export function CopyIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9 9h10v10H9zM5 15V5h10" />
    </Icon>
  );
}

export function CheckIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function LinkIcon(props) {
  return (
    <Icon {...props}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Icon>
  );
}

export function LinkOffIcon(props) {
  return (
    <Icon {...props}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1M4 4l16 16" />
    </Icon>
  );
}

export function ResetIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" />
    </Icon>
  );
}

export function AlertIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.4v.1" />
    </Icon>
  );
}

export function InfoIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6v.1" />
    </Icon>
  );
}

export function CalendarIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 5 5zM3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  );
}

export function PenIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1zM14.5 6.5l3 3" />
    </Icon>
  );
}

export function CloseIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function TrophyIcon(props) {
  return (
    <Icon {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" />
    </Icon>
  );
}

export function ArrowLeftIcon(props) {
  return (
    <Icon {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Icon>
  );
}

export function LogoutIcon(props) {
  return (
    <Icon {...props}>
      <path d="M10 4H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h4M15 8l4 4-4 4M19 12H9" />
    </Icon>
  );
}

export function LockIcon(props) {
  return (
    <Icon {...props}>
      <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
    </Icon>
  );
}

export function DiceIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="9" cy="9" r="1.1" fill="currentColor" />
      <circle cx="15" cy="15" r="1.1" fill="currentColor" />
      <circle cx="15" cy="9" r="1.1" fill="currentColor" />
      <circle cx="9" cy="15" r="1.1" fill="currentColor" />
    </Icon>
  );
}

export function ExpandIcon(props) {
  return (
    <Icon {...props}>
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
    </Icon>
  );
}

export function CollapseIcon(props) {
  return (
    <Icon {...props}>
      <path d="M20 10h-6V4M4 14h6v6M14 10l7-7M10 14l-7 7" />
    </Icon>
  );
}

export function BookIcon(props) {
  return (
    <Icon {...props}>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </Icon>
  );
}

export function SoundIcon(props) {
  return (
    <Icon {...props}>
      <path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
    </Icon>
  );
}

export function SoundOffIcon(props) {
  return (
    <Icon {...props}>
      <path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6" />
    </Icon>
  );
}

export function FlagIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    </Icon>
  );
}
