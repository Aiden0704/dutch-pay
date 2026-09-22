export interface Room {
  id: string;
  name: string;
  host_id: number;
  created_at: string;
  is_settled: boolean;
  participants: Participant[];
  items: Item[];
}

interface Participant {
  id: number;
  room_id: string;
  user_id: number;
  is_completed: boolean;
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
  paid: boolean;
}

export interface RoomListItem {
  id: string;
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

export interface RoomDetailParticipant {
  id: number;
  user_id: number;
  isCompleted: boolean;
  amount: number;
}

export interface RoomDetail {
  totalAmount: number;
  myAmount: number;
  isSettled: boolean;
  participants: RoomDetailParticipant[];
}

export function calculateRoomDetail(room: Room, viewerId: number): RoomDetail {
  const myParticipant = room.participants.find(
    (participant) => participant.user_id === viewerId
  );

  if (!myParticipant) {
    throw new Error(`viewerId(${viewerId})가 참여자 목록에 없는 방입니다`);
  }

  const totalAmount = calculateTotalAmount(room.items);
  const myAmount = calculateOwedAmount(myParticipant.id, room.items);
  const participants = room.participants.map((participant) => ({
    id: participant.id,
    user_id: participant.user_id,
    isCompleted:
      participant.user_id === room.host_id ? true : participant.is_completed,
    amount: calculateOwedAmount(participant.id, room.items),
  }));

  return { totalAmount, myAmount, isSettled: room.is_settled, participants };
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
      throw new Error(`viewerId(${viewerId})가 참여자 목록에 없는 방입니다`);
    }

    const id = room.id;
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
    const completedParticipantCount =
      room.items.length > 0
        ? nonHostParticipants.filter((participant) => participant.is_completed)
            .length
        : 0;
    const isCompleted =
      nonHostParticipants.length > 0 &&
      room.items.length > 0 &&
      nonHostParticipants.every((participant) => participant.is_completed);

    return {
      id,
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
