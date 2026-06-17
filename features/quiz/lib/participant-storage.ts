const QUIZ_PARTICIPANT_TOKEN_KEY = "quiz_participant_token";
const QUIZ_SESSION_ID_KEY = "quiz_session_id";
const QUIZ_PARTICIPANT_ID_KEY = "quiz_participant_id";
const QUIZ_DISPLAY_NAME_KEY = "quiz_display_name";
const QUIZ_AVATAR_KEY = "quiz_avatar";

function readItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function writeItem(key: string, value: string) {
  localStorage.setItem(key, value);
  sessionStorage.setItem(key, value);
}

function removeItem(key: string) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function getQuizParticipantToken(): string | null {
  return readItem(QUIZ_PARTICIPANT_TOKEN_KEY);
}

export function getQuizParticipantTokenForSession(sessionId: string): string | null {
  const storedSessionId = readItem(QUIZ_SESSION_ID_KEY);
  if (storedSessionId !== sessionId) return null;
  return readItem(QUIZ_PARTICIPANT_TOKEN_KEY);
}

export function getQuizParticipantId(): string | null {
  return readItem(QUIZ_PARTICIPANT_ID_KEY);
}

export function getQuizDisplayName(): string | null {
  return readItem(QUIZ_DISPLAY_NAME_KEY);
}

export function getQuizAvatar(): string | null {
  return readItem(QUIZ_AVATAR_KEY);
}

export function saveQuizParticipantCredentials(data: {
  participantToken: string;
  sessionId: string;
  displayName: string;
  avatar: string;
  participantId?: string;
}) {
  writeItem(QUIZ_PARTICIPANT_TOKEN_KEY, data.participantToken);
  writeItem(QUIZ_SESSION_ID_KEY, data.sessionId);
  writeItem(QUIZ_DISPLAY_NAME_KEY, data.displayName);
  writeItem(QUIZ_AVATAR_KEY, data.avatar);
  if (data.participantId) {
    writeItem(QUIZ_PARTICIPANT_ID_KEY, data.participantId);
  }
}

export function updateQuizParticipantProfileStorage(data: {
  displayName: string;
  avatar: string;
}) {
  writeItem(QUIZ_DISPLAY_NAME_KEY, data.displayName);
  writeItem(QUIZ_AVATAR_KEY, data.avatar);
}

export function clearQuizParticipantCredentials() {
  removeItem(QUIZ_PARTICIPANT_TOKEN_KEY);
  removeItem(QUIZ_SESSION_ID_KEY);
  removeItem(QUIZ_PARTICIPANT_ID_KEY);
  removeItem(QUIZ_DISPLAY_NAME_KEY);
  removeItem(QUIZ_AVATAR_KEY);
}
