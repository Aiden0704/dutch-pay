export interface Room {
  id: string;
  name: string;
  host_id: number;
  created_at: string;
  participants: Participant[];
  items: Item[];
}

interface Participant {
  id: number;
  room_id: string;
  user_id: number;
}

interface Item {
  id: number;
  room_id: string;
  name: string;
  amount: number;
  quantity: number;
  created_at: string;
  item_checks: ItemCheck[];
}

interface ItemCheck {
  id: number;
  item_id: number;
  participant_id: number;
  paid_at: string | null;
}

export interface RoomListItem {
  title: string;
  role: 'host' | 'member';
  isCompleted: boolean;
  participantCount: number;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
  completedParticipantCount: number;
  myAmount: number;
}

function calculateOwedAmount(participantId: number, items: Item[]): number {
  return items.reduce((sum, item) => {
    const myCheck = findParticipantCheck(item, participantId);

    if (!myCheck) {
      return sum;
    }
    return sum + (item.amount * item.quantity) / item.item_checks.length;
  }, 0);
}

function isParticipantSettled(participantId: number, items: Item[]): boolean {
  return items.every((item) => {
    const myChecks = findParticipantCheck(item, participantId);

    if (myChecks) {
      return myChecks.paid_at !== null;
    } else {
      return true;
    }
  });
}

function calculateTotalAmount(items: Item[]): number {
  const totalAmount = items.reduce(
    (sum, item) => sum + item.amount * item.quantity,
    0
  );

  return totalAmount;
}

function findParticipantCheck(
  item: Item,
  participantId: number
): ItemCheck | undefined {
  return item.item_checks.find(
    (itemCheck) => itemCheck.participant_id === participantId
  );
}

export function calculateRoomListItems(
  rooms: Room[],
  viewerId: number
): RoomListItem[] {
  return rooms.map((room) => {
    const myParticipant = room.participants.find((participant) => {
      return viewerId === participant.user_id;
    });
    if (!myParticipant) {
      throw new Error('유효한 데이터가 아닙니다');
    }

    const title = room.name;
    const createdAt = room.created_at;
    const role = room.host_id === viewerId ? 'host' : 'member';
    const participantCount = room.participants.length;
    const itemCount = room.items.length;
    const totalAmount = calculateTotalAmount(room.items);
    const myAmount = calculateOwedAmount(myParticipant.id, room.items);
    const nonHostParticipants = room.participants.filter(
      (participant) => participant.user_id !== room.host_id
    );
    const completedParticipantCount = nonHostParticipants.filter(
      (participant) => isParticipantSettled(participant.id, room.items)
    ).length;
    const isCompleted = nonHostParticipants.every((participant) =>
      isParticipantSettled(participant.id, room.items)
    );

    return {
      title,
      createdAt,
      role,
      participantCount,
      itemCount,
      totalAmount,
      myAmount,
      completedParticipantCount,
      isCompleted,
    };
  });
}
