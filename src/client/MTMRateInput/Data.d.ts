export type TabVisibility = {
  inputTab: boolean;
  managementTab: boolean;
};

export interface Bank {
  id: string;
  name: string;
}

export interface CurrencyPair {
  id: string;
  pair: string;
}

export interface Tenor {
  id: string;
  name: string;
}

export interface RateRow {
  id: string;
  currencyPair: string;
  tenor: string;
  bidRate: number | '';
  offerRate: number | '';
  midRate: number | '';
  isEditing: boolean;
  isNew: boolean;
}

export interface FilterState {
  selectedBank: string;
  selectedDate: string;
  selectedCurrencyPair: string;
}

export interface HeaderFiltersProps {
  bankList: Bank[];
  currencyPairs: CurrencyPair[];
  selectedBank: string;
  selectedDate: string;
  selectedCurrencyPair: string;
  onFilterChange: (filters: FilterState) => void;
}

export interface RateInputCellProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder: string;
  disabled?: boolean;
}

export interface RateTableProps {
  data: RateRow[];
  currencyPairs: CurrencyPair[];
  tenors: Tenor[];
  onDataChange: (data: RateRow[]) => void;
  onSaveRow: (row: RateRow) => void;
  onDeleteRow: (id: string) => void;
  onAddRow: () => void;
}
