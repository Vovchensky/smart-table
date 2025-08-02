export function initSearching(searchField) {
    return (query, state, action) => {
        return state[searchField] ? Object.assign({}, query, {
            search: state[searchField]
        }) : query;
    }
}