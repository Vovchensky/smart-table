/**
 * Модуль сравнения объектов с настраиваемыми правилами
 *
 * Этот модуль позволяет гибко сравнивать JavaScript объекты,
 * используя различные стратегии сравнения, которые можно настраивать.
 * Это особенно полезно для валидации данных или фильтрации объектов.
 */

// Вспомогательная функция для проверки, является ли значение пустым
// Подробнее: пустыми значениями в JavaScript считаются undefined, null, 
// пустая строка и NaN (Not-a-Number)
const isEmpty = (value) => {
    return value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'number' && isNaN(value));
};

/**
 * Коллекция правил сравнения, которые можно выбирать и применять
 *
 * Подробнее: правила - это функции высшего порядка, то есть функции,
 * которые возвращают другие функции. Это позволяет создавать настраиваемые
 * правила с параметрами.
 */
const rules = {
    // Пропускать поля, которых нет в исходном объекте
    // Подробнее: это помогает избежать ошибок при сравнении, когда целевой объект
    // содержит поля, которых нет в исходном объекте
    skipNonExistentSourceFields: (source) => (key, sourceValue, targetValue) => {
        if (!Object.prototype.hasOwnProperty.call(source, key)) {
            return { skip: true };
        }
        return { skip: false };
    },

    // Пропускать пустые значения в целевом объекте
    // Подробнее: это полезно, когда вы не хотите сравнивать поля,
    // которые не заполнены в форме поиска или фильтре
    skipEmptyTargetValues: () => (key, sourceValue, targetValue) => {
        if (isEmpty(targetValue)) {
            return { skip: true };
        }
        return { skip: false };
    },

    // Возвращать неудачу, если исходное значение пусто, а целевое нет
    // Подробнее: это правило проверяет обязательные поля,
    // требующие непустых значений
    failOnEmptySource: () => (key, sourceValue, targetValue) => {
        if (isEmpty(sourceValue)) {
            return { result: false };
        }
        return { continue: true };
    },

    // Обрабатывать массив как диапазон [от, до]
    // Подробнее: это позволяет проверить, попадает ли число
    // в заданный диапазон. Например, [10, 20] означает от 10 до 20 включительно
    arrayAsRange: () => (key, sourceValue, targetValue) => {
        if (Array.isArray(targetValue)) {
            if (targetValue.length === 2) {
                const [from, to] = targetValue;

                if (!isEmpty(from) && sourceValue < from) {
                    return { result: false };
                }
                if (!isEmpty(to) && sourceValue > to) {
                    return { result: false };
                }
                return { result: true };
            }
            return { result: false };
        }
        return { continue: true };
    },

    // Сравнение на включение подстроки
    // Подробнее: проверяет, содержит ли строка другую строку
    // без учёта регистра. Удобно для поиска по тексту.
    stringIncludes: () => (key, sourceValue, targetValue) => {
        if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
            return { result: sourceValue.includes(targetValue) };
        }
        return { continue: true };
    },

    // Сравнение на включение подстроки без учета регистра
    // Подробнее: аналогично предыдущему, но игнорирует
    // различия между заглавными и строчными буквами
    caseInsensitiveStringIncludes: () => (key, sourceValue, targetValue) => {
        if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
            return { result: sourceValue.toLowerCase().includes(targetValue.toLowerCase()) };
        }
        return { continue: true };
    },

    // Точное совпадение строк
    // Подробнее: в отличие от включения проверяет полное совпадение строк,
    // что полезно для строгих сравнений, например паролей или кодов
    stringExactMatch: () => (key, sourceValue, targetValue) => {
        if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
            return { result: sourceValue === targetValue };
        }
        return { continue: true };
    },

    // Сравнение на точное равенство значений
    // Подробнее: использует оператор === для строгого сравнения,
    // учитывающего как значение, так и тип данных
    exactEquality: () => (key, sourceValue, targetValue) => {
        return { result: sourceValue === targetValue };
    },

    // Глубокое сравнение объектов
    // Подробнее: сравнивает вложенные объекты, преобразуя их в JSON
    // и сравнивая результаты. Подходит для сложных структур данных.
    deepEquality: () => (key, sourceValue, targetValue) => {
        if (typeof sourceValue === 'object' && sourceValue !== null &&
            typeof targetValue === 'object' && targetValue !== null) {
            try {
                return { result: JSON.stringify(sourceValue) === JSON.stringify(targetValue) };
            } catch (e) {
                return { result: false };
            }
        }
        return { continue: true };
    },

    // Сравнение чисел с допуском погрешности
    // Подробнее: полезно при работе с дробными числами,
    // так как из-за особенностей хранения чисел с плавающей точкой
    // они могут иметь небольшие расхождения
    numericTolerance: (tolerance = 0.001) => (key, sourceValue, targetValue) => {
        if (typeof sourceValue === 'number' && typeof targetValue === 'number') {
            return { result: Math.abs(sourceValue - targetValue) <= tolerance };
        }
        return { continue: true };
    },

    // Поиск по нескольким полям с указанным значением целевого поля
    // searchKey: Ключ в целевом объекте, содержащий поисковый запрос
    // searchFields: Массив имен полей в исходном объекте для поиска
    // caseSensitive: Учитывать ли регистр при поиске (по умолчанию: false)
    // 
    // Подробнее: это продвинутое правило, которое позволяет искать
    // одну и ту же строку в нескольких полях объекта, что очень полезно
    // для реализации функций поиска в приложениях
    searchMultipleFields: (searchKey, searchFields, caseSensitive = false) => (key, sourceValue, targetValue, source, target) => {
        // Применять это правило только при обработке ключа поиска
        if (key !== searchKey) {
            return { continue: true };
        }

        // Пропустить, если поисковый запрос пуст
        if (isEmpty(targetValue)) {
            return { skip: true };
        }

        // Убедиться, что поисковый запрос это строка
        const searchTerm = String(targetValue);

        // Проверить, содержит ли какое-либо из указанных полей исходного объекта поисковый запрос
        for (const field of searchFields) {
            if (Object.prototype.hasOwnProperty.call(source, field)) {
                const fieldValue = source[field];

                // Пропустить пустые поля исходного объекта
                if (isEmpty(fieldValue)) {
                    continue;
                }

                // Преобразовать в строку, если еще не строка
                const sourceFieldValue = String(fieldValue);

                // Выполнить поиск с учетом опции чувствительности к регистру
                let found = false;
                if (caseSensitive) {
                    found = sourceFieldValue.includes(searchTerm);
                } else {
                    found = sourceFieldValue.toLowerCase().includes(searchTerm.toLowerCase());
                }

                if (found) {
                    return { result: true };
                }
            }
        }

        // Совпадений не найдено ни в одном поле
        return { result: false };
    }
};

