export type ContractId = string;
export type ContractISODateTime = string;

export type ContractJsonPrimitive = string | number | boolean | null;
export type ContractJsonValue =
  | ContractJsonPrimitive
  | ContractJsonValue[]
  | { [key: string]: ContractJsonValue };
export type ContractJsonObject = Record<string, ContractJsonValue>;
