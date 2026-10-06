import { DrizzleAccountsReader } from "../db/readModels/accounts";
import { DrizzleCategoriesReader } from "../db/readModels/categories";
import { DrizzleInboxReader } from "../db/readModels/inbox";
import { DrizzlePlanningReader } from "../db/readModels/planning";
import { DrizzleProfileReader } from "../db/readModels/profile";
import { DrizzleTransactionsReader } from "../db/readModels/transactions";

export const accountsReader = new DrizzleAccountsReader();
export const categoriesReader = new DrizzleCategoriesReader();
export const transactionsReader = new DrizzleTransactionsReader();
export const planningReader = new DrizzlePlanningReader();
export const inboxReader = new DrizzleInboxReader();
export const profileReader = new DrizzleProfileReader();
