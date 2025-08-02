import {getPages} from "../lib/utils.js";

export const initPagination = ({pages, fromRow, toRow, totalRows}, createPage) => {
    // @todo: #2.3 — подготовить шаблон кнопки для страницы и очистить контейнер

    return (data, state, action) => {
        // @todo: #2.1 — посчитать количество страниц, объявить переменные и константы

        // @todo: #2.6 — обработать действия

        // @todo: #2.4 — получить список видимых страниц и вывести их

        // @todo: #2.5 — обновить статус пагинации

        // @todo: #2.2 — посчитать сколько строк нужно пропустить и получить срез данных
        return data.slice(0, 10);
    }
}