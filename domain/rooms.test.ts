import { describe, expect, it } from 'vitest';
import { calculateRoomListItems, type Room } from './rooms';

function createTestRoom(overrides: Partial<Room> = {}): Room {
  const defaultRoom: Room = {
    id: '방고유ID',
    name: '송년회',
    host_id: 777,
    created_at: '2026-09-11T00:00:00Z',
    participants: [{ id: 1, room_id: '방고유ID', user_id: 777 }],
    items: [],
  };

  return { ...defaultRoom, ...overrides };
}

// 테스트 시나리오
// 1. 내가 방장인 경우 / 멤버인 경우
// 2. 해당 정산방이 완료 / 미완료 경우

describe('calculateRoomListItems', () => {
  it('내가 만든 방에서는 자신은 방장으로 표시된다', () => {
    // Arrange - Given
    const viewerId = 777;
    const testRoom = createTestRoom();

    // Act - When
    const result = calculateRoomListItems([testRoom], viewerId);

    // Assert - Then
    expect(result[0].role).toBe('host');
  });

  it('다른 사람이 만든 방에 참여하면 멤버로 표시된다', () => {
    // Arrange - Given
    const viewerId = 123;

    const testRoom = createTestRoom({
      host_id: 456,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 456 }, // 방장
        { id: 2, room_id: '방고유ID', user_id: 123 }, // 나 (참여자)
      ],
    });

    // Act - When
    const result = calculateRoomListItems([testRoom], viewerId);

    // Assert - Then
    expect(result[0].role).toBe('member');
  });

  it('방장을 제외한 모든 참여자가 결제를 완료하면 정산이 완료된 것으로 처리된다', () => {
    // Given
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1 },
        { id: 2, room_id: '방고유ID', user_id: 2 },
      ],
      items: [
        {
          id: 1,
          room_id: '방고유ID',
          name: '삼겹살',
          amount: 15000,
          quantity: 3,
          created_at: '2026-09-11T00:00:00Z',
          item_checks: [{ id: 1, item_id: 1, participant_id: 2, paid: true }],
        },
      ],
    });

    // When
    const result = calculateRoomListItems([testRoom], viewerId);

    // Then
    expect(result[0].isCompleted).toBe(true);
  });

  it('방장을 제외한 참여자 중 결제를 완료하지 않은 멤버가 있다면 정산이 완료되지 않은 것으로 처리된다', () => {
    // Given
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1 },
        { id: 2, room_id: '방고유ID', user_id: 2 },
      ],
      items: [
        {
          id: 1,
          room_id: '방고유ID',
          name: '삼겹살',
          amount: 15000,
          quantity: 3,
          created_at: '2026-09-11T00:00:00Z',
          item_checks: [{ id: 1, item_id: 1, participant_id: 2, paid: false }],
        },
      ],
    });

    // When
    const result = calculateRoomListItems([testRoom], viewerId);

    // Then
    expect(result[0].isCompleted).toBe(false);
  });

  it('참여자가 방장 혼자라면 정산이 완료되지 않은 것으로 처리된다', () => {
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        {
          id: 1,
          room_id: '방고유ID',
          user_id: 1,
        },
      ],

      items: [
        {
          id: 1,
          room_id: '방고유ID',
          name: '삼겹살',
          amount: 15000,
          quantity: 3,
          created_at: '2026-09-11T00:00:00Z',
          item_checks: [{ id: 1, item_id: 1, participant_id: 1, paid: false }],
        },
      ],
    });

    const result = calculateRoomListItems([testRoom], viewerId);
    expect(result[0].isCompleted).toBe(false);
  });

  it('참여자는 있지만 항목이 하나도 없으면 정산이 완료되지 않은 것으로 처리된다', () => {
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1 },
        { id: 2, room_id: '방고유ID', user_id: 2 },
      ],
    });

    const result = calculateRoomListItems([testRoom], viewerId);
    expect(result[0].isCompleted).toBe(false);
    expect(result[0].completedParticipantCount).toBe(0);
  });

  it('자신이 지불하지 않아도 될 항목이 있는 참여자는 체크하지 않을 시, 그 항목에 대해 완료로 취급된다', () => {
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1 }, // 방장
        { id: 2, room_id: '방고유ID', user_id: 2 }, // A 참여자
        { id: 3, room_id: '방고유ID', user_id: 3 }, // B 참여자 (이 항목엔 체크 없음)
        { id: 4, room_id: '방고유ID', user_id: 4 }, // C 참여자
      ],
      items: [
        {
          id: 1,
          room_id: '방고유ID',
          name: '소주',
          amount: 5000,
          quantity: 3,
          created_at: '2026-09-11T00:00:00Z',
          item_checks: [
            { id: 1, item_id: 1, participant_id: 2, paid: true }, // A 체크
            { id: 2, item_id: 1, participant_id: 4, paid: true }, // C 체크
          ],
        },
      ],
    });

    const result = calculateRoomListItems([testRoom], viewerId);

    expect(result[0].isCompleted).toBe(true);
    expect(result[0].completedParticipantCount).toBe(3);
  });

  it('자신이 체크한 항목의 금액만 자신이 낼 금액에 포함된다', () => {
    const viewerId = 999;

    const testRoom = createTestRoom({
      host_id: 111,
      participants: [
        { id: 123, room_id: '방고유ID', user_id: 111 },
        { id: 345, room_id: '방고유ID', user_id: 999 },
        { id: 567, room_id: '방고유ID', user_id: 333 },
      ],
      items: [
        {
          id: 1,
          room_id: '방고유ID',
          name: '국밥',
          amount: 11000,
          quantity: 3,
          created_at: '2026-09-11T00:00:00Z',
          item_checks: [
            { id: 1, item_id: 1, participant_id: 123, paid: true }, // 방장
            { id: 2, item_id: 1, participant_id: 345, paid: true }, // 나
            { id: 3, item_id: 1, participant_id: 567, paid: true }, // A
          ],
        },

        {
          id: 2,
          room_id: '방고유ID',
          name: '수육',
          amount: 23000,
          quantity: 1,
          created_at: '2026-09-11T00:00:00Z',
          item_checks: [
            { id: 1, item_id: 2, participant_id: 567, paid: true }, // 내가 체크 안 한 항목 (다른 사람 것)
          ],
        },
      ],
    });

    const result = calculateRoomListItems([testRoom], viewerId);

    expect(result[0].myAmount).toBe(11000);
  });

  it('조회하는 사용자가 참여자 목록에 없는 방을 조회하면 에러를 던진다', () => {
    const viewerId = 999;

    const testRoom = createTestRoom({
      host_id: 123,
      participants: [{ id: 111, room_id: '방고유ID', user_id: 123 }],
    });

    expect(() => calculateRoomListItems([testRoom], viewerId)).toThrow();
  });
});
