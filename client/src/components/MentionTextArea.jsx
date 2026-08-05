import React, { useRef, useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";

const MENTION_REGEX = /@([a-zA-Z0-9_]{3,})/g;

// Splits text into plain strings and styled @mention spans — used to
// render the "highlight layer" that sits visually behind the real textarea.
const renderHighlighted = (text) => {
  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(MENTION_REGEX);
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push( 
      <span key={`${match.index}-${match[1]}`} className="text-primary font-semibold">
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  // Trailing space so a newline right at the end of the text doesn't
  // collapse to zero height in the highlight layer and desync the scroll
  // position from the real textarea sitting on top of it.
  parts.push(" ");
  return parts;
};

// Instagram-style @mention input: as you type "@username", the mention
// turns blue immediately inside the box (not just after posting).
//
// How it works: a real <textarea> handles all actual typing/cursor/paste
// behavior as normal, but its own text is rendered fully transparent —
// only its blinking caret is visible. Directly behind it, absolutely
// positioned and pixel-aligned via identical font/padding, sits a plain
// <div> rendering the same text with @mentions wrapped in colored spans.
// What you see is that div; what you're actually typing into is the
// invisible textarea on top of it.
//
// Positioning is done via inline `style`, not Tailwind classes — inline
// styles always take effect regardless of class ordering/specificity, so
// there's no risk of "absolute"/"inset-0" silently losing to something
// else and the two layers rendering as separate stacked boxes.
const MentionTextarea = ({ value, onValueChange, placeholder, className, required }) => {
  const { axios } = useAppContext();
  const textareaRef = useRef(null);
  const backdropRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStart, setMentionStart] = useState(null); // index of the triggering '@', or null

  // Debounced @mention suggestion lookup.
  useEffect(() => {
    if (mentionStart === null) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const query = value.slice(mentionStart + 1, cursor);
    if (!query) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const { data } = await axios.get("/api/auth/search-users", { params: { q: query } });
        if (data.success) {
          setSuggestions(data.users);
          setShowSuggestions(data.users.length > 0);
        }
      } catch (error) {
        // silent — autocomplete just doesn't show anything this keystroke
      }
    }, 250);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mentionStart]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onValueChange(newValue);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setMentionStart(null);
      return;
    }

    const between = textBeforeCursor.slice(atIndex + 1);
    const precedingChar = atIndex === 0 ? " " : newValue[atIndex - 1];
    const isValidStart = atIndex === 0 || /\s/.test(precedingChar);

    setMentionStart(isValidStart && !/\s/.test(between) ? atIndex : null);
  };

  const handleSelect = (username) => {
    if (mentionStart === null || !textareaRef.current) return;

    const cursor = textareaRef.current.selectionStart;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const newValue = `${before}@${username} ${after}`;

    onValueChange(newValue);
    setShowSuggestions(false);
    setMentionStart(null);

    requestAnimationFrame(() => {
      const newCursor = before.length + username.length + 2; // "@" + username + trailing space
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
    });
  };

  // Keeps the highlight layer scrolled to match the real textarea once
  // the text overflows the visible height — otherwise they'd drift apart
  // and the colors would land on the wrong lines.
  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Highlight layer — what the user actually SEES. Same classes as the
          textarea (padding/border/font/size) so text lines up exactly.
          Positioning forced via inline style so it reliably stacks BEHIND
          the textarea instead of rendering as its own block below it. */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={`${className} pointer-events-none whitespace-pre-wrap wrap-break-word overflow-hidden`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          boxSizing: "border-box",
        }}
      >
        {renderHighlighted(value)}
      </div>

      {/* Real input — what the user actually TYPES into. Text is made
          transparent via inline style (which always beats utility classes),
          so only the caret is visible; the colored layer behind it shows
          through everywhere else. */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        required={required}
        spellCheck={false}
        className={`${className} placeholder:text-[#241F2E]/35`}
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          backgroundColor: "transparent",
          color: "transparent",
          caretColor: "#241F2E",
          boxSizing: "border-box",
        }}
      />

      {showSuggestions && (
        <div
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto"
          style={{
            position: "absolute",
            zIndex: 20,
            left: 0,
            right: 0,
            top: "100%",
            marginTop: "4px",
          }}
        >
          {suggestions.map((u) => (
            <button
              key={u._id}
              type="button"
              onClick={() => handleSelect(u.username)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold overflow-hidden shrink-0">
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  u.name?.charAt(0).toUpperCase() || "?"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-800 truncate">{u.name}</p>
                <p className="text-xs text-primary truncate">@{u.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
