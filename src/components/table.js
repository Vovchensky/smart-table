import {cloneTemplate} from "../lib/utils.js";

export function initTable(settings, onAction) {
    const {tableTemplate, rowTemplate, before, after} = settings;
    const root = cloneTemplate(tableTemplate);

    before.reverse().forEach(subName => {
        root[subName] = cloneTemplate(subName);
        root.container.prepend(root[subName].container);
    });

    after.forEach(subName => {
        root[subName] = cloneTemplate(subName);
        root.container.append(root[subName].container);
    });

    root.container.addEventListener('change', (e) => {
        if (e.target.type === 'radio' && e.target.name === 'page') {
            onAction(e.target);
        } else if (e.target.tagName === 'SELECT' && e.target.name === 'rowsPerPage') {
            onAction(e.target);
        } else if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            onAction();
        } else {
            onAction();
        }
    });

    root.container.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            onAction();
        }
    });

    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            onAction();
        }
    });

    root.container.addEventListener('reset', () => {
        setTimeout(onAction);
    });

    root.container.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT')) {
            onAction();
        } else if (e.submitter) {
            onAction(e.submitter);
        } else {
            onAction();
        }
    });

    root.container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
            e.preventDefault();
            e.stopPropagation();
            onAction();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
            e.preventDefault();
            e.stopPropagation();
            onAction();
        }
    });

    const render = (data) => {
        const nextRows = data.map(item => { 
            const row = cloneTemplate(rowTemplate)
            Object.keys(item).forEach(key => { 
                if (row.elements[key]) {
                    row.elements[key].textContent = item[key]
                }
             })
             return row.container
         });
        root.elements.rows.replaceChildren(...nextRows);
    }

    return {...root, render};
}