import { fetchRoomDetail, type RoomDetailResponse } from './roomDetail';

const POLL_INTERVAL_MS = 5000;

let generation = 0;
let pollTimer: number | undefined;

export function stopRoomPolling(): void {
  generation++;
  window.clearTimeout(pollTimer);
}

function getRoomSignature(data: RoomDetailResponse): string {
  const completions = data.participants.map(
    (participant) => `${participant.user_id}:${participant.isCompleted}`
  );
  const checks = data.items.map((item) => {
    const otherUserIds = item.checkedParticipants
      .filter((participant) => participant.user_id !== data.viewer_id)
      .map((participant) => participant.user_id);

    return `${item.id}:${otherUserIds.join('.')}`;
  });

  return `${completions.join(',')}|${checks.join(',')}`;
}

export function pollHostRoom(
  root: HTMLElement,
  id: string,
  current: RoomDetailResponse,
  onChanged: (latest: RoomDetailResponse) => void
): void {
  if (current.items.length === 0) {
    stopRoomPolling();
    return;
  }

  const signature = getRoomSignature(current);

  startRoomPolling(
    root,
    id,
    (latest) => getRoomSignature(latest) !== signature,
    onChanged
  );
}

export function pollSettlement(
  root: HTMLElement,
  id: string,
  onChanged: (latest: RoomDetailResponse) => void
): void {
  startRoomPolling(root, id, () => false, onChanged);
}

function startRoomPolling(
  root: HTMLElement,
  id: string,
  hasChanged: (latest: RoomDetailResponse) => boolean,
  onChanged: (latest: RoomDetailResponse) => void
): void {
  stopRoomPolling();

  const currentGeneration = generation;
  const isActive = () =>
    currentGeneration === generation &&
    window.location.pathname === `/rooms/${id}`;
  const isEditing = () => root.querySelector('input, textarea, select') !== null;
  const shouldRender = (latest: RoomDetailResponse) =>
    latest.isSettled || (hasChanged(latest) && !isEditing());

  const poll = async () => {
    if (!isActive()) {
      return;
    }

    if (!document.hidden) {
      try {
        const latest = await fetchRoomDetail(id);

        if (isActive() && shouldRender(latest)) {
          onChanged(latest);
          return;
        }
      } catch {}
    }

    if (isActive()) {
      pollTimer = window.setTimeout(poll, POLL_INTERVAL_MS);
    }
  };

  pollTimer = window.setTimeout(poll, POLL_INTERVAL_MS);
}
