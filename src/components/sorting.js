import {sortCollection, sortMap} from "../lib/sort.js";

export function initSorting(columns) {
    return (data, state, action) => {
        let field = null;
        let order = null;

        if (action && action.name === 'sort') {
            // @todo: #3.1 — запомнить выбранный режим сортировки

            // @todo: #3.2 — сбросить сортировки остальных колонок
        } else {
            // @todo: #3.3 — получить выбранный режим сортировки
        }

        return sortCollection(data, field, order);
    }
}