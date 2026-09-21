import checkIcon from '../../assets/icons/check.svg?raw';
import trashIcon from '../../assets/icons/trash.svg?raw';
import { escapeHtml } from '../../shared/escapeHtml';
import styles from './itemChecklist.module.css';

export interface ChecklistItem {
  id: number;
  name: string;
  quantity: number;
  amount: number;
  checkedParticipants: { user_id: number; name: string }[];
}

interface RenderItemChecklistHTMLParams {
  items: ChecklistItem[];
  viewerId: number;
}

export function renderItemChecklistHTML({
  items,
  viewerId,
}: RenderItemChecklistHTMLParams): string {
  if (items.length === 0) {
    return `<div class="${styles.emptyState}">
      <p class="${styles.emptyStateIcon}">🧾</p>
      <p class="${styles.emptyStateText}">항목을 추가해주세요</p>
    </div>`;
  }

  const selectedCount = items.filter((item) =>
    item.checkedParticipants.some((p) => p.user_id === viewerId)
  ).length;
  const selectAllIcon = selectedCount === items.length ? '−' : '+';

  const rowsHtml = items
    .map((item) => {
      const isChecked = item.checkedParticipants.some(
        (p) => p.user_id === viewerId
      );
      const checkedClass = isChecked ? styles['checkbox--checked'] : '';
      const itemTotal = item.amount * item.quantity;
      const perPersonText =
        item.checkedParticipants.length > 0
          ? `1인 ${Math.round(itemTotal / item.checkedParticipants.length).toLocaleString()}원`
          : '';
      const tagsHtml = item.checkedParticipants
        .map((participant) => {
          const meClass =
            participant.user_id === viewerId ? styles['tag--me'] : '';
          return `<span class="${styles.tag} ${meClass}" data-user-id="${participant.user_id}">${escapeHtml(participant.name)}</span>`;
        })
        .join('');

      return `
        <div class="${styles.row}" data-item-row data-item-id="${item.id}" data-checked="${isChecked}" data-item-total="${itemTotal}">
          <button class="${styles.checkbox} ${checkedClass}" type="button" data-checkbox aria-label="체크">
            <span class="${styles.checkboxIcon}" data-checkbox-icon>${isChecked ? checkIcon : ''}</span>
          </button>
          <div class="${styles.body}">
            <div class="${styles.titleRow}">
              <span class="${styles.name}">${escapeHtml(item.name)}</span>
              ${item.quantity > 1 ? `<span class="${styles.quantity}">x${item.quantity}</span>` : ''}
            </div>
            <div class="${styles.tags}" data-tags>${tagsHtml}</div>
          </div>
          <div class="${styles.amountBlock}">
            <span class="${styles.amount}">${itemTotal.toLocaleString()}원</span>
            <span class="${styles.perPerson}" data-per-person>${perPersonText}</span>
          </div>
          <button class="${styles.deleteButton}" type="button" data-delete-item aria-label="항목 삭제">${trashIcon}</button>
        </div>
      `;
    })
    .join('');

  return `
    <div class="${styles.selectAllRow}">
      <button class="${styles.selectAllTrigger}" type="button" data-select-all>
        <span class="${styles.selectAllIcon}" data-select-all-icon>${selectAllIcon}</span>
        <span>전체 선택</span>
      </button>
      <span class="${styles.selectedCount}" data-selected-count>${selectedCount}/${items.length} 선택됨</span>
    </div>
    <div class="${styles.list}">
      ${rowsHtml}
    </div>
  `;
}

interface BindItemChecklistOptions {
  roomId: string;
  viewerId: number;
  viewerName: string;
  onChange: () => void;
  onMyAmountDelta: (delta: number) => void;
}