/**
 * Массив правил по умолчанию - экспортируется, но не используется в функции сравнения
 *
 * Подробнее: это набор часто используемых правил, которые можно использовать
 * как отправную точку, но вы всегда можете настроить свой собственный набор
 */
const defaultRules = [
    'skipNonExistentSourceFields',
    'skipEmptyTargetValues',
    'failOnEmptySource',
    'arrayAsRange',
    'stringIncludes',
    'exactEquality'
];

/**
 * Сравнивает исходный объект с целевым объектом, используя предоставленные правила
 *
 * @param {Object} source - Исходный объект для сравнения
 * @param {Object} target - Целевой объект, содержащий критерии сравнения
 * @param {Function[]} rulesList - Массив функций-правил для применения при сравнении
 * @returns {boolean} - True если исходный объект соответствует всем критериям по правилам, иначе false
 *
 * Подробнее: это основная функция модуля, которая проходит по каждому свойству
 * целевого объекта и применяет правила для сравнения с исходным объектом
 */
function compare(source, target, rulesList) {
    // Если любой из входных параметров не является объектом, возвращаем false
    // Подробнее: это защитный код, предотвращающий ошибки при работе с некорректными данными
    if (!source || typeof source !== 'object' || !target || typeof target !== 'object') {
        return false;
    }

    // Правила должны быть предоставлены
    // Подробнее: проверка входных параметров - хорошая практика программирования
    if (!Array.isArray(rulesList) || rulesList.length === 0) {
        throw new Error('Rules list is required for comparison');
    }

    // Проверяем каждое свойство в целевом объекте
    for (const key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            const targetValue = target[key];
            const sourceValue = source[key];

            // Применяем каждое правило по порядку
            let skipProperty = false;
            let ruleResult = null;

            for (const rule of rulesList) {
                const ruleOutput = rule(key, sourceValue, targetValue, source, target);

                // Проверяем, нужно ли пропустить это свойство
                if (ruleOutput.skip === true) {
                    skipProperty = true;
                    break;
                }

                // Проверяем, есть ли у нас окончательный результат
                if (ruleOutput.hasOwnProperty('result')) {
                    ruleResult = ruleOutput.result;
                    break;
                }

                // Продолжаем со следующим правилом, если нет окончательного результата
                if (ruleOutput.continue === true) {
                    continue;
                }
            }

            // Переходим к следующему свойству, если это свойство помечено для пропуска
            if (skipProperty) {
                continue;
            }

            // Возвращаем false, если какое-либо правило не выполнено
            if (ruleResult === false) {
                return false;
            }
        }
    }

    // Если мы прошли все проверки без возврата false, возвращаем true
    return true;
}

/**
 * Создает функцию сравнения с замыканием
 *
 * @param {Array<string>} ruleNames - Массив имен правил для использования
 * @param {Array<Function>} customRules - Массив пользовательских функций-правил
 * @returns {Function} - Функция для сравнения объектов
 *
 * Подробнее: эта функция использует концепцию "замыкания" (closure),
 * чтобы создать настраиваемую функцию сравнения с предварительно заданными правилами.
 * Это позволяет повторно использовать одни и те же настройки сравнения без их
 * повторного определения.
 */
function createComparison(ruleNames, customRules = []) {
    return (source, target) => {
        const rulesList = [
            ...ruleNames.map(ruleName => {
                // Для правил, которым нужны параметры
                if (ruleName === 'skipNonExistentSourceFields') {
                    return rules[ruleName](source);
                }
                return rules[ruleName]();
            }),
            ...customRules
        ];

        return compare(source, target, rulesList);
    };
}

// Экспортируем компоненты модуля
// Подробнее: это делает функции доступными для импорта в другие файлы,
// что необходимо для модульного подхода в современном JavaScript
export {
    compare,
    rules,
    defaultRules,
    createComparison
};