import './fonts/ys-display/fonts.css'
import './style.css'

import {initData} from "./data.js";
import {processFormData} from "./lib/utils.js";

import {initTable} from "./components/table.js";
import {initSorting} from './components/sorting.js'
import {initFiltering} from './components/filtering.js'
import {initSearching} from './components/searching.js'

import {initPagination} from './components/pagination.js'


const api = initData();

let state = {
    rowsPerPage: 10,
    page: 1
};

async function render(action) {
    if (action) {
        if (action.tagName === 'INPUT' && action.type === 'radio' && action.name === 'page') {
            state.page = parseInt(action.value) || state.page;
        } else if (action.tagName === 'SELECT' && action.name === 'rowsPerPage') {
            state.rowsPerPage = parseInt(action.value) || 10;
            state.page = 1;
            }
    }
    
    const formData = new FormData(sampleTable.container);
    const formState = processFormData(formData);
    
    Object.keys(formState).forEach(key => {
        if (key !== 'page' && key !== 'rowsPerPage') {
            state[key] = formState[key];
        }
    });
    
    let query = {};
    
    query = applySearching(query, state, action);
    query = applyFiltering(query, state, action);
    query = applySorting(query, state, action);
    query = applyPagination(query, state, action);
    
    const { total, items } = await api.getRecords(query);
    
    updatePagination(total, query);
    sampleTable.render(items);
}

const sampleTable = initTable({
    tableTemplate: 'table',
    rowTemplate: 'row',
    before: ['search', 'header', 'filter'],
    after: ['pagination']
}, render);

const applySearching = initSearching('search');

const {applyFiltering, updateIndexes} = initFiltering(sampleTable.filter.elements);

const {applyPagination, updatePagination} = initPagination(
    sampleTable.pagination.elements,
    (el, page, isCurrent) => {
        const input = el.querySelector('input');
        const label = el.querySelector('span');
        input.value = page;
        input.checked = isCurrent;
        label.textContent = page;
        return el;
    }
);

const applySorting = initSorting([
    sampleTable.header.elements.sortByDate,
    sampleTable.header.elements.sortByTotal
]);

const appRoot = document.querySelector('#app');
appRoot.appendChild(sampleTable.container);

async function init() {
    const indexes = await api.getIndexes();

    updateIndexes(sampleTable.filter.elements, {
        searchBySeller: indexes.sellers
    });
}

init().then(render);
