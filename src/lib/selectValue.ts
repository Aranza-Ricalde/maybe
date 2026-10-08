export const EMPTY_SELECT_VALUE = "__todos__";

export const toSelectValue = (value: string) => (value === "" ? EMPTY_SELECT_VALUE : value);

export const fromSelectValue = (value: string) => (value === EMPTY_SELECT_VALUE ? "" : value);
