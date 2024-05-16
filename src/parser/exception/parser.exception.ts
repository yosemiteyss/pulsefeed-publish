export class ParserException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParserException';
  }
}
