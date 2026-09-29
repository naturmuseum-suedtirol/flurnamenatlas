export const TextColumn = {
  nameDe: 'NAME_DE',
  nameIt: 'NAME_IT',
  nameLld: 'NAME_LLD',
  vernacularDe: 'VERNACULAR',
  vernacularIt: 'VERNACUL_1',
  vernacularDeAlternative: 'VERNACUL_2',
} as const;

export const CategoryColumn = {
  categoryDe: 'CATEGORY_D',
  categoryIt: 'CATEGORY_I',
  categoryLldGherdeina: 'CATEGORY_L',
  categoryLldBadia: 'CATEGORY_1',
  mainCategoryDe: 'MAIN_CATEG',
  mainCategoryIt: 'MAIN_CAT_1',
  subCategoryDe: 'SUB_CATEGO',
  subCategoryIt: 'SUB_CATE_1',
} as const;

export const CoordinateColumn = {
  lon: 'xcoord',
  lat: 'ycoord',
} as const;

export const COLUMNS = [
  ...Object.values(TextColumn),
  ...Object.values(CategoryColumn),
  ...Object.values(CoordinateColumn),
];

export const NAME_COLUMNS = [TextColumn.nameDe, TextColumn.nameIt, TextColumn.nameLld];

export const COORDINATE_SCALE = 1e6;

export type TextField = keyof typeof TextColumn;

export type FlurnamenJson = {
  text: Record<TextField, string[]>;
  categories: string[][];
  category: number[];
  lon: number[];
  lat: number[];
};
