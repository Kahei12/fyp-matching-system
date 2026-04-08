import React from 'react';

const svgBase = {
  className: 'stage-glyph-svg',
  width: 40,
  height: 40,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
};

const gStroke = {
  stroke: 'currentColor',
  strokeWidth: 1.65,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Line-art pencil (diagonal), not emoji */
export function PencilGlyph(props) {
  return (
    <svg {...svgBase} {...props}>
      <g {...gStroke}>
        <path d="M4 20v-3.5L15.5 5a2.12 2.12 0 0 1 3 3L7 20H4z" />
        <path d="M13.5 6.5L17.5 10.5" />
        <path d="M5.5 18.5L7 17" />
        <path d="M3 21h3l1.2-1.2" />
      </g>
    </svg>
  );
}

export function StarOutlineGlyph(props) {
  return (
    <svg {...svgBase} {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5l2.35 5.55 6 .55-4.55 4.1 1.45 6.3L12 16.9 6.75 19.5 8.2 13.2 3.65 9.1l6-.55L12 3.5z"
      />
    </svg>
  );
}

export function ListGlyph(props) {
  return (
    <svg {...svgBase} {...props}>
      <g {...gStroke}>
        <line x1="5" y1="7" x2="19" y2="7" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="5" y1="17" x2="19" y2="17" />
      </g>
    </svg>
  );
}

/** Simple cog outline for teacher “maintain pool” stage */
export function GearOutlineGlyph(props) {
  return (
    <svg {...svgBase} {...props}>
      <g {...gStroke}>
        <circle cx="12" cy="12" r="3.25" />
        <path d="M12 2v2.2M12 19.8V22M4.2 12H2M22 12h-2.2M5.6 5.6 4 4M20 20l-1.6-1.6M18.4 5.6 20 4M4 20l1.6-1.6" />
      </g>
    </svg>
  );
}

/**
 * @param {'pencil' | 'star' | 'list' | 'gear'} name
 */
export function StageGlyph({ name, ...rest }) {
  switch (name) {
    case 'pencil':
      return <PencilGlyph {...rest} />;
    case 'star':
      return <StarOutlineGlyph {...rest} />;
    case 'list':
      return <ListGlyph {...rest} />;
    case 'gear':
      return <GearOutlineGlyph {...rest} />;
    default:
      return null;
  }
}

/** Circle with checkmark (assignment success) */
export function CheckCircleGlyph(props) {
  return (
    <svg {...svgBase} {...props}>
      <g {...gStroke}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l2.5 2.5L16 9" />
      </g>
    </svg>
  );
}

/** Simple clock (pending state) */
export function ClockOutlineGlyph(props) {
  return (
    <svg {...svgBase} {...props}>
      <g {...gStroke}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </g>
    </svg>
  );
}

/** Bell outline (notifications) */
export function BellOutlineGlyph(props) {
  return (
    <svg {...svgBase} {...props}>
      <g {...gStroke}>
        <path d="M12 3a5 5 0 0 0-5 5v3.5L5 15h14l-2-3.5V8a5 5 0 0 0-5-5z" />
        <path d="M10 18a2 2 0 0 0 4 0" />
      </g>
    </svg>
  );
}

/** Magnifying glass (empty search / no results) */
export function SearchOutlineGlyph(props) {
  return (
    <svg {...svgBase} {...props}>
      <g {...gStroke}>
        <circle cx="11" cy="11" r="6" />
        <path d="M20 20l-4.5-4.5" />
      </g>
    </svg>
  );
}

const compactSvg = {
  ...svgBase,
  width: 20,
  height: 20,
};

/** Drag handle (six dots) */
export function GripVerticalGlyph(props) {
  return (
    <svg {...compactSvg} viewBox="0 0 12 20" {...props}>
      <g fill="currentColor">
        <circle cx="4" cy="4" r="1.35" />
        <circle cx="8" cy="4" r="1.35" />
        <circle cx="4" cy="10" r="1.35" />
        <circle cx="8" cy="10" r="1.35" />
        <circle cx="4" cy="16" r="1.35" />
        <circle cx="8" cy="16" r="1.35" />
      </g>
    </svg>
  );
}

export function ChevronUpGlyph(props) {
  return (
    <svg {...compactSvg} viewBox="0 0 24 24" style={{ display: 'block' }} {...props}>
      <path
        d="M7 14l5-5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownGlyph(props) {
  return (
    <svg {...compactSvg} viewBox="0 0 24 24" style={{ display: 'block' }} {...props}>
      <path
        d="M7 10l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
