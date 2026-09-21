import { describe, expect, it } from 'vitest';
import { calculateRoomDetail, calculateRoomListItems, type Room } from './rooms';

function createTestRoom(overrides: Partial<Room> = {}): Room {
  const defaultRoom: Room = {
    id: '방고유ID',
    name: '송년회',
    host_id: 777,
    created_at: '2026-09-11T00:00:00Z',
    participants: [
      { id: 1, room_id: '방고유ID', user_id: 777, is_completed: false },
    ],
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
        { id: 1, room_id: '방고유ID', user_id: 456, is_completed: false }, // 방장
        { id: 2, room_id: '방고유ID', user_id: 123, is_completed: false }, // 나 (참여자)
      ],
    });

    // Act - When
    const result = calculateRoomListItems([testRoom], viewerId);

    // Assert - Then
    expect(result[0].role).toBe('member');
  });

  it('방장을 제외한 모든 참여자가 선택 완료를 누르면 정산이 완료된 것으로 처리된다', () => {
    // Given
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1, is_completed: false },
        { id: 2, room_id: '방고유ID', user_id: 2, is_completed: true },
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
    expect(result[0].isCompleted).toBe(true);
  });

  it('방장을 제외한 참여자 중 선택 완료를 누르지 않은 멤버가 있다면 정산이 완료되지 않은 것으로 처리된다', () => {
    // Given
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1, is_completed: false },
        { id: 2, room_id: '방고유ID', user_id: 2, is_completed: false },
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
          is_completed: false,
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
        { id: 1, room_id: '방고유ID', user_id: 1, is_completed: false },
        { id: 2, room_id: '방고유ID', user_id: 2, is_completed: true },
      ],
    });

    const result = calculateRoomListItems([testRoom], viewerId);
    expect(result[0].isCompleted).toBe(false);
    expect(result[0].completedParticipantCount).toBe(0);
  });

  it('참여자별 선택 완료 여부에 따라 완료 인원 수가 계산된다', () => {
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1, is_completed: false }, // 방장
        { id: 2, room_id: '방고유ID', user_id: 2, is_completed: true }, // A
        { id: 3, room_id: '방고유ID', user_id: 3, is_completed: false }, // B
        { id: 4, room_id: '방고유ID', user_id: 4, is_completed: true }, // C
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
            { id: 1, item_id: 1, participant_id: 2, paid: false },
            { id: 2, item_id: 1, participant_id: 4, paid: false },
          ],
        },
      ],
    });

    const result = calculateRoomListItems([testRoom], viewerId);

    expect(result[0].isCompleted).toBe(false);
    expect(result[0].completedParticipantCount).toBe(2);
  });

  it('자신이 체크한 항목의 금액만 자신이 낼 금액에 포함된다', () => {
    const viewerId = 999;

    const testRoom = createTestRoom({
      host_id: 111,
      participants: [
        { id: 123, room_id: '방고유ID', user_id: 111, is_completed: false },
        { id: 345, room_id: '방고유ID', user_id: 999, is_completed: false },
        { id: 567, room_id: '방고유ID', user_id: 333, is_completed: false },
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
            { id: 1, item_id: 1, participant_id: 123, paid: false }, // 방장
            { id: 2, item_id: 1, participant_id: 345, paid: false }, // 나
            { id: 3, item_id: 1, participant_id: 567, paid: false }, // A
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
            { id: 1, item_id: 2, participant_id: 567, paid: false }, // 내가 체크 안 한 항목 (다른 사람 것)
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
      participants: [
        { id: 111, room_id: '방고유ID', user_id: 123, is_completed: false },
      ],
    });

    expect(() => calculateRoomListItems([testRoom], viewerId)).toThrow();
  });
});

describe('calculateRoomDetail', () => {
  it('전체 항목 금액의 합계가 계산된다', () => {
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1, is_completed: false },
        { id: 2, room_id: '방고유ID', user_id: 2, is_completed: false },
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

    const result = calculateRoomDetail(testRoom, viewerId);

    expect(result.totalAmount).toBe(45000);
  });

  it('내가 체크한 항목의 금액만 내가 낼 금액에 포함된다', () => {
    const viewerId = 999;

    const testRoom = createTestRoom({
      host_id: 111,
      participants: [
        { id: 123, room_id: '방고유ID', user_id: 111, is_completed: false },
        { id: 345, room_id: '방고유ID', user_id: 999, is_completed: false },
      ],
      items: [
        {
          id: 1,
          room_id: '방고유ID',
          name: '국밥',
          amount: 11000,
          quantity: 1,
          created_at: '2026-09-11T00:00:00Z',
          item_checks: [{ id: 1, item_id: 1, participant_id: 345, paid: false }],
        },
        {
          id: 2,
          room_id: '방고유ID',
          name: '수육',
          amount: 23000,
          quantity: 1,
          created_at: '2026-09-11T00:00:00Z',
          item_checks: [{ id: 1, item_id: 2, participant_id: 123, paid: false }],
        },
      ],
    });

    const result = calculateRoomDetail(testRoom, viewerId);

    expect(result.myAmount).toBe(11000);
  });

  it('참여자별로 선택 완료 여부가 그대로 반영된다', () => {
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 999,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1, is_completed: true },
        { id: 2, room_id: '방고유ID', user_id: 2, is_completed: false },
      ],
    });

    const result = calculateRoomDetail(testRoom, viewerId);

    expect(result.participants).toEqual([
      { id: 1, user_id: 1, isCompleted: true },
      { id: 2, user_id: 2, isCompleted: false },
    ]);
  });

  it('방장은 is_completed가 false여도 항상 완료로 표시된다', () => {
    const viewerId = 1;

    const testRoom = createTestRoom({
      host_id: 1,
      participants: [
        { id: 1, room_id: '방고유ID', user_id: 1, is_completed: false },
        { id: 2, room_id: '방고유ID', user_id: 2, is_completed: false },
      ],
    });

    const result = calculateRoomDetail(testRoom, viewerId);
    const hostParticipant = result.participants.find((p) => p.user_id === 1);

    expect(hostParticipant?.isCompleted).toBe(true);
  });

  it('조회하는 사용자가 참여자 목록에 없는 방을 조회하면 에러를 던진다', () => {
    const viewerId = 999;

    const testRoom = createTestRoom({
      host_id: 123,
      participants: [
        { id: 111, room_id: '방고유ID', user_id: 123, is_completed: false },
      ],
    });

    expect(() => calculateRoomDetail(testRoom, viewerId)).toThrow();
  });
});
