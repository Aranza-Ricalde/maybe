export class StatementImportCancelledError extends Error {
  constructor() {
    super("La importación se canceló y no se guardó ningún cambio.");
  }
}

export class ImportNotFoundError extends Error {}

export class UndoNotPossibleError extends Error {}