export function bindItemChecklist(
  container: HTMLElement,
  {
    roomId,
    viewerId,
    viewerName,
    onChange,
    onMyAmountDelta,
  }: BindItemChecklistOptions
): void {
  async function setChecked(
    itemId: string,
    nextChecked: boolean
  ): Promise<boolean> {
    const response = await fetch(
      `/api/rooms/${roomId}/items/${itemId}/checks`,
      { method: nextChecked ? 'POST' : 'DELETE' }
    );
    return response.ok;
  }

  function updatePerPerson(row: HTMLElement) {
    const total = Number(row.dataset.itemTotal ?? 0);
    const tagCount = row.querySelectorAll('[data-tags] > *').length;
    const perPersonElement = row.querySelector('[data-per-person]');

    if (!perPersonElement) {
      return;
    }

    perPersonElement.textContent =
      tagCount > 0
        ? `1인 ${Math.round(total / tagCount).toLocaleString()}원`
        : '';
  }

  function updateSelectAllSummary() {
    const rows = Array.from(
      container.querySelectorAll<HTMLElement>('[data-item-row]')
    );
    const selectedCount = rows.filter(
      (row) => row.dataset.checked === 'true'
    ).length;

    const countElement = container.querySelector('[data-selected-count]');
    const iconElement = container.querySelector('[data-select-all-icon]');

    if (countElement) {
      countElement.textContent = `${selectedCount}/${rows.length} 선택됨`;
    }
    if (iconElement) {
      iconElement.textContent = selectedCount === rows.length ? '−' : '+';
    }
  }

  function setRowChecked(row: HTMLElement, checked: boolean) {
    const total = Number(row.dataset.itemTotal ?? 0);
    const tagsContainer = row.querySelector('[data-tags]');
    const oldTagCount = tagsContainer?.children.length ?? 0;
    const wasChecked = row.dataset.checked === 'true';
    const oldMyShare = wasChecked && oldTagCount > 0 ? total / oldTagCount : 0;

    row.dataset.checked = String(checked);
    row
      .querySelector('[data-checkbox]')
      ?.classList.toggle(styles['checkbox--checked'], checked);
    const checkboxIcon = row.querySelector('[data-checkbox-icon]');
    if (checkboxIcon) {
      checkboxIcon.innerHTML = checked ? checkIcon : '';
    }

    const myTag = tagsContainer?.querySelector(`[data-user-id="${viewerId}"]`);

    if (checked && !myTag) {
      tagsContainer?.insertAdjacentHTML(
        'beforeend',
        `<span class="${styles.tag} ${styles['tag--me']}" data-user-id="${viewerId}">${escapeHtml(viewerName)}</span>`
      );
    } else if (!checked && myTag) {
      myTag.remove();
    }

    updatePerPerson(row);
    updateSelectAllSummary();

    const newTagCount = tagsContainer?.children.length ?? 0;
    const newMyShare = checked && newTagCount > 0 ? total / newTagCount : 0;

    onMyAmountDelta(newMyShare - oldMyShare);
  }

  const selectAllButton = container.querySelector<HTMLButtonElement>(
    '[data-select-all]'
  );
  selectAllButton?.addEventListener('click', async () => {
    const rows = Array.from(
      container.querySelectorAll<HTMLElement>('[data-item-row]')
    );
    const allChecked = rows.every((row) => row.dataset.checked === 'true');
    const targetRows = rows.filter(
      (row) => (row.dataset.checked === 'true') === allChecked
    );

    targetRows.forEach((row) => setRowChecked(row, !allChecked));

    await Promise.all(
      targetRows.map((row) =>
        setChecked(row.dataset.itemId as string, !allChecked)
      )
    );

    onChange();
  });

  container
    .querySelectorAll<HTMLElement>('[data-item-row]')
    .forEach((row) => {
      row.querySelector('[data-checkbox]')?.addEventListener('click', async () => {
        const itemId = row.dataset.itemId as string;
        const isChecked = row.dataset.checked === 'true';

        setRowChecked(row, !isChecked);
        const ok = await setChecked(itemId, !isChecked);

        if (!ok) {
          setRowChecked(row, isChecked);
          return;
        }

        onChange();
      });

      row
        .querySelector('[data-delete-item]')
        ?.addEventListener('click', async () => {
          const itemId = row.dataset.itemId as string;

          row.remove();
          updateSelectAllSummary();

          await fetch(`/api/rooms/${roomId}/items/${itemId}`, {
            method: 'DELETE',
          });

          onChange();
        });
    });
}
